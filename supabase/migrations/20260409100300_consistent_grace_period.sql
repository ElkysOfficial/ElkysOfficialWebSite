-- Fix: apply consistent grace period to all charge types.
--
-- Previously, only charges linked to a subscription received grace days.
-- Charges from installments (parcela_projeto) and manual charges received
-- grace_days = 0, meaning they were marked overdue the day after due_date.
--
-- This update changes the COALESCE fallback from 0 to 5, matching the
-- default grace_days value used by project_subscriptions (DEFAULT 5).
-- All charge types now receive at minimum 5 days of grace before
-- transitioning from pendente to atrasado.

CREATE OR REPLACE FUNCTION public.mark_overdue_charges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  -- Transition agendada -> pendente (charge becoming actionable today)
  UPDATE public.charges
  SET
    status = 'pendente',
    updated_at = now()
  WHERE status = 'agendada'
    AND is_historical = false
    AND due_date <= CURRENT_DATE;

  -- Transition pendente -> atrasado (with grace days)
  -- Uses subscription grace_days if linked, otherwise defaults to 5 days
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
      5
    ) * INTERVAL '1 day' < CURRENT_DATE;
END;
$func$;
