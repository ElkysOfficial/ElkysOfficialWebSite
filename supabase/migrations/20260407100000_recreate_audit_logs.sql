-- ============================================
-- Recreate audit_logs table (dropped in 20260331123000)
-- and add automatic triggers for key entities
-- ============================================

-- 1. Recreate the table (same schema as original)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  reason TEXT,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON public.audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON public.audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx
  ON public.audit_logs (actor_user_id, created_at DESC);

-- 2. RLS policies
DROP POLICY IF EXISTS "Admins manage audit logs" ON public.audit_logs;
CREATE POLICY "Admins manage audit logs" ON public.audit_logs
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team members read audit logs" ON public.audit_logs;
CREATE POLICY "Team members read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

-- 3. Generic audit trigger function
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_entity_id UUID;
  v_before JSONB;
  v_after JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_id := NEW.id;
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_entity_id := NEW.id;
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_id := OLD.id;
    v_before := to_jsonb(OLD);
    v_after := NULL;
  END IF;

  INSERT INTO public.audit_logs (entity_type, entity_id, action, before_data, after_data, actor_user_id)
  VALUES (TG_TABLE_NAME, v_entity_id, v_action, v_before, v_after, auth.uid());

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Attach triggers to key tables

-- clients
DROP TRIGGER IF EXISTS trg_audit_clients ON public.clients;
CREATE TRIGGER trg_audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- projects
DROP TRIGGER IF EXISTS trg_audit_projects ON public.projects;
CREATE TRIGGER trg_audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- charges
DROP TRIGGER IF EXISTS trg_audit_charges ON public.charges;
CREATE TRIGGER trg_audit_charges
  AFTER INSERT OR UPDATE OR DELETE ON public.charges
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- support_tickets
DROP TRIGGER IF EXISTS trg_audit_support_tickets ON public.support_tickets;
CREATE TRIGGER trg_audit_support_tickets
  AFTER INSERT OR UPDATE OR DELETE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- documents
DROP TRIGGER IF EXISTS trg_audit_documents ON public.documents;
CREATE TRIGGER trg_audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- project_contracts
DROP TRIGGER IF EXISTS trg_audit_project_contracts ON public.project_contracts;
CREATE TRIGGER trg_audit_project_contracts
  AFTER INSERT OR UPDATE OR DELETE ON public.project_contracts
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- expenses
DROP TRIGGER IF EXISTS trg_audit_expenses ON public.expenses;
CREATE TRIGGER trg_audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- team_members
DROP TRIGGER IF EXISTS trg_audit_team_members ON public.team_members;
CREATE TRIGGER trg_audit_team_members
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- financial_goals
DROP TRIGGER IF EXISTS trg_audit_financial_goals ON public.financial_goals;
CREATE TRIGGER trg_audit_financial_goals
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_goals
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
