-- ============================================
-- Project-centric portal redesign foundation
-- ============================================

ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'negociacao';

CREATE TYPE public.project_pause_reason AS ENUM (
  'financeiro',
  'dependencia_cliente',
  'interno',
  'escopo',
  'outro'
);

CREATE TYPE public.pause_source AS ENUM ('automatico', 'manual');
CREATE TYPE public.contract_record_status AS ENUM ('rascunho', 'ativo', 'encerrado', 'cancelado');
CREATE TYPE public.payment_model AS ENUM ('50_50');
CREATE TYPE public.project_installment_type AS ENUM ('entrada', 'entrega');
CREATE TYPE public.project_installment_status AS ENUM (
  'agendada',
  'pendente',
  'paga',
  'atrasada',
  'cancelada'
);
CREATE TYPE public.project_installment_trigger AS ENUM ('assinatura', 'conclusao', 'data_fixa');
CREATE TYPE public.subscription_status AS ENUM ('agendada', 'ativa', 'pausada', 'encerrada');
CREATE TYPE public.document_visibility AS ENUM ('cliente', 'interno', 'ambos');
CREATE TYPE public.next_step_owner AS ENUM ('elkys', 'cliente', 'compartilhado');
CREATE TYPE public.next_step_status AS ENUM ('pendente', 'em_andamento', 'concluido', 'cancelado');

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS solution_type TEXT,
  ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
  ADD COLUMN IF NOT EXISTS pause_reason public.project_pause_reason,
  ADD COLUMN IF NOT EXISTS pause_source public.pause_source,
  ADD COLUMN IF NOT EXISTS manual_status_override BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_visible_summary TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE TABLE public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  role_label TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_legal_representative BOOLEAN NOT NULL DEFAULT false,
  receives_finance BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX client_contacts_primary_idx
  ON public.client_contacts (client_id)
  WHERE is_primary = true;

CREATE INDEX client_contacts_client_lookup_idx
  ON public.client_contacts (client_id, email);

CREATE OR REPLACE FUNCTION public.get_client_id_for_portal_user(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id
  FROM (
    SELECT c.id AS client_id, 1 AS priority
    FROM public.clients c
    WHERE c.user_id = _user_id

    UNION ALL

    SELECT cc.client_id, 0 AS priority
    FROM public.client_contacts cc
    WHERE cc.auth_user_id = _user_id
  ) scoped
  ORDER BY priority ASC
  LIMIT 1
$$;

CREATE TABLE public.project_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  version_no INTEGER NOT NULL DEFAULT 1,
  status public.contract_record_status NOT NULL DEFAULT 'ativo',
  signed_at DATE,
  starts_at DATE,
  ends_at DATE,
  scope_summary TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_model public.payment_model NOT NULL DEFAULT '50_50',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_contracts ENABLE ROW LEVEL SECURITY;

CREATE INDEX project_contracts_project_idx ON public.project_contracts (project_id, created_at DESC);
CREATE INDEX project_contracts_client_idx ON public.project_contracts (client_id, created_at DESC);

CREATE TABLE public.project_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.project_contracts(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  installment_type public.project_installment_type NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  trigger_type public.project_installment_trigger NOT NULL DEFAULT 'data_fixa',
  expected_due_date DATE,
  effective_due_date DATE,
  status public.project_installment_status NOT NULL DEFAULT 'agendada',
  is_blocking BOOLEAN NOT NULL DEFAULT true,
  paid_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contract_id, installment_type)
);

ALTER TABLE public.project_installments ENABLE ROW LEVEL SECURITY;

CREATE INDEX project_installments_project_idx
  ON public.project_installments (project_id, status, effective_due_date);

CREATE TABLE public.project_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_day SMALLINT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_on DATE,
  status public.subscription_status NOT NULL DEFAULT 'ativa',
  is_blocking BOOLEAN NOT NULL DEFAULT true,
  grace_days SMALLINT NOT NULL DEFAULT 5 CHECK (grace_days BETWEEN 0 AND 31),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX project_subscriptions_project_idx
  ON public.project_subscriptions (project_id, status, starts_on DESC);

