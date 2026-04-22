-- ============================================
-- Fix RLS UPDATE em team_tasks: permitir quem ve a tarefa tambem move-la.
--
-- Problema: a policy UPDATE so permitia assigned_to = auth.uid(). No Kanban,
-- quando um usuario arrastava uma tarefa que NAO estava atribuida a ele
-- (mas que ele via via role_visibility), o UPDATE retornava 0 linhas
-- afetadas sem erro (comportamento padrao do Postgres com RLS). O front
-- fazia optimistic update, aparentava ter salvado, mas no refresh a tarefa
-- voltava ao status original.
--
-- Decisao de negocio: se o usuario ve a tarefa (via role_visibility,
-- assigned_to ou created_by), ele pode move-la no kanban do time.
-- Coerente com o conceito de "quadro colaborativo do setor".
--
-- Admins seguem cobertos pela policy "Admins can manage all tasks" (FOR ALL).
-- Esta policy substitui apenas a UPDATE para nao-admins.
-- ============================================

DROP POLICY IF EXISTS "Team members can update tasks assigned to them"
  ON public.team_tasks;

CREATE POLICY "Team members can update tasks in their role visibility"
  ON public.team_tasks FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text = ANY(role_visibility)
    )
  )
  WITH CHECK (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text = ANY(role_visibility)
    )
  );
