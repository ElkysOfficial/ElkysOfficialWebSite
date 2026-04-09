-- Add audit trigger for proposals table
-- Uses the existing fn_audit_log() function (created in 20260407100000)
-- Pattern matches all other audited tables (clients, projects, charges, etc.)

DROP TRIGGER IF EXISTS trg_audit_proposals ON public.proposals;
CREATE TRIGGER trg_audit_proposals
  AFTER INSERT OR UPDATE OR DELETE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
