// ─────────────────────────────────────────────────────────────────────────────
// PulZ Edge Function: stripe-webhook
//
// Listens to Stripe events and keeps the `subscriptions` table in sync.
// Uses the service role key — never exposes secrets to the browser.
//
// Setup in Stripe dashboard:
//   1. Go to Developers → Webhooks → Add Endpoint
//   2. URL: https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
//   3. Subscribe to events:
//        checkout.session.completed
//        customer.subscription.created
//        customer.subscription.updated
//        customer.subscription.deleted
//        invoice.payment_failed
//   4. Copy the Signing Secret → set as STRIPE_WEBHOOK_SECRET env var
//
// The clerk_id is stored in Stripe as customer metadata: { clerk_id: "..." }
// Set this when creating the Stripe customer (see create-checkout edge function).
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret   = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeSecretKey || !webhookSecret) {
    return new Response('Missing Stripe environment variables', { status: 500 })
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  })

  // ── Verify Stripe signature ───────────────────────────────────────────────
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe signature verification failed:', err)
    return new Response('Invalid Stripe signature', { status: 401 })
  }

  // ── Supabase admin client ─────────────────────────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  // ── Handle events ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      // New subscription created via checkout
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const clerkId = session.metadata?.clerk_id
        if (!clerkId) {
          console.error('checkout.session.completed: missing clerk_id in metadata')
          break
        }

        // Store the Stripe customer ID on the user record
        await supabase
          .from('users')
          .update({ stripe_customer_id: session.customer as string })
          .eq('clerk_id', clerkId)

        console.log(`Checkout completed for clerk_id=${clerkId}`)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        // Look up clerk_id via customer metadata or users table
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
        const clerkId  = customer.metadata?.clerk_id

        if (!clerkId) {
          console.error(`No clerk_id in customer metadata for customer ${customerId}`)
          break
        }

        const priceId = sub.items.data[0]?.price?.id ?? null

        await supabase
          .from('subscriptions')
          .upsert(
            {
              clerk_id:               clerkId,
              stripe_subscription_id: sub.id,
              stripe_customer_id:     customerId,
              stripe_price_id:        priceId,
              status:                 sub.status,
              current_period_start:   new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end:     new Date(sub.current_period_end * 1000).toISOString(),
              cancel_at_period_end:   sub.cancel_at_period_end,
              updated_at:             new Date().toISOString(),
            },
            { onConflict: 'stripe_subscription_id' }
          )

        console.log(`Subscription ${event.type}: ${sub.id} → ${sub.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)

        console.log(`Subscription canceled: ${sub.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice
        const subId      = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id

        if (subId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due', updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', subId)
          console.log(`Payment failed for subscription: ${subId}`)
        }
        break
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`)
    }
  } catch (err) {
    console.error('Error processing Stripe event:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
})
