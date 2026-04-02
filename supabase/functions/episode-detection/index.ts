// ─────────────────────────────────────────────────────────────────────────────
// PULZ Edge Function: episode-detection
//
// Analyzes a window of recent biomarker readings against the user's personal
// baseline to produce an episode risk score.
//
// POST body:
//   {
//     readings: BiomarkerReading[]   // 1–10 most recent readings
//   }
//
// Response:
//   {
//     risk_level: 'low' | 'medium' | 'high'
//     risk_score: number              // 0–100
//     signals: {
//       bpm_elevated: boolean
//       sweat_elevated: boolean
//       movement_low: boolean
//     }
//     recommendation: string
//     using_personal_baseline: boolean
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Population defaults — used until a personal baseline is calibrated
const POPULATION_DEFAULTS = {
  avg_resting_bpm:        72,
  bpm_std_dev:            12,
  bpm_episode_threshold:  96,   // ~72 + 2.0 × 12
  avg_sweat_level:        30,
  sweat_std_dev:          15,
  sweat_episode_threshold: 60,  // ~30 + 2.0 × 15
  avg_movement:           400,
  movement_std_dev:       200,
  movement_low_threshold: 0,    // ~400 - 2.0 × 200
}

interface Reading {
  bpm:         number | null
  sweat_level: number | null
  movement:    number | null
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function zScore(value: number, avg: number, std: number): number {
  if (std === 0) return 0
  return (value - avg) / std
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── Auth: extract Clerk user ID from JWT ──────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Supabase client with the user's Clerk JWT (respects RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  // Admin client to read baselines (baselines are updated by service role)
  const adminSupabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  // ── Parse body ────────────────────────────────────────────────────────────
  let readings: Reading[]
  try {
    const body = await req.json()
    readings = body.readings ?? []
    if (!Array.isArray(readings) || readings.length === 0) {
      return new Response('readings array is required and must not be empty', { status: 400 })
    }
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  // ── Get current user's clerk_id from their profile ────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('clerk_id')
    .maybeSingle()
  if (profileError || !profile) {
    return new Response('User profile not found', { status: 404 })
  }

  // ── Fetch personal baseline ───────────────────────────────────────────────
  const { data: baseline } = await adminSupabase
    .from('user_baselines')
    .select('*')
    .eq('clerk_id', profile.clerk_id)
    .maybeSingle()

  const usingPersonalBaseline = baseline?.is_calibrated === true
  const b = usingPersonalBaseline ? baseline! : POPULATION_DEFAULTS

  // ── Aggregate readings window ─────────────────────────────────────────────
  const bpmValues   = readings.map(r => r.bpm).filter((v): v is number => v != null)
  const sweatValues = readings.map(r => r.sweat_level).filter((v): v is number => v != null)
  const movValues   = readings.map(r => r.movement).filter((v): v is number => v != null)

  const avgBpm   = bpmValues.length   > 0 ? mean(bpmValues)   : null
  const avgSweat = sweatValues.length > 0 ? mean(sweatValues) : null
  const avgMov   = movValues.length   > 0 ? mean(movValues)   : null

  // ── Compute z-scores ──────────────────────────────────────────────────────
  const bpmZ   = avgBpm   != null ? zScore(avgBpm,   b.avg_resting_bpm ?? 72, b.bpm_std_dev ?? 12)   : 0
  const sweatZ = avgSweat != null ? zScore(avgSweat, b.avg_sweat_level ?? 30, b.sweat_std_dev ?? 15) : 0
  // For movement: low movement = high risk, so we invert the z-score
  const movZ   = avgMov   != null ? -zScore(avgMov, b.avg_movement ?? 400, b.movement_std_dev ?? 200) : 0

  // ── Binary signal flags ───────────────────────────────────────────────────
  const threshold = b.sensitivity_factor ?? 2.0
  const bpmElevated   = bpmZ   > threshold
  const sweatElevated = sweatZ > threshold
  const movLow        = movZ   > threshold

  // ── Risk score (0–100) using weighted combination ─────────────────────────
  // BPM is the strongest predictor, sweat second, low movement third.
  const rawScore = (bpmZ * 0.5 + sweatZ * 0.35 + movZ * 0.15)
  // Clamp to 0–100 range assuming z-scores of ~0–4 map to 0–100
  const riskScore = Math.max(0, Math.min(100, Math.round((rawScore / 4) * 100)))

  const riskLevel: 'low' | 'medium' | 'high' =
    riskScore >= 70 ? 'high' :
    riskScore >= 40 ? 'medium' : 'low'

  const recommendations: Record<'low' | 'medium' | 'high', string> = {
    low:    'Your body signals look calm. Keep going.',
    medium: 'You might be feeling some tension. Consider a short breathing pause.',
    high:   'Your body is showing stress signals. This might be a good moment to pause.',
  }

  return new Response(
    JSON.stringify({
      risk_level:              riskLevel,
      risk_score:              riskScore,
      signals: {
        bpm_elevated:   bpmElevated,
        sweat_elevated: sweatElevated,
        movement_low:   movLow,
      },
      recommendation:          recommendations[riskLevel],
      using_personal_baseline: usingPersonalBaseline,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
})
