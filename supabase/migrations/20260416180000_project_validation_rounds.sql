-- PROBLEMA 9 — etapa de Validacao/Ajustes ausente do fluxo Execucao → Aceite.
--
-- Cria tabela project_validation_rounds para capturar rodadas de
-- validacao com aprovacao dual (interna Elkys + cliente). Sem essa
-- estrutura, o aceite formal (PROBLEMA 7) nasce sem contexto e
-- metricas de qualidade sao impossiveis.

BEGIN;

CREATE TABLE IF NOT EXISTS public.project_validation_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  round_no integer NOT NULL,
  scope_summary text,
  status text NOT NULL DEFAULT 'em_andamento'
    CHECK (status IN ('em_andamento', 'aprovada', 'reprovada')),
  feedback text,
  validated_by_internal uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_validated_at timestamptz,
  validated_by_client text,
  client_validated_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_validation_rounds_unique_no UNIQUE (project_id, round_no)
);

ALTER TABLE public.project_validation_rounds ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_project_validation_rounds_project
  ON public.project_validation_rounds (project_id, round_no DESC);

DROP POLICY IF EXISTS "Admins read validation rounds" ON public.project_validation_rounds;
CREATE POLICY "Admins read validation rounds" ON public.project_validation_rounds
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Team read validation rounds" ON public.project_validation_rounds;
CREATE POLICY "Team read validation rounds" ON public.project_validation_rounds
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

DROP POLICY IF EXISTS "Admins manage validation rounds" ON public.project_validation_rounds;
CREATE POLICY "Admins manage validation rounds" ON public.project_validation_rounds
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMENT ON TABLE public.project_validation_rounds IS
  'Rodadas de validacao de projeto antes do aceite formal. Cada rodada captura escopo, aprovacao interna Elkys, aprovacao cliente, status final (aprovada/reprovada) e feedback. Trilha de qualidade obrigatoria entre execucao e aceite.';

COMMIT;
