-- ─────────────────────────────────────────────────────────────────────────────
-- PULZ — Auto-update triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- Generic function to stamp updated_at on any table
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- users
CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- user_baselines
CREATE OR REPLACE TRIGGER user_baselines_updated_at
  BEFORE UPDATE ON public.user_baselines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- subscriptions
CREATE OR REPLACE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-create a user_baselines row when a user is inserted
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_user_baseline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_baselines (clerk_id)
  VALUES (NEW.clerk_id)
  ON CONFLICT (clerk_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER users_create_baseline
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_baseline();
