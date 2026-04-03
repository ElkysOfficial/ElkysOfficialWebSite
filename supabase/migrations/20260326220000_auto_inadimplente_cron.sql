-- Create a stored function that marks overdue clients as inadimplente.
-- The cron job will be configured separately via SQL Editor (same approach as send-invoice-due).
-- Grace period: 5 days after the payment_due_day.

CREATE OR REPLACE FUNCTION public.mark_overdue_clients_inadimplente()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $func$
  UPDATE public.clients
  SET contract_status = 'inadimplente'
  WHERE
    is_active = true
    AND contract_status = 'ativo'
    AND payment_due_day IS NOT NULL
    AND payment_due_day < EXTRACT(DAY FROM CURRENT_DATE)
    AND CURRENT_DATE > (
      DATE_TRUNC('month', CURRENT_DATE)
      + (payment_due_day - 1) * INTERVAL '1 day'
      + 5 * INTERVAL '1 day'
    );
$func$;
