-- ============================================================
-- Financial Evolution: is_historical, agendada status,
-- payment model expansion, mark_overdue_charges rewrite
-- Sprint 3 — analise-evolucao-financeira.md
-- ============================================================

-- 3.1 — Add is_historical flag to charges
-- Isolates pre-system payments from operational data.
-- Historical charges are informational only and must be
-- excluded from cash flow, receivables, overdue processing,
-- and payment reminders.
ALTER TABLE public.charges
  ADD COLUMN IF NOT EXISTS is_historical BOOLEAN NOT NULL DEFAULT false;

-- 3.2 — Expand invoice_status enum with 'agendada'
-- Future subscription charges must be 'agendada' (scheduled),
-- not 'pendente'. This prevents them from appearing as open
-- invoices and protects against false overdue marking.
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'agendada';

-- 3.3 — Expand payment_model enum
-- Supports single payment ("100% already paid/completed")
-- and custom splits beyond 50/50.
ALTER TYPE public.payment_model ADD VALUE IF NOT EXISTS 'a_vista';
ALTER TYPE public.payment_model ADD VALUE IF NOT EXISTS 'personalizado';

-- 3.4 — Rewrite mark_overdue_charges() with grace days and
-- is_historical exclusion.
-- Handles two transitions:
--   agendada → pendente  (charge becomes actionable today)
--   pendente → atrasado  (charge overdue, with grace days)
-- NEVER: agendada → atrasado directly
-- NEVER: touches is_historical = true charges
CREATE OR REPLACE FUNCTION public.mark_overdue_charges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  -- Transition agendada → pendente (charge becoming actionable today)
  UPDATE public.charges
  SET
    status = 'pendente',
    updated_at = now()
  WHERE status = 'agendada'
    AND is_historical = false
    AND due_date <= CURRENT_DATE;

  -- Transition pendente → atrasado (with grace days from linked subscription)
  UPDATE public.charges c
  SET
    status = 'atrasado',
    updated_at = now()
  WHERE c.status = 'pendente'
    AND c.is_historical = false
    AND c.due_date + COALESCE(
      (SELECT s.grace_days
       FROM public.project_subscriptions s
       WHERE s.id = c.subscription_id),
      0
    ) * INTERVAL '1 day' < CURRENT_DATE;
END;
$func$;

-- Update sync_projects_from_blocking_charges to also exclude
-- is_historical charges from the blocking logic
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
        AND c.is_historical = false
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
        AND c.is_historical = false
        AND c.status = 'atrasado'
    );
END;
$func$;
