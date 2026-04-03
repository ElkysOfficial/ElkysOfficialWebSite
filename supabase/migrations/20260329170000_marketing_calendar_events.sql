CREATE TABLE IF NOT EXISTS public.marketing_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NULL,
  event_type TEXT NOT NULL DEFAULT 'post'
    CHECK (event_type IN ('post', 'story', 'campanha', 'reuniao', 'entrega', 'outro')),
  channel TEXT NULL,
  status TEXT NOT NULL DEFAULT 'planejado'
    CHECK (status IN ('planejado', 'em_producao', 'agendado', 'publicado', 'cancelado')),
  all_day BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  client_id UUID NULL REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT marketing_calendar_events_range_chk CHECK (ends_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS marketing_calendar_events_starts_at_idx
  ON public.marketing_calendar_events (starts_at ASC);

CREATE INDEX IF NOT EXISTS marketing_calendar_events_status_idx
  ON public.marketing_calendar_events (status, starts_at ASC);

ALTER TABLE public.marketing_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Marketing calendar manage" ON public.marketing_calendar_events;
CREATE POLICY "Marketing calendar manage" ON public.marketing_calendar_events
  FOR ALL TO authenticated
  USING (
    public.has_role_in(
      auth.uid(),
      ARRAY['admin_super', 'admin', 'marketing']::public.app_role[]
    )
  )
  WITH CHECK (
    public.has_role_in(
      auth.uid(),
      ARRAY['admin_super', 'admin', 'marketing']::public.app_role[]
    )
  );
