-- Give the reminder cron enough time for a cold Vercel function plus the push fan-out.
-- The original schedule used pg_net's 5-second default, which can cancel before the
-- serverless function finishes waking up.

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
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
  $job$
);
