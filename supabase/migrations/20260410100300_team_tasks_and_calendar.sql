-- ============================================
-- Unified task/calendar system for Kanban + Calendar view.
-- Aggregates work items across all roles.
-- ============================================

-- 1. team_tasks: centralized task board for all team members
CREATE TABLE IF NOT EXISTS public.team_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- What
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
    -- geral, desenvolvimento, marketing, suporte, financeiro, reuniao

  -- Status (kanban columns)
  status TEXT NOT NULL DEFAULT 'pendente',
    -- pendente, em_progresso, pausada, validacao, concluida

  priority TEXT NOT NULL DEFAULT 'media',
    -- baixa, media, alta, urgente

  -- When
  due_date DATE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,

  -- Links
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  next_step_id UUID REFERENCES public.project_next_steps(id) ON DELETE SET NULL,
  marketing_event_id UUID REFERENCES public.marketing_calendar_events(id) ON DELETE SET NULL,

  -- Google Calendar
  google_event_id TEXT,
  google_meet_link TEXT,

  -- Metadata
  role_visibility TEXT[] NOT NULL DEFAULT '{admin_super,admin}',
    -- which roles can see this task
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_tasks_assigned ON public.team_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_team_tasks_status ON public.team_tasks(status);
CREATE INDEX IF NOT EXISTS idx_team_tasks_due_date ON public.team_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_team_tasks_category ON public.team_tasks(category);

-- RLS
ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view tasks visible to their role"
  ON public.team_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text = ANY(role_visibility)
    )
  );

CREATE POLICY "Admins can manage all tasks"
  ON public.team_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin_super', 'admin')
    )
  );

CREATE POLICY "Team members can update tasks assigned to them"
  ON public.team_tasks FOR UPDATE
  USING (assigned_to = auth.uid());

-- 2. Add SLA deadline to support tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;

-- 3. Add assigned_to to project_next_steps
ALTER TABLE public.project_next_steps
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Audit trigger
DROP TRIGGER IF EXISTS trg_audit_team_tasks ON public.team_tasks;
CREATE TRIGGER trg_audit_team_tasks
  AFTER INSERT OR UPDATE OR DELETE ON public.team_tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
