-- Cron job: check for overdue client actions daily at 9am BRT (12:00 UTC)
-- Sends reminder emails to clients with pending overdue next_steps
SELECT cron.schedule(
  'check-overdue-client-actions',
  '0 12 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/check-overdue-client-actions',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
