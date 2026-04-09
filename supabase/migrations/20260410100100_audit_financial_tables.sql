-- ============================================
-- Add audit triggers for financial tables not yet covered.
-- Reuses the existing fn_audit_log() function
-- (created in 20260407100000_recreate_audit_logs.sql).
-- ============================================

-- project_subscriptions — recurring billing schedules
DROP TRIGGER IF EXISTS trg_audit_project_subscriptions ON public.project_subscriptions;
CREATE TRIGGER trg_audit_project_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON public.project_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- project_installments — installment payment schedules
DROP TRIGGER IF EXISTS trg_audit_project_installments ON public.project_installments;
CREATE TRIGGER trg_audit_project_installments
  AFTER INSERT OR UPDATE OR DELETE ON public.project_installments
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- billing_rules — automated billing rule configuration
DROP TRIGGER IF EXISTS trg_audit_billing_rules ON public.billing_rules;
CREATE TRIGGER trg_audit_billing_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.billing_rules
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- billing_templates — billing email templates
DROP TRIGGER IF EXISTS trg_audit_billing_templates ON public.billing_templates;
CREATE TRIGGER trg_audit_billing_templates
  AFTER INSERT OR UPDATE OR DELETE ON public.billing_templates
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
