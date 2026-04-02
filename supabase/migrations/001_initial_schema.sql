-- ─────────────────────────────────────────────────────────────────────────────
-- PULZ — Initial Database Schema
-- ─────────────────────────────────────────────────────────────────────────────
-- RLS pattern: all user-owned tables use (auth.jwt() ->> 'sub') = clerk_id
-- This requires Clerk JWT template to be configured in Supabase.
-- See supabase/config.toml for setup instructions.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: users
-- Created by the clerk-webhook edge function on user.created event.
-- Updated by clerk-webhook on user.updated, and by the app on profile changes.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id                TEXT UNIQUE NOT NULL,
  email                   TEXT,
  name                    TEXT,
  age                     INTEGER CHECK (age > 0 AND age < 150),
  language                TEXT DEFAULT 'en' CHECK (language IN ('en', 'ro')),
  primary_challenge       TEXT CHECK (primary_challenge IN ('binge', 'emotional', 'both')),
  triggers                TEXT[] DEFAULT '{}',
  goals                   TEXT[] DEFAULT '{}',
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  notification_prefs      JSONB DEFAULT '{"checkins": true, "episodes": true, "summary": true}'::JSONB,
  onboarding_complete     BOOLEAN DEFAULT FALSE,
  stripe_customer_id      TEXT UNIQUE,
  created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: episodes
-- One row per eating episode (binge, emotional, urge, or prevented).
-- was_prevented = TRUE means the user used the "Pause" feature and stopped.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.episodes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id         TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  episode_type     TEXT NOT NULL CHECK (episode_type IN ('binge', 'emotional', 'urge', 'prevented')),
  mood_before      INTEGER CHECK (mood_before BETWEEN 1 AND 5),
  mood_after       INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  triggered_by     TEXT[] DEFAULT '{}',
  intensity        INTEGER CHECK (intensity BETWEEN 1 AND 10),
  notes            TEXT,
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  was_prevented    BOOLEAN DEFAULT FALSE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: devices
-- Connected wearable devices (Garmin, Apple Watch, etc.).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.devices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id          TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  device_type       TEXT NOT NULL CHECK (device_type IN ('garmin', 'apple_watch', 'fitbit', 'other')),
  device_identifier TEXT NOT NULL,
  connected_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_sync_at      TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT TRUE NOT NULL,
  UNIQUE (clerk_id, device_identifier)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: biomarker_readings
-- Raw sensor data from wearables. High-volume; consider partitioning by month
-- once the dataset grows beyond ~1M rows per user.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.biomarker_readings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id     TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  device_id    UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  bpm          INTEGER CHECK (bpm > 0 AND bpm < 300),
  temperature  DECIMAL(4, 1),
  sweat_level  INTEGER CHECK (sweat_level BETWEEN 0 AND 100),
  movement     INTEGER CHECK (movement >= 0),
  recorded_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: user_baselines
-- One row per user. Maintained by the self-training edge function.
-- Contains statistical baselines derived from the user's own biomarker history.
-- Thresholds are auto-calibrated: mean + (sensitivity_factor × std_dev).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_baselines (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id                TEXT UNIQUE NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  -- BPM statistics
  avg_resting_bpm         DECIMAL(6, 2),
  bpm_std_dev             DECIMAL(6, 2),
  bpm_episode_threshold   DECIMAL(6, 2),   -- avg + sensitivity_factor × std_dev
  -- Sweat statistics
  avg_sweat_level         DECIMAL(6, 2),
  sweat_std_dev           DECIMAL(6, 2),
  sweat_episode_threshold DECIMAL(6, 2),
  -- Movement statistics
  avg_movement            DECIMAL(10, 2),
  movement_std_dev        DECIMAL(8, 2),
  movement_low_threshold  DECIMAL(10, 2),  -- avg - sensitivity_factor × std_dev
  -- Algorithm metadata
  sample_count            INTEGER DEFAULT 0 NOT NULL,
  sensitivity_factor      DECIMAL(3, 1) DEFAULT 2.0 NOT NULL, -- std devs from mean for alerting
  is_calibrated           BOOLEAN DEFAULT FALSE NOT NULL,      -- true after >= 100 readings
  last_trained_at         TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: subscriptions
-- Stripe subscription state. Managed exclusively by the stripe-webhook function.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id                TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT UNIQUE,
  stripe_customer_id      TEXT,
  stripe_price_id         TEXT,
  status                  TEXT NOT NULL DEFAULT 'incomplete' CHECK (
                            status IN (
                              'active', 'canceled', 'incomplete',
                              'incomplete_expired', 'past_due', 'trialing', 'unpaid'
                            )
                          ),
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT FALSE NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_episodes_clerk_id         ON public.episodes (clerk_id);
CREATE INDEX IF NOT EXISTS idx_episodes_created_at       ON public.episodes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_biomarker_clerk_id        ON public.biomarker_readings (clerk_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_recorded_at     ON public.biomarker_readings (recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_biomarker_clerk_recorded  ON public.biomarker_readings (clerk_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_devices_clerk_id          ON public.devices (clerk_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_clerk_id    ON public.subscriptions (clerk_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_cust ON public.subscriptions (stripe_customer_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biomarker_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_baselines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions      ENABLE ROW LEVEL SECURITY;

-- ── users ────────────────────────────────────────────────────────────────────
-- SELECT/UPDATE: own row only. INSERT/DELETE handled by clerk-webhook (service role).
CREATE POLICY "users: read own"   ON public.users
  FOR SELECT USING ((auth.jwt() ->> 'sub') = clerk_id);

CREATE POLICY "users: update own" ON public.users
  FOR UPDATE USING ((auth.jwt() ->> 'sub') = clerk_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = clerk_id);

-- ── episodes ─────────────────────────────────────────────────────────────────
CREATE POLICY "episodes: all own" ON public.episodes
  FOR ALL USING ((auth.jwt() ->> 'sub') = clerk_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = clerk_id);

-- ── devices ──────────────────────────────────────────────────────────────────
CREATE POLICY "devices: all own" ON public.devices
  FOR ALL USING ((auth.jwt() ->> 'sub') = clerk_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = clerk_id);

-- ── biomarker_readings ───────────────────────────────────────────────────────
CREATE POLICY "biomarkers: all own" ON public.biomarker_readings
  FOR ALL USING ((auth.jwt() ->> 'sub') = clerk_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = clerk_id);

-- ── user_baselines ───────────────────────────────────────────────────────────
-- SELECT/UPDATE only; INSERT is done by self-training function (service role).
CREATE POLICY "baselines: read own"   ON public.user_baselines
  FOR SELECT USING ((auth.jwt() ->> 'sub') = clerk_id);

CREATE POLICY "baselines: update own" ON public.user_baselines
  FOR UPDATE USING ((auth.jwt() ->> 'sub') = clerk_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = clerk_id);

-- ── subscriptions ────────────────────────────────────────────────────────────
-- Read-only from the client; all writes via stripe-webhook (service role).
CREATE POLICY "subscriptions: read own" ON public.subscriptions
  FOR SELECT USING ((auth.jwt() ->> 'sub') = clerk_id);
