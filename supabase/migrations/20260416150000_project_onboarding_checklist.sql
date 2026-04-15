-- PROBLEMA 6 — etapa de Onboarding/Kickoff ausente do fluxo Aprovado → Execução.
--
-- Adiciona estrutura para consolidar escopo, acessos, materiais antes de
-- liberar o projeto para execucao real. Sem isso, dev comeca antes de ter
-- inputs do cliente — atraso e retrabalho garantidos.

BEGIN;

-- 1) Coluna onboarding_completed_at: marco temporal do go formal.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz DEFAULT NULL;

-- 2) Coluna onboarding_checklist jsonb: estado dos itens do kickoff.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS onboarding_checklist jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.projects.onboarding_completed_at IS
  'Timestamp de conclusao formal do onboarding/kickoff. NULL = onboarding em andamento. Quando preenchido, o projeto esta liberado para execucao real.';

COMMENT ON COLUMN public.projects.onboarding_checklist IS
  'Checklist estruturado de onboarding. Schema esperado: scope_confirmed, materials_received, access_provided, schedule_aligned, team_assigned. Cada item: { done bool, owner: elkys|cliente|compartilhado, note text }. NULL = checklist nao inicializado (projeto pre-PROBLEMA-6).';

COMMIT;
