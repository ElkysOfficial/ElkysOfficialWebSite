-- Drop the check constraint that requires proposals to have either a client_id or lead_id.
-- This constraint blocks client deletion even after the FK was changed to ON DELETE SET NULL,
-- because SET NULL clears client_id, and if lead_id is also NULL the check fails.
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_must_have_owner;
