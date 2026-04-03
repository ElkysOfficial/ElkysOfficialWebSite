CREATE TABLE IF NOT EXISTS public.internal_team_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience TEXT NOT NULL CHECK (audience IN ('marketing_design', 'developer')),
  label TEXT NOT NULL,
  type_label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS internal_team_documents_audience_created_at_idx
  ON public.internal_team_documents (audience, created_at DESC);

ALTER TABLE public.internal_team_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internal team documents read" ON public.internal_team_documents;
CREATE POLICY "Internal team documents read" ON public.internal_team_documents
  FOR SELECT TO authenticated
  USING (
    (
      audience = 'marketing_design'
      AND public.has_role_in(
        auth.uid(),
        ARRAY['admin_super', 'admin', 'marketing']::public.app_role[]
      )
    )
    OR (
      audience = 'developer'
      AND public.has_role_in(
        auth.uid(),
        ARRAY['admin_super', 'admin', 'developer']::public.app_role[]
      )
    )
  );

DROP POLICY IF EXISTS "Internal team documents insert" ON public.internal_team_documents;
CREATE POLICY "Internal team documents insert" ON public.internal_team_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      audience = 'marketing_design'
      AND public.has_role_in(
        auth.uid(),
        ARRAY['admin_super', 'admin', 'marketing']::public.app_role[]
      )
    )
    OR (
      audience = 'developer'
      AND public.has_role_in(
        auth.uid(),
        ARRAY['admin_super', 'admin']::public.app_role[]
      )
    )
  );

DROP POLICY IF EXISTS "Internal team documents update" ON public.internal_team_documents;
CREATE POLICY "Internal team documents update" ON public.internal_team_documents
  FOR UPDATE TO authenticated
  USING (
    (
      audience = 'marketing_design'
      AND public.has_role_in(
        auth.uid(),
        ARRAY['admin_super', 'admin', 'marketing']::public.app_role[]
      )
    )
    OR (
      audience = 'developer'
      AND public.has_role_in(
        auth.uid(),
        ARRAY['admin_super', 'admin']::public.app_role[]
      )
    )
  )
  WITH CHECK (
    (
      audience = 'marketing_design'
      AND public.has_role_in(
        auth.uid(),
        ARRAY['admin_super', 'admin', 'marketing']::public.app_role[]
      )
    )
    OR (
      audience = 'developer'
      AND public.has_role_in(
        auth.uid(),
        ARRAY['admin_super', 'admin']::public.app_role[]
      )
    )
  );

DROP POLICY IF EXISTS "Internal team documents delete" ON public.internal_team_documents;
CREATE POLICY "Internal team documents delete" ON public.internal_team_documents
  FOR DELETE TO authenticated
  USING (
    (
      audience = 'marketing_design'
      AND public.has_role_in(
        auth.uid(),
        ARRAY['admin_super', 'admin', 'marketing']::public.app_role[]
      )
    )
    OR (
      audience = 'developer'
      AND public.has_role_in(
        auth.uid(),
        ARRAY['admin_super', 'admin', 'developer']::public.app_role[]
      )
    )
  );
