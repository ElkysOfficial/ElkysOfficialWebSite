-- Schedule sync_financial_blocks() to run automatically.
-- This function transitions charge statuses (agendada->pendente->atrasado)
-- and pauses/resumes projects based on blocking overdue charges.
--
-- Runs twice daily:
--   07:55 UTC - right before process-billing-rules (08:00 UTC)
--   18:00 UTC - end of business day catch-up
--
-- Projects with manual_status_override=true are not affected (handled inside the function).

SELECT cron.schedule(
  'sync-financial-blocks',
  '55 7,18 * * *',
  $$SELECT public.sync_financial_blocks();$$
);
