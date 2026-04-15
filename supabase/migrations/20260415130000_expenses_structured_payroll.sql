-- Auditoria 2026-04-15: estruturar tabela expenses para suportar folha,
-- pro-labore e separacao fixo/variavel. Antes a tabela tinha apenas
-- categoria string livre, sem distincao contabil — burn rate e margem
-- operacional ficavam estruturalmente subestimadas porque o admin nao
-- tinha como sinalizar custos fixos recorrentes (folha CLT, pro-labore
-- de socio, hospedagem, etc.) de gastos pontuais.
--
-- Esta migration:
--   1. Adiciona `is_fixed BOOLEAN NOT NULL DEFAULT false` em expenses,
--      permitindo que cada lancamento sinalize se e custo fixo recorrente
--      ou variavel/pontual.
--   2. Cria index parcial para acelerar agregacao de fixos por mes.
--
-- Nao remove categorias antigas; novos valores aceitos no client side:
--   - 'pro_labore'   (pro-labore de socio)
--   - 'pessoal_clt'  (folha de funcionarios CLT)
--   - 'pessoal_pj'   (contratos PJ recorrentes)
--
-- A tabela expenses continua sem FK para projects (despesas operacionais
-- da empresa, nao do projeto). Margem por projeto requer outro modelo
-- (fora do escopo desta release).

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.expenses.is_fixed IS
  'TRUE para custos fixos recorrentes (folha, pro-labore, hospedagem, software anual). Usado para segregar burn rate fixo vs variavel na auditoria financeira.';

CREATE INDEX IF NOT EXISTS idx_expenses_fixed_date
  ON public.expenses (is_fixed, expense_date DESC);
