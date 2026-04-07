-- Admin notifications: event-driven internal notifications for admin team
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'action_required')),
  target_roles public.app_role[] NOT NULL DEFAULT '{admin_super,admin}',
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  read_by UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins and team members can read notifications targeted to their role
CREATE POLICY "Team can read targeted admin notifications"
  ON public.admin_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY(admin_notifications.target_roles)
    )
  );

-- Admins can insert (system creates notifications)
CREATE POLICY "Admins can insert admin notifications"
  ON public.admin_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin_super', 'admin')
    )
  );

-- Anyone with access can mark as read (append to read_by)
CREATE POLICY "Team can update admin notifications"
  ON public.admin_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY(admin_notifications.target_roles)
    )
  );

-- Clients can also insert notifications (for proposal approval events)
CREATE POLICY "Clients can create proposal notifications"
  ON public.admin_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'cliente'
    )
    AND type IN ('proposta_aprovada', 'proposta_rejeitada', 'ticket_aberto')
  );

CREATE INDEX idx_admin_notifications_unread
  ON public.admin_notifications (created_at DESC)
  WHERE array_length(read_by, 1) IS NULL OR array_length(read_by, 1) = 0;

CREATE INDEX idx_admin_notifications_target
  ON public.admin_notifications USING GIN (target_roles);

-- Enable realtime for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
