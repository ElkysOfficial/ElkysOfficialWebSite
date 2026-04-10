-- ============================================
-- Add unique index on billing_actions_log to prevent
-- duplicate email sends for the same charge+rule on the same day.
-- ============================================

-- Add a stored generated column so the index expression is IMMUTABLE.
-- (timestamptz::date depends on session timezone, which PostgreSQL
--  rejects in index expressions.)
ALTER TABLE public.billing_actions_log
  ADD COLUMN IF NOT EXISTS sent_date date
  GENERATED ALWAYS AS ((sent_at AT TIME ZONE 'America/Sao_Paulo')::date) STORED;

-- Only enforce uniqueness for successfully sent actions.
-- Failed actions (status = 'falha') can be retried.
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_log_idempotent
  ON public.billing_actions_log (charge_id, rule_id, sent_date)
  WHERE status = 'enviado' AND rule_id IS NOT NULL;

-- For single-charge mode (rule_id IS NULL), prevent duplicate sends
-- for the same charge + template on the same day.
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_log_single_idempotent
  ON public.billing_actions_log (charge_id, template_id, sent_date)
  WHERE status = 'enviado' AND rule_id IS NULL AND template_id IS NOT NULL;
