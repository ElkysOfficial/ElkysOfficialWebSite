-- Add SLA tracking columns to support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Backfill first_response_at from existing ticket_messages (first admin reply)
UPDATE public.support_tickets st
SET first_response_at = sub.first_admin_reply
FROM (
  SELECT ticket_id, MIN(created_at) AS first_admin_reply
  FROM public.ticket_messages
  WHERE sender_role = 'admin'
  GROUP BY ticket_id
) sub
WHERE st.id = sub.ticket_id AND st.first_response_at IS NULL;

-- Backfill resolved_at for tickets already resolved/closed
UPDATE public.support_tickets
SET resolved_at = updated_at
WHERE status IN ('resolvido', 'fechado') AND resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_first_response_at
  ON public.support_tickets (first_response_at) WHERE first_response_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_resolved_at
  ON public.support_tickets (resolved_at) WHERE resolved_at IS NOT NULL;
