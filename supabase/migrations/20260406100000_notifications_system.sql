-- ============================================
-- Notification System: tables, enums, indexes, RLS
-- ============================================

-- 1. Enums
CREATE TYPE public.notification_type AS ENUM (
  'manutencao',
  'atualizacao',
  'otimizacao',
  'alerta',
  'personalizado'
);

CREATE TYPE public.notification_status AS ENUM (
  'rascunho',
  'agendada',
  'enviando',
  'enviada',
  'falha'
);

-- 2. Notifications table (the message itself)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'personalizado',
  status notification_status NOT NULL DEFAULT 'rascunho',
  send_at TIMESTAMPTZ NULL,
  sent_at TIMESTAMPTZ NULL,
  filter_mode TEXT NOT NULL DEFAULT 'all'
    CHECK (filter_mode IN ('all', 'tags', 'contract_status', 'individual')),
  filter_tags TEXT[] DEFAULT '{}',
  filter_contract_status TEXT NULL,
  filter_client_ids UUID[] DEFAULT '{}',
  recipient_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Notification recipients (per-client delivery tracking)
CREATE TABLE public.notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_error TEXT NULL,
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notification_id, client_id)
);

ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

-- 4. Indexes
CREATE INDEX idx_notification_recipients_user_unread
  ON public.notification_recipients (user_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX idx_notification_recipients_notification
  ON public.notification_recipients (notification_id);

CREATE INDEX idx_notifications_scheduled
  ON public.notifications (status, send_at)
  WHERE status = 'agendada';

-- 5. RLS policies for notifications

-- Admins can do everything on notifications
CREATE POLICY "Admins manage notifications"
  ON public.notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin_super', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin_super', 'admin')
    )
  );

-- 6. RLS policies for notification_recipients

-- Admins can read all recipients
CREATE POLICY "Admins read all recipients"
  ON public.notification_recipients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin_super', 'admin')
    )
  );

-- Admins can insert recipients (when sending notifications)
CREATE POLICY "Admins insert recipients"
  ON public.notification_recipients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin_super', 'admin')
    )
  );

-- Clients can read their own notifications
CREATE POLICY "Clients read own notifications"
  ON public.notification_recipients
  FOR SELECT
  USING (user_id = auth.uid());

-- Clients can mark notifications as read
CREATE POLICY "Clients mark read"
  ON public.notification_recipients
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Clients need to read the notification content (join access)
CREATE POLICY "Clients read notification content"
  ON public.notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notification_recipients
      WHERE notification_recipients.notification_id = notifications.id
        AND notification_recipients.user_id = auth.uid()
    )
  );
