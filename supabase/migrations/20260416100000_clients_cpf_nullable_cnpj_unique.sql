-- PROBLEMA 1 — clients.cpf NOT NULL UNIQUE quebra fluxo lead → cliente.
--
-- A RPC convert_lead_to_client insere cpf='' quando o lead nao tem CPF
-- (leads nao capturam CPF). Primeira conversao funciona; segunda viola
-- UNIQUE porque duas linhas com cpf='' nao sao consideradas distintas.
--
-- Correcao:
--   1) Normalizar cpf='' existente para NULL.
--   2) Tornar cpf nullable (DROP NOT NULL). UNIQUE em coluna nullable
--      permite multiplos NULLs (comportamento correto do Postgres).
--   3) Bonus de integridade simetrica: tornar cnpj UNIQUE para evitar
--      duplicacao de cliente PJ pelo mesmo CNPJ. CNPJ continua nullable
--      (PF nao tem) — UNIQUE permite multiplos NULLs.
--
-- Antes de aplicar UNIQUE em cnpj, normalizar cnpj='' para NULL e
-- detectar/falhar se houver duplicatas existentes.

BEGIN;

-- 1) Normalizar strings vazias para NULL.
UPDATE public.clients SET cpf = NULL WHERE cpf = '';
UPDATE public.clients SET cnpj = NULL WHERE cnpj = '';

-- 2) cpf passa a ser nullable.
ALTER TABLE public.clients
  ALTER COLUMN cpf DROP NOT NULL;

-- 3) Detectar duplicatas de cnpj antes de aplicar UNIQUE.
DO $$
DECLARE
  v_dup_count integer;
BEGIN
  SELECT COUNT(*)
    INTO v_dup_count
    FROM (
      SELECT cnpj
        FROM public.clients
       WHERE cnpj IS NOT NULL
       GROUP BY cnpj
      HAVING COUNT(*) > 1
    ) d;

  IF v_dup_count > 0 THEN
    RAISE EXCEPTION
      'CNPJs duplicados em clients (% grupos). Resolva manualmente antes de aplicar UNIQUE.',
      v_dup_count;
  END IF;
END $$;

-- 4) UNIQUE em cnpj.
ALTER TABLE public.clients
  ADD CONSTRAINT clients_cnpj_unique UNIQUE (cnpj);

COMMENT ON COLUMN public.clients.cpf IS
  'CPF do cliente PF. Nullable: clientes PJ nao tem CPF. UNIQUE com tratamento de NULL multiplo do Postgres.';
COMMENT ON COLUMN public.clients.cnpj IS
  'CNPJ do cliente PJ. Nullable: clientes PF nao tem CNPJ. UNIQUE para impedir duplicacao de empresa.';

COMMIT;
