-- ============================================================
-- ticket_messages: conversação interna de cada ticket
-- Permite que admins respondam tickets e clientes acompanhem
-- ============================================================

CREATE TABLE public.ticket_messages (
  id          UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id   UUID          NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_role TEXT          NOT NULL CHECK (sender_role IN ('admin', 'client')),
  author_name TEXT          NOT NULL,
  body        TEXT          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages (ticket_id);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Clientes podem ler mensagens dos próprios tickets
CREATE POLICY "Clients read own ticket messages" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE client_id = public.get_client_id_for_portal_user(auth.uid())
    )
  );

-- Clientes podem inserir mensagens nos próprios tickets (como sender_role = 'client')
CREATE POLICY "Clients insert own ticket messages" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_role = 'client'
    AND ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE client_id = public.get_client_id_for_portal_user(auth.uid())
    )
  );

-- Admins (via service role no edge function) têm acesso total
-- O service role bypassa RLS por padrão, não precisa de policy separada
