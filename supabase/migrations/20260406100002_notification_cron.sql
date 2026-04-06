-- ============================================
-- Cron job: process scheduled notifications every 5 minutes
-- Requires pg_cron and pg_net extensions (enabled by default on Supabase).
-- If this migration fails, configure the cron via SQL Editor in the Supabase Dashboard.
-- ============================================

-- Schedule the cron to call the edge function every 5 minutes
SELECT cron.schedule(
  'process-scheduled-notifications',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/process-scheduled-notifications',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
