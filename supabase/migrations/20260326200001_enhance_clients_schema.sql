
-- ============================================
-- Migration Part 2: Schema changes that USE
-- the new enum values added in Part 1
-- ============================================

-- 1. New enums
CREATE TYPE public.contract_status AS ENUM ('ativo', 'inadimplente', 'cancelado');
CREATE TYPE public.contract_type   AS ENUM ('projeto', 'recorrente', 'hibrido');
CREATE TYPE public.client_origin   AS ENUM ('lead', 'indicacao', 'inbound');

-- 2. Expand clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS client_type         TEXT          NOT NULL DEFAULT 'pf' CHECK (client_type IN ('pf','pj')),
  ADD COLUMN IF NOT EXISTS razao_social         TEXT,
  ADD COLUMN IF NOT EXISTS nome_fantasia        TEXT,
  ADD COLUMN IF NOT EXISTS cargo_representante  TEXT,
  ADD COLUMN IF NOT EXISTS payment_due_day      SMALLINT      CHECK (payment_due_day BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS contract_status      public.contract_status DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS contract_type        public.contract_type,
  ADD COLUMN IF NOT EXISTS contract_start       DATE,
  ADD COLUMN IF NOT EXISTS contract_end         DATE,
  ADD COLUMN IF NOT EXISTS scope_summary        TEXT,
  ADD COLUMN IF NOT EXISTS tags                 TEXT[]        NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS client_origin        public.client_origin,
  ADD COLUMN IF NOT EXISTS cep                  TEXT,
  ADD COLUMN IF NOT EXISTS city                 TEXT,
  ADD COLUMN IF NOT EXISTS state                TEXT,
  ADD COLUMN IF NOT EXISTS country              TEXT          NOT NULL DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN       NOT NULL DEFAULT false;

-- 3. Add system_role to team_members
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS system_role public.app_role;

-- ============================================
-- Helper functions (use new enum values safely
-- now that they are committed)
-- ============================================

CREATE OR REPLACE FUNCTION public.has_any_team_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin_super','admin','marketing','developer','support')
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role_in(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- ============================================
-- RLS: clients
-- ============================================

DROP POLICY IF EXISTS "Admins can manage clients"   ON public.clients;
DROP POLICY IF EXISTS "Clients can read own data"   ON public.clients;
DROP POLICY IF EXISTS "Admins manage clients"       ON public.clients;
DROP POLICY IF EXISTS "Team members read clients"   ON public.clients;
DROP POLICY IF EXISTS "Clients read own"            ON public.clients;

CREATE POLICY "Admins manage clients" ON public.clients
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Team members read clients" ON public.clients
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

CREATE POLICY "Clients read own" ON public.clients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- RLS: documents
-- ============================================

DROP POLICY IF EXISTS "Admins can manage documents"   ON public.documents;
DROP POLICY IF EXISTS "Clients can read own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins manage documents"       ON public.documents;
DROP POLICY IF EXISTS "Team members read documents"   ON public.documents;
DROP POLICY IF EXISTS "Clients read own documents"    ON public.documents;

CREATE POLICY "Admins manage documents" ON public.documents
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Team members read documents" ON public.documents
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

CREATE POLICY "Clients read own documents" ON public.documents
  FOR SELECT TO authenticated
  USING (client_id = public.get_client_id_for_user(auth.uid()));

-- ============================================
-- Support tickets table
-- ============================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID        REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  subject    TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'aberto'
               CHECK (status IN ('aberto','em_andamento','resolvido','fechado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage tickets"   ON public.support_tickets;
DROP POLICY IF EXISTS "Support reads tickets"   ON public.support_tickets;
DROP POLICY IF EXISTS "Clients read own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Clients insert own tickets" ON public.support_tickets;

CREATE POLICY "Admins manage tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Support reads tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'support'));

CREATE POLICY "Clients read own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (client_id = public.get_client_id_for_user(auth.uid()));

CREATE POLICY "Clients insert own tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (client_id = public.get_client_id_for_user(auth.uid()));
