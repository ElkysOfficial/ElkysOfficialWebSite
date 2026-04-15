-- R2 / Conceitual ajuste #3 — Hexa Design System (6 etapas).
--
-- O cliente TS lib (PROJECT_STAGE_OPTIONS) ja define as 6 etapas oficiais
-- do Hexa Design System Elkys, e a UI (ProjectStageJourney) ja renderiza
-- a jornada hexagonal nelas. Mas o DB aceita qualquer string em
-- projects.current_stage — qualquer SQL direto, edge function ou import
-- pode quebrar a contagem de etapas e a leitura visual.
--
-- Esta migration adiciona um CHECK constraint que limita current_stage
-- aos 6 valores oficiais (mais NULL). Antes de adicionar a constraint,
-- normaliza linhas existentes que usem variantes (case, espacos, sem
-- acento) para o canonico — isso evita CHECK violation no momento de
-- aplicar a migration.

-- ────────────────────────────────────────────────────────────────────
-- 1) Normalizacao defensiva de current_stage existente
-- ────────────────────────────────────────────────────────────────────

UPDATE public.projects
   SET current_stage = 'Imersao e Diagnostico'
 WHERE current_stage IS NOT NULL
   AND lower(trim(current_stage)) IN ('imersao', 'imersao e diagnostico', 'imersão', 'imersão e diagnóstico', 'diagnostico', 'diagnóstico');

UPDATE public.projects
   SET current_stage = 'Acordo Formal'
 WHERE current_stage IS NOT NULL
   AND lower(trim(current_stage)) IN ('acordo', 'acordo formal');

UPDATE public.projects
   SET current_stage = 'Arquitetura'
 WHERE current_stage IS NOT NULL
   AND lower(trim(current_stage)) = 'arquitetura';

UPDATE public.projects
   SET current_stage = 'Engenharia'
 WHERE current_stage IS NOT NULL
   AND lower(trim(current_stage)) IN ('engenharia', 'desenvolvimento', 'dev');

UPDATE public.projects
   SET current_stage = 'Validacao & ativacao'
 WHERE current_stage IS NOT NULL
   AND lower(trim(current_stage)) IN ('validacao', 'validação', 'validacao & ativacao', 'validação & ativação', 'ativacao', 'ativação');

UPDATE public.projects
   SET current_stage = 'Evolucao'
 WHERE current_stage IS NOT NULL
   AND lower(trim(current_stage)) IN ('evolucao', 'evolução', 'manutencao', 'manutenção', 'continuo', 'contínuo');

-- Qualquer valor remanescente que nao bata com nenhum dos 6 oficiais
-- vira NULL para nao bloquear a constraint. Admin pode setar manualmente
-- depois.
UPDATE public.projects
   SET current_stage = NULL
 WHERE current_stage IS NOT NULL
   AND current_stage NOT IN (
     'Imersao e Diagnostico',
     'Acordo Formal',
     'Arquitetura',
     'Engenharia',
     'Validacao & ativacao',
     'Evolucao'
   );

-- ────────────────────────────────────────────────────────────────────
-- 2) CHECK constraint
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_current_stage_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_current_stage_check
  CHECK (
    current_stage IS NULL
    OR current_stage IN (
      'Imersao e Diagnostico',
      'Acordo Formal',
      'Arquitetura',
      'Engenharia',
      'Validacao & ativacao',
      'Evolucao'
    )
  );

COMMENT ON CONSTRAINT projects_current_stage_check ON public.projects IS
  'Garante que current_stage so aceite uma das 6 etapas oficiais do Hexa Design System Elkys (lib TS PROJECT_STAGE_OPTIONS).';
