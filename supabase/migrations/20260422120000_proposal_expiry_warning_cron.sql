-- Cron job: envia lembrete ao cliente quando proposta esta proxima do vencimento.
-- Roda diariamente as 10h UTC (07h BRT), uma hora apos o cron de expirar propostas,
-- pra nao sobrepor. A function busca valid_until = today + PROPOSAL_EXPIRY_WARNING_DAYS
-- (default 2 dias) e dispara email ao cliente com CTA "Responder agora".

SELECT cron.schedule(
  'send-proposal-expiry-warning',
  '0 10 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-proposal-expiry-warning',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
