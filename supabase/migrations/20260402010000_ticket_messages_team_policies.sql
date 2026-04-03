-- ============================================================
-- Corrige RLS de ticket_messages:
-- A migration anterior só tinha policies para clientes.
-- Admins/equipe usam o SDK client-side (JWT normal), então
-- precisam de policies explícitas para SELECT e INSERT.
-- ============================================================

-- Membros da equipe podem ler todas as mensagens de todos os tickets
CREATE POLICY "Team read all ticket messages" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin_super', 'admin', 'support', 'developer', 'marketing')
    )
  );

-- Membros da equipe podem inserir mensagens como remetente 'admin'
CREATE POLICY "Team insert ticket messages as admin" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_role = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin_super', 'admin', 'support', 'developer', 'marketing')
    )
  );
