-- Fix: proposals.client_id FK blocks client deletion
-- Change from RESTRICT (default) to SET NULL so deleting a client
-- keeps the proposal record but clears the client reference.
-- Same fix for leads.converted_client_id.
ALTER TABLE public.proposals
  DROP CONSTRAINT proposals_client_id_fkey,
  ADD CONSTRAINT proposals_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.leads
  DROP CONSTRAINT leads_converted_client_id_fkey,
  ADD CONSTRAINT leads_converted_client_id_fkey
    FOREIGN KEY (converted_client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
