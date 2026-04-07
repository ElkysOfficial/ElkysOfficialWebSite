-- Cron job: expire proposals daily at 6am BRT (09:00 UTC)
-- Marks sent proposals with valid_until < today as "expirada"
SELECT cron.schedule(
  'expire-proposals',
  '0 9 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/expire-proposals',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
