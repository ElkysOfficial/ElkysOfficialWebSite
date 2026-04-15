-- PROBLEMA 2 — projects.current_stage tem default 'Início' que viola
-- seu proprio CHECK constraint (que so aceita as 6 etapas Hexa). Bug
-- latente: qualquer INSERT que omita current_stage falha com
-- check_violation. Tambem remove branch morto "current_stage IS NULL OR"
-- do CHECK, ja que a coluna e NOT NULL.

BEGIN;

-- 1) Corrigir default para o primeiro estagio oficial.
ALTER TABLE public.projects
  ALTER COLUMN current_stage SET DEFAULT 'Imersao e Diagnostico';

-- 2) Defensivo: normalizar qualquer linha existente que ainda tenha
--    'Início' ou outro valor fora dos 6 oficiais (improvavel pos
--    migration 20260415200000, mas garante que o CHECK reaplicado nao
--    falhe na linha 4 abaixo).
UPDATE public.projects
   SET current_stage = 'Imersao e Diagnostico'
 WHERE current_stage NOT IN (
   'Imersao e Diagnostico',
   'Acordo Formal',
   'Arquitetura',
   'Engenharia',
   'Validacao & ativacao',
   'Evolucao'
 );

-- 3) Recriar CHECK sem o branch morto de NULL (a coluna e NOT NULL,
--    entao o NULL nunca chega no CHECK — o branch IS NULL OR e dead code
--    enganoso).
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_current_stage_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_current_stage_check
  CHECK (
    current_stage IN (
      'Imersao e Diagnostico',
      'Acordo Formal',
      'Arquitetura',
      'Engenharia',
      'Validacao & ativacao',
      'Evolucao'
    )
  );

COMMENT ON COLUMN public.projects.current_stage IS
  'Estagio atual do projeto no Hexa Design System Elkys. NOT NULL com default na primeira etapa (Imersao e Diagnostico). Restrito as 6 etapas oficiais via CHECK constraint.';

COMMIT;
