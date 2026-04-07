-- Add client action fields to project_next_steps
-- Enables admin to request data/approval from client, and client to respond
ALTER TABLE public.project_next_steps
  ADD COLUMN requires_client_action boolean NOT NULL DEFAULT false,
  ADD COLUMN client_response text,
  ADD COLUMN client_responded_at timestamptz;

-- Allow clients to update their own next_steps (response only)
CREATE POLICY "Clients can respond to next steps" ON public.project_next_steps FOR UPDATE
  USING (
    requires_client_action = true
    AND client_responded_at IS NULL
    AND client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  )
  WITH CHECK (
    requires_client_action = true
  );
