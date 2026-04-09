-- ============================================
-- Add unique index on billing_actions_log to prevent
-- duplicate email sends for the same charge+rule on the same day.
-- ============================================

-- Only enforce uniqueness for successfully sent actions.
-- Failed actions (status = 'falha') can be retried.
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_log_idempotent
  ON public.billing_actions_log (charge_id, rule_id, (sent_at::date))
  WHERE status = 'enviado' AND rule_id IS NOT NULL;

-- For single-charge mode (rule_id IS NULL), prevent duplicate sends
-- for the same charge + template on the same day.
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_log_single_idempotent
  ON public.billing_actions_log (charge_id, template_id, (sent_at::date))
  WHERE status = 'enviado' AND rule_id IS NULL AND template_id IS NOT NULL;