CREATE TABLE public.charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.project_contracts(id) ON DELETE SET NULL,
  installment_id UUID REFERENCES public.project_installments(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.project_subscriptions(id) ON DELETE SET NULL,
  origin_type TEXT NOT NULL CHECK (origin_type IN ('parcela_projeto', 'mensalidade', 'manual')),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'pendente',
  paid_at DATE,
  payment_reference TEXT,
  payment_link TEXT,
  is_blocking BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;

CREATE INDEX charges_client_due_idx ON public.charges (client_id, status, due_date);
CREATE INDEX charges_project_due_idx ON public.charges (project_id, due_date DESC);

CREATE TABLE public.project_next_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner public.next_step_owner NOT NULL DEFAULT 'elkys',
  due_date DATE,
  status public.next_step_status NOT NULL DEFAULT 'pendente',
  client_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_next_steps ENABLE ROW LEVEL SECURITY;

CREATE INDEX project_next_steps_project_idx
  ON public.project_next_steps (project_id, status, sort_order, due_date);

CREATE TABLE public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  visibility public.document_visibility NOT NULL DEFAULT 'ambos',
  source_table TEXT,
  source_id UUID,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX timeline_events_project_idx
  ON public.timeline_events (project_id, occurred_at DESC);

CREATE TABLE public.audit_logs (
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

CREATE INDEX audit_logs_entity_idx
  ON public.audit_logs (entity_type, entity_id, created_at DESC);

CREATE TABLE public.automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.project_contracts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility public.document_visibility NOT NULL DEFAULT 'cliente',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

UPDATE public.documents
SET external_url = url
WHERE external_url IS NULL;

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'media'
    CHECK (priority IN ('baixa', 'media', 'alta'));

CREATE INDEX support_tickets_project_idx
  ON public.support_tickets (project_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.mark_overdue_charges()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $func$
  UPDATE public.charges
  SET
    status = 'atrasado',
    updated_at = now()
  WHERE status = 'pendente'
    AND due_date < CURRENT_DATE;
$func$;

CREATE OR REPLACE FUNCTION public.sync_projects_from_blocking_charges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  UPDATE public.projects p
  SET
    status = 'pausado',
    pause_reason = 'financeiro',
    pause_source = 'automatico',
    updated_at = now()
  WHERE COALESCE(p.manual_status_override, false) = false
    AND p.status IN ('negociacao', 'em_andamento')
    AND EXISTS (
      SELECT 1
      FROM public.charges c
      WHERE c.project_id = p.id
        AND c.is_blocking = true
        AND c.status = 'atrasado'
    );

  UPDATE public.projects p
  SET
    status = 'em_andamento',
    pause_reason = NULL,
    pause_source = NULL,
    updated_at = now()
  WHERE COALESCE(p.manual_status_override, false) = false
    AND p.status = 'pausado'
    AND p.pause_source = 'automatico'
    AND NOT EXISTS (
      SELECT 1
      FROM public.charges c
      WHERE c.project_id = p.id
        AND c.is_blocking = true
        AND c.status = 'atrasado'
    );
END;
$func$;

CREATE OR REPLACE FUNCTION public.sync_financial_blocks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  PERFORM public.mark_overdue_charges();
  PERFORM public.sync_projects_from_blocking_charges();
END;
$func$;

DROP POLICY IF EXISTS "Admins manage client contacts" ON public.client_contacts;
CREATE POLICY "Admins manage client contacts" ON public.client_contacts
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team members read client contacts" ON public.client_contacts;
CREATE POLICY "Team members read client contacts" ON public.client_contacts
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

DROP POLICY IF EXISTS "Clients read own contacts" ON public.client_contacts;
CREATE POLICY "Clients read own contacts" ON public.client_contacts
  FOR SELECT TO authenticated
  USING (client_id = public.get_client_id_for_portal_user(auth.uid()));

DROP POLICY IF EXISTS "Admins manage project contracts" ON public.project_contracts;
CREATE POLICY "Admins manage project contracts" ON public.project_contracts
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team members read project contracts" ON public.project_contracts;
CREATE POLICY "Team members read project contracts" ON public.project_contracts
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

DROP POLICY IF EXISTS "Clients read own project contracts" ON public.project_contracts;
CREATE POLICY "Clients read own project contracts" ON public.project_contracts
  FOR SELECT TO authenticated
  USING (client_id = public.get_client_id_for_portal_user(auth.uid()));

DROP POLICY IF EXISTS "Admins manage project installments" ON public.project_installments;
CREATE POLICY "Admins manage project installments" ON public.project_installments
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team members read project installments" ON public.project_installments;
CREATE POLICY "Team members read project installments" ON public.project_installments
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

DROP POLICY IF EXISTS "Clients read own project installments" ON public.project_installments;
CREATE POLICY "Clients read own project installments" ON public.project_installments
  FOR SELECT TO authenticated
  USING (client_id = public.get_client_id_for_portal_user(auth.uid()));

DROP POLICY IF EXISTS "Admins manage project subscriptions" ON public.project_subscriptions;
CREATE POLICY "Admins manage project subscriptions" ON public.project_subscriptions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team members read project subscriptions" ON public.project_subscriptions;
CREATE POLICY "Team members read project subscriptions" ON public.project_subscriptions
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

DROP POLICY IF EXISTS "Clients read own project subscriptions" ON public.project_subscriptions;
CREATE POLICY "Clients read own project subscriptions" ON public.project_subscriptions
  FOR SELECT TO authenticated
  USING (client_id = public.get_client_id_for_portal_user(auth.uid()));

DROP POLICY IF EXISTS "Admins manage charges" ON public.charges;
CREATE POLICY "Admins manage charges" ON public.charges
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team members read charges" ON public.charges;
CREATE POLICY "Team members read charges" ON public.charges
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

DROP POLICY IF EXISTS "Clients read own charges" ON public.charges;
CREATE POLICY "Clients read own charges" ON public.charges
  FOR SELECT TO authenticated
  USING (client_id = public.get_client_id_for_portal_user(auth.uid()));

DROP POLICY IF EXISTS "Admins manage next steps" ON public.project_next_steps;
CREATE POLICY "Admins manage next steps" ON public.project_next_steps
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team members read next steps" ON public.project_next_steps;
CREATE POLICY "Team members read next steps" ON public.project_next_steps
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

DROP POLICY IF EXISTS "Clients read own next steps" ON public.project_next_steps;
CREATE POLICY "Clients read own next steps" ON public.project_next_steps
  FOR SELECT TO authenticated
  USING (
    client_id = public.get_client_id_for_portal_user(auth.uid())
    AND client_visible = true
  );

DROP POLICY IF EXISTS "Admins manage timeline events" ON public.timeline_events;
CREATE POLICY "Admins manage timeline events" ON public.timeline_events
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team members read timeline events" ON public.timeline_events;
CREATE POLICY "Team members read timeline events" ON public.timeline_events
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

DROP POLICY IF EXISTS "Clients read own timeline events" ON public.timeline_events;
CREATE POLICY "Clients read own timeline events" ON public.timeline_events
  FOR SELECT TO authenticated
  USING (
    client_id = public.get_client_id_for_portal_user(auth.uid())
    AND visibility IN ('cliente', 'ambos')
  );

DROP POLICY IF EXISTS "Admins manage audit logs" ON public.audit_logs;
CREATE POLICY "Admins manage audit logs" ON public.audit_logs
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team members read audit logs" ON public.audit_logs;
CREATE POLICY "Team members read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

DROP POLICY IF EXISTS "Admins manage automation settings" ON public.automation_settings;
CREATE POLICY "Admins manage automation settings" ON public.automation_settings
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team members read automation settings" ON public.automation_settings;
CREATE POLICY "Team members read automation settings" ON public.automation_settings
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

DROP POLICY IF EXISTS "Clients read own documents" ON public.documents;
CREATE POLICY "Clients read own documents" ON public.documents
  FOR SELECT TO authenticated
  USING (
    client_id = public.get_client_id_for_portal_user(auth.uid())
    AND visibility IN ('cliente', 'ambos')
  );
