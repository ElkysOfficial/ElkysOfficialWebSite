-- ============================================
-- Fix RLS SELECT em team_tasks: incluir assigned_to e created_by.
--
-- Problema: a policy original so checava role_visibility. Quando uma tarefa
-- era atribuida a um usuario cujo role nao estava em role_visibility (ex.:
-- tarefa com default '{admin_super,admin}' atribuida ao juridico), o
-- Postgres bloqueava o SELECT via RLS antes mesmo de chegar ao frontend.
-- O filtro do front (Tasks.tsx) tentava cobrir com "assigned_to = user.id",
-- mas as linhas nunca chegavam la.
--
-- Impacto: estritamente aditivo. Quem ja via X tarefas continua vendo as
-- mesmas X. Alguns usuarios passam a ver tarefas que legitimamente deveriam
-- ver (as atribuidas a eles ou criadas por eles). Admins seguem vendo tudo
-- pela policy "Admins can manage all tasks" (FOR ALL).
-- ============================================

DROP POLICY IF EXISTS "Team members can view tasks visible to their role"
  ON public.team_tasks;

CREATE POLICY "Team members can view tasks visible to their role or linked to them"
  ON public.team_tasks FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text = ANY(role_visibility)
    )
  );
