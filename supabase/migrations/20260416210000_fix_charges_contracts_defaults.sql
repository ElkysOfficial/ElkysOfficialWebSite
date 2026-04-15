-- PROBLEMA 12 — defaults de charges.is_blocking e project_contracts.status
-- contradizem o uso real do sistema.
--
-- Defeito A: charges.is_blocking DEFAULT false. Mas o sistema bloqueia
--            projeto via trigger sync_projects_from_blocking_charges() que
--            depende de is_blocking=true. Todas as RPCs setam explicitamente
--            true. Inserts manuais herdam false e quebram o bloqueio.
--
-- Defeito B: project_contracts.status DEFAULT 'ativo'. Mas o ciclo correto
--            comeca em 'rascunho' e progride apos revisao juridica. Todas
--            as RPCs setam 'rascunho' explicitamente. Inserts manuais
--            herdam 'ativo' e pulam revisao + perdem versao inicial no
--            historico.
--
-- Esta migration corrige os defaults para o estado correto:
--   charges.is_blocking → true (bloqueio e regra padrao)
--   project_contracts.status → rascunho (estado inicial canonico)
--
-- NAO toca dados existentes — so altera o default para inserts futuros.

BEGIN;

-- Defeito A
ALTER TABLE public.charges
  ALTER COLUMN is_blocking SET DEFAULT true;

COMMENT ON COLUMN public.charges.is_blocking IS
  'Quando true, charge atrasada bloqueia o projeto via trigger sync_projects_from_blocking_charges(). Default true porque a regra padrao do sistema e bloquear. Charges nao-bloqueantes (ajustes, creditos, cobrancas extras fora do contrato) devem marcar false explicitamente.';

-- Defeito B
ALTER TABLE public.project_contracts
  ALTER COLUMN status SET DEFAULT 'rascunho';

COMMENT ON COLUMN public.project_contracts.status IS
  'Estado do contrato no ciclo de vida juridico. Default rascunho — estado inicial canonico que precede revisao e ativacao formal. Progride: rascunho → ativo → encerrado/cancelado. Trigger fn_version_project_contract registra cada transicao.';

COMMIT;
