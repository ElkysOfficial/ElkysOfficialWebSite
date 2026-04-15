-- PROBLEMA 5 — etapa Diagnóstico ausente do fluxo Lead → Proposta.
--
-- O usuario descreveu Diagnostico como etapa obrigatoria entre
-- Qualificacao e Proposta, mas o sistema nao tem onde capturar
-- contexto/problema/objetivo/urgencia/etc. Resultado: o fluxo depende
-- de memoria humana e a proposta nasce do branco.
--
-- Esta migration:
--   1) Adiciona leads.diagnosis jsonb (default NULL).
--   2) Adiciona 'diagnostico' ao CHECK de leads.status (estado entre
--      'qualificado' e 'proposta').
--   3) Mantem retrocompat: leads existentes ficam com diagnosis=NULL e
--      status original. Nada quebra.

BEGIN;

-- 1) Coluna diagnosis estruturada em jsonb.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS diagnosis jsonb DEFAULT NULL;

COMMENT ON COLUMN public.leads.diagnosis IS
  'Diagnostico estruturado consolidado durante a qualificacao do lead. Schema esperado: {context, problem, objective, urgency, expectation, initial_scope, constraints, business_impact, concluded_at}. NULL = nao realizado. Quando concluded_at preenchido, propostas geradas a partir do lead pre-populam scope_summary com base nestes campos.';

-- 2) Adicionar 'diagnostico' ao CHECK de status.
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check
  CHECK (status = ANY (ARRAY[
    'novo'::text,
    'qualificado'::text,
    'diagnostico'::text,
    'proposta'::text,
    'negociacao'::text,
    'ganho'::text,
    'perdido'::text
  ]));

COMMENT ON CONSTRAINT leads_status_check ON public.leads IS
  'Estados validos do funil de leads. Diagnostico foi adicionado entre qualificado e proposta para representar a etapa de consolidacao de contexto antes da proposta.';

COMMIT;
