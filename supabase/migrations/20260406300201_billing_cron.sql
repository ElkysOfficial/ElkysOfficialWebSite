-- Schedule billing rules processing daily at 8am UTC
SELECT cron.schedule(
  'process-billing-rules',
  '0 8 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/process-billing-rules',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{"triggered_by":"cron"}'::jsonb
    );
  $$
);
