// ─────────────────────────────────────────────────────────────────────────────
// PULZ Edge Function: clerk-webhook
//
// Receives Clerk webhook events and syncs user data to Supabase.
// Uses the service role key to bypass RLS (server-side only).
//
// Setup in Clerk dashboard:
//   1. Go to Webhooks → Add Endpoint
//   2. URL: https://<your-project-ref>.supabase.co/functions/v1/clerk-webhook
//   3. Subscribe to: user.created, user.updated, user.deleted
//   4. Copy the Signing Secret → set as CLERK_WEBHOOK_SECRET env var
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Webhook } from 'https://esm.sh/svix@1.24.0'
import { corsHeaders } from '../_shared/cors.ts'

interface ClerkUserEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted'
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string | null
    first_name: string | null
    last_name: string | null
    created_at: number
    updated_at: number
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const webhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET')
  if (!webhookSecret) {
    return new Response('Missing CLERK_WEBHOOK_SECRET', { status: 500 })
  }

  // ── Verify Svix signature ─────────────────────────────────────────────────
  const svixId        = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing Svix headers', { status: 400 })
  }

  const body = await req.text()

  let event: ClerkUserEvent
  try {
    const wh = new Webhook(webhookSecret)
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent
  } catch {
    return new Response('Invalid webhook signature', { status: 401 })
  }

  // ── Supabase admin client (bypasses RLS) ──────────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const { type, data } = event

  // ── Resolve primary email ─────────────────────────────────────────────────
  const primaryEmail = data.primary_email_address_id
    ? data.email_addresses.find(e => e.id === data.primary_email_address_id)?.email_address ?? null
    : data.email_addresses[0]?.email_address ?? null

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null

  // ── Handle event ──────────────────────────────────────────────────────────
  switch (type) {
    case 'user.created': {
      const { error } = await supabase.from('users').insert({
        clerk_id:   data.id,
        email:      primaryEmail,
        name:       fullName,
        created_at: new Date(data.created_at).toISOString(),
        updated_at: new Date(data.updated_at).toISOString(),
      })
      if (error) {
        console.error('user.created insert error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }
      console.log(`Created user: ${data.id}`)
      break
    }

    case 'user.updated': {
      const { error } = await supabase
        .from('users')
        .update({
          email:      primaryEmail,
          name:       fullName,
          updated_at: new Date(data.updated_at).toISOString(),
        })
        .eq('clerk_id', data.id)
      if (error) {
        console.error('user.updated error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }
      console.log(`Updated user: ${data.id}`)
      break
    }

    case 'user.deleted': {
      // Cascades will remove episodes, biomarker_readings, devices, etc.
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('clerk_id', data.id)
      if (error) {
        console.error('user.deleted error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }
      console.log(`Deleted user: ${data.id}`)
      break
    }

    default:
      console.log(`Unhandled event type: ${type}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
})
