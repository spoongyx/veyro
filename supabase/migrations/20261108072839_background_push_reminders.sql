-- Ascned background reminders: Web Push subscriptions and a server-side reminder queue.
-- Safe to re-run: only creates missing objects and replaces its own functions/policies.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS tasks_due_reminders_idx
  ON public.tasks (reminder_time)
  WHERE reminder_time IS NOT NULL
    AND reminder_sent_at IS NULL
    AND status <> 'done';

CREATE OR REPLACE FUNCTION public.reset_task_reminder_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reminder_time IS DISTINCT FROM OLD.reminder_time THEN
    NEW.reminder_sent_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_task_reminder_sent() FROM PUBLIC;

DROP TRIGGER IF EXISTS tasks_reset_reminder_sent ON public.tasks;
CREATE TRIGGER tasks_reset_reminder_sent
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_task_reminder_sent();

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
  ON public.push_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS push_subscriptions_enabled_idx
  ON public.push_subscriptions (user_id)
  WHERE reminders_enabled;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users read own push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users insert own push subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users update own push subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users delete own push subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_push_subscription_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_push_subscription_updated_at() FROM PUBLIC;

DROP TRIGGER IF EXISTS push_subscriptions_touch_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_touch_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_push_subscription_updated_at();

CREATE OR REPLACE FUNCTION public.save_push_subscription(
  p_endpoint TEXT,
  p_p256dh TEXT,
  p_auth TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_reminders_enabled BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_endpoint IS NULL OR length(p_endpoint) < 20 OR length(p_endpoint) > 2048 THEN
    RAISE EXCEPTION 'Invalid push endpoint';
  END IF;
  IF p_p256dh IS NULL OR length(p_p256dh) < 20 OR length(p_p256dh) > 1024 THEN
    RAISE EXCEPTION 'Invalid push key';
  END IF;
  IF p_auth IS NULL OR length(p_auth) < 8 OR length(p_auth) > 512 THEN
    RAISE EXCEPTION 'Invalid push auth';
  END IF;

  DELETE FROM public.push_subscriptions
   WHERE endpoint = p_endpoint
     AND user_id <> uid;

  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, reminders_enabled)
  VALUES (uid, p_endpoint, p_p256dh, p_auth, left(coalesce(p_user_agent, ''), 500), coalesce(p_reminders_enabled, TRUE))
  ON CONFLICT (endpoint) DO UPDATE
    SET p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent,
        reminders_enabled = EXCLUDED.reminders_enabled,
        updated_at = NOW()
    WHERE public.push_subscriptions.user_id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.save_push_subscription(TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_push_subscription(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_push_reminders_enabled(p_enabled BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.push_subscriptions
     SET reminders_enabled = coalesce(p_enabled, FALSE),
         updated_at = NOW()
   WHERE user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.set_push_reminders_enabled(BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_push_reminders_enabled(BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_due_reminders(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (id UUID, user_id UUID, title TEXT, reminder_time TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH due AS (
    SELECT t.id
      FROM public.tasks t
     WHERE t.status <> 'done'
       AND t.reminder_time IS NOT NULL
       AND t.reminder_sent_at IS NULL
       AND t.reminder_time <= NOW()
       AND t.reminder_time >= NOW() - INTERVAL '20 minutes'
     ORDER BY t.reminder_time
     LIMIT greatest(1, least(coalesce(p_limit, 50), 200))
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.tasks t
     SET reminder_sent_at = NOW()
    FROM due
   WHERE t.id = due.id
  RETURNING t.id, t.user_id, t.title, t.reminder_time;
$$;

REVOKE ALL ON FUNCTION public.claim_due_reminders(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_due_reminders(INTEGER) TO service_role;

DO $$
DECLARE
  existing_job BIGINT;
BEGIN
  SELECT jobid INTO existing_job
    FROM cron.job
   WHERE jobname = 'ascned-send-reminders'
   LIMIT 1;

  IF existing_job IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job);
  END IF;
END;
$$;

SELECT cron.schedule(
  'ascned-send-reminders',
  '* * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://veyro-six-sigma.vercel.app/api/cron/reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ascned_cron_secret' LIMIT 1),
        ''
      )
    ),
    body := '{}'::jsonb
  );
  $job$
);
