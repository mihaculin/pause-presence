-- ─────────────────────────────────────────────────────────────────────────────
-- PulZ — Notes table + Episode manual log fields
-- ─────────────────────────────────────────────────────────────────────────────

-- ── notes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id     TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  is_important BOOLEAN DEFAULT FALSE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_clerk_id  ON public.notes (clerk_id);
CREATE INDEX IF NOT EXISTS idx_notes_important ON public.notes (clerk_id, is_important)
  WHERE is_important = TRUE;

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes: all own" ON public.notes
  FOR ALL USING  ((auth.jwt() ->> 'sub') = clerk_id)
  WITH CHECK     ((auth.jwt() ->> 'sub') = clerk_id);

-- ── Extend episodes with manual log fields ────────────────────────────────────
ALTER TABLE public.episodes
  ADD COLUMN IF NOT EXISTS log_status       TEXT CHECK (log_status IN ('episode', 'unsure', 'avoided', 'other')),
  ADD COLUMN IF NOT EXISTS log_status_other TEXT,
  ADD COLUMN IF NOT EXISTS emotions         TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS what_triggered   TEXT,
  ADD COLUMN IF NOT EXISTS what_i_was_doing TEXT,
  ADD COLUMN IF NOT EXISTS what_helped      TEXT;
