-- PROBLEMA 3 — project_installments sem UNIQUE(contract_id, installment_type).
--
-- O modelo financeiro do sistema assume exatamente 1 entrada + 1 entrega
-- por contrato (create_project_with_billing, approve_proposal_to_project,
-- Finance.tsx, ContractVersionHistory todos dependem disso). Mas o DB nao
-- impede duplicacao. Risco: dupla cobranca, MRR contaminado, total
-- contratado errado, margem operacional inflada.
--
-- Esta migration:
--   1) Detecta duplicatas existentes e FALHA explicitamente se houver
--      (admin precisa resolver manualmente — nao deduplicar
--      automaticamente porque pode haver intencao comercial).
--   2) Aplica UNIQUE (contract_id, installment_type).

BEGIN;

-- 1) Verificar duplicatas pre-existentes.
DO $$
DECLARE
  v_dup_count integer;
  v_dup_sample text;
BEGIN
  SELECT COUNT(*),
         string_agg(format('contract=%s type=%s count=%s', contract_id, installment_type, c), '; ')
    INTO v_dup_count, v_dup_sample
    FROM (
      SELECT contract_id, installment_type, COUNT(*) AS c
        FROM public.project_installments
       GROUP BY contract_id, installment_type
      HAVING COUNT(*) > 1
       LIMIT 5
    ) d;

  IF v_dup_count > 0 THEN
    RAISE EXCEPTION
      'Duplicatas existentes em project_installments (% grupos). Resolva manualmente antes de aplicar UNIQUE. Amostra: %',
      v_dup_count, COALESCE(v_dup_sample, 'n/d');
  END IF;
END $$;

-- 2) UNIQUE composta: cada contrato tem no maximo 1 entrada e 1 entrega.
ALTER TABLE public.project_installments
  DROP CONSTRAINT IF EXISTS project_installments_contract_type_unique;

ALTER TABLE public.project_installments
  ADD CONSTRAINT project_installments_contract_type_unique
  UNIQUE (contract_id, installment_type);

COMMENT ON CONSTRAINT project_installments_contract_type_unique
  ON public.project_installments IS
  'Cada contrato tem no maximo 1 parcela de cada tipo (entrada/entrega). Protege contra duplicacao silenciosa que contamina cobrancas e metricas financeiras. Para suportar mais parcelas no futuro, adicionar coluna installment_no e estender a constraint.';

COMMIT;
