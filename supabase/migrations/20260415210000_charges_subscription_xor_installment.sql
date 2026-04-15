-- R4 / P-013 — CHECK constraint impedindo charge com subscription_id E
-- installment_id simultaneamente.
--
-- Antes: ambos sao FKs nullable em charges. O codigo TS respeita a
-- separacao (subscription_id → mensalidade, installment_id → parcela
-- de projeto), mas qualquer SQL direto, edge function ou migration
-- futura pode criar uma charge ambigua que entra DUAS VEZES nas
-- agregacoes financeiras (uma como recorrente, outra como projeto).
--
-- Defesa em profundidade: CHECK constraint que aceita:
--   - ambos NULL (charge manual sem vinculo)
--   - apenas subscription_id (mensalidade)
--   - apenas installment_id (parcela de projeto)
--   - REJEITA ambos preenchidos
--
-- Antes de aplicar, normaliza qualquer linha existente que ja viole
-- (set installment_id = NULL se ambos preenchidos, mantendo a charge
-- como mensalidade — decisao conservadora).

UPDATE public.charges
   SET installment_id = NULL
 WHERE subscription_id IS NOT NULL
   AND installment_id IS NOT NULL;

ALTER TABLE public.charges
  DROP CONSTRAINT IF EXISTS charges_subscription_xor_installment;

ALTER TABLE public.charges
  ADD CONSTRAINT charges_subscription_xor_installment
  CHECK (
    NOT (subscription_id IS NOT NULL AND installment_id IS NOT NULL)
  );

COMMENT ON CONSTRAINT charges_subscription_xor_installment ON public.charges IS
  'Garante que uma charge nao pode estar vinculada a uma subscription E uma installment ao mesmo tempo. Ambas FKs nullable, apenas uma pode ser preenchida (ou nenhuma para charges manuais).';
