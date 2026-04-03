// ─────────────────────────────────────────────────────────────────────────────
// PulZ Edge Function: self-training
//
// Builds a personal biomarker baseline per user by computing running statistics
// over their historical readings. Called:
//   - After every 50 new readings (trigger from app or a scheduled job)
//   - On-demand from the dashboard
//
// The algorithm:
//   1. Fetch the user's last N readings (default 500, min 50 for calibration)
//   2. Compute mean and standard deviation for BPM, sweat, movement
//   3. Set thresholds at: mean + (sensitivity_factor × std_dev)
//   4. Mark `is_calibrated = true` once sample_count >= MIN_CALIBRATION_SAMPLES
//
// POST body (optional):
//   { max_samples?: number }   // default 500
//
// Response:
//   { updated: true, baseline: UserBaseline, sample_count: number }
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const MIN_CALIBRATION_SAMPLES = 100
const DEFAULT_MAX_SAMPLES = 500

function computeStats(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 }
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  return { mean, std: Math.sqrt(variance) }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  // User-scoped client to read their own data
  const userSupabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  // Admin client to write baselines (bypasses RLS)
  const adminSupabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  // ── Parse options ─────────────────────────────────────────────────────────
  let maxSamples = DEFAULT_MAX_SAMPLES
  try {
    const body = await req.json().catch(() => ({}))
    if (typeof body.max_samples === 'number' && body.max_samples > 0) {
      maxSamples = Math.min(body.max_samples, 2000)
    }
  } catch {
    // Use defaults
  }

  // ── Get current user ──────────────────────────────────────────────────────
  const { data: profile, error: profileError } = await userSupabase
    .from('users')
    .select('clerk_id')
    .maybeSingle()
  if (profileError || !profile) {
    return new Response('User profile not found', { status: 404 })
  }

  const clerkId = profile.clerk_id

  // ── Fetch recent biomarker readings ───────────────────────────────────────
  const { data: readings, error: readingsError } = await userSupabase
    .from('biomarker_readings')
    .select('bpm, sweat_level, movement')
    .eq('clerk_id', clerkId)
    .order('recorded_at', { ascending: false })
    .limit(maxSamples)

  if (readingsError) {
    return new Response(JSON.stringify({ error: readingsError.message }), { status: 500 })
  }

  if (!readings || readings.length < 10) {
    return new Response(
      JSON.stringify({ updated: false, reason: 'Not enough readings. Minimum 10 required.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }

  // ── Compute per-signal statistics ─────────────────────────────────────────
  const bpmValues   = readings.map(r => r.bpm).filter((v): v is number => v != null)
  const sweatValues = readings.map(r => r.sweat_level).filter((v): v is number => v != null)
  const movValues   = readings.map(r => r.movement).filter((v): v is number => v != null)

  const bpmStats   = computeStats(bpmValues)
  const sweatStats = computeStats(sweatValues)
  const movStats   = computeStats(movValues)

  // ── Fetch current sensitivity factor (user may have adjusted it) ──────────
  const { data: existingBaseline } = await adminSupabase
    .from('user_baselines')
    .select('sensitivity_factor')
    .eq('clerk_id', clerkId)
    .maybeSingle()

  const sensitivityFactor = existingBaseline?.sensitivity_factor ?? 2.0

  // ── Compute thresholds ────────────────────────────────────────────────────
  const bpmThreshold   = bpmStats.mean   + sensitivityFactor * bpmStats.std
  const sweatThreshold = sweatStats.mean + sensitivityFactor * sweatStats.std
  const movThreshold   = movStats.mean   - sensitivityFactor * movStats.std  // low movement = risk

  const sampleCount     = readings.length
  const isCalibrated    = sampleCount >= MIN_CALIBRATION_SAMPLES

  // ── Upsert baseline ───────────────────────────────────────────────────────
  const { data: updatedBaseline, error: upsertError } = await adminSupabase
    .from('user_baselines')
    .upsert(
      {
        clerk_id:                clerkId,
        avg_resting_bpm:         bpmStats.mean,
        bpm_std_dev:             bpmStats.std,
        bpm_episode_threshold:   bpmThreshold,
        avg_sweat_level:         sweatStats.mean,
        sweat_std_dev:           sweatStats.std,
        sweat_episode_threshold: sweatThreshold,
        avg_movement:            movStats.mean,
        movement_std_dev:        movStats.std,
        movement_low_threshold:  Math.max(0, movThreshold),
        sample_count:            sampleCount,
        is_calibrated:           isCalibrated,
        last_trained_at:         new Date().toISOString(),
        updated_at:              new Date().toISOString(),
      },
      { onConflict: 'clerk_id' }
    )
    .select()
    .single()

  if (upsertError) {
    console.error('Baseline upsert error:', upsertError)
    return new Response(JSON.stringify({ error: upsertError.message }), { status: 500 })
  }

  console.log(
    `Baseline updated for ${clerkId}: ` +
    `samples=${sampleCount}, calibrated=${isCalibrated}, ` +
    `bpm_threshold=${bpmThreshold.toFixed(1)}`
  )

  return new Response(
    JSON.stringify({
      updated:      true,
      is_calibrated: isCalibrated,
      sample_count:  sampleCount,
      baseline:      updatedBaseline,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
})
