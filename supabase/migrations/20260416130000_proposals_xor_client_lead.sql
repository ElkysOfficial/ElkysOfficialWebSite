-- PROBLEMA 4 — proposals sem CHECK XOR(client_id, lead_id).
--
-- O modelo conceitual: toda proposta pertence a EXATAMENTE UM
-- destinatario (cliente OU lead, nunca ambos, nunca nenhum). O DB
-- aceita 4 estados, 2 deles invalidos:
--   - ambos NULL → proposta orfa (RPC de aprovacao falha tarde)
--   - ambos set → proposta ambigua (lead silenciosamente abandonado)
--
-- Esta migration:
--   1) Detecta propostas invalidas existentes e FALHA explicitamente
--      (admin precisa decidir caso a caso — nao da pra escolher
--      automaticamente quem e dono).
--   2) Aplica CHECK XOR.

BEGIN;

-- 1) Verificar propostas invalidas existentes.
DO $$
DECLARE
  v_orphan_count integer;
  v_ambiguous_count integer;
  v_orphan_sample text;
  v_ambiguous_sample text;
BEGIN
  SELECT COUNT(*),
         string_agg(format('id=%s title=%s', id, title), '; ')
    INTO v_orphan_count, v_orphan_sample
    FROM (
      SELECT id, title
        FROM public.proposals
       WHERE client_id IS NULL AND lead_id IS NULL
       LIMIT 5
    ) o;

  SELECT COUNT(*),
         string_agg(format('id=%s title=%s', id, title), '; ')
    INTO v_ambiguous_count, v_ambiguous_sample
    FROM (
      SELECT id, title
        FROM public.proposals
       WHERE client_id IS NOT NULL AND lead_id IS NOT NULL
       LIMIT 5
    ) a;

  IF v_orphan_count > 0 OR v_ambiguous_count > 0 THEN
    RAISE EXCEPTION
      'Propostas invalidas existentes — orfas: % (%); ambiguas: % (%). Resolva manualmente antes de aplicar XOR.',
      v_orphan_count, COALESCE(v_orphan_sample, 'n/d'),
      v_ambiguous_count, COALESCE(v_ambiguous_sample, 'n/d');
  END IF;
END $$;

-- 2) CHECK XOR: exatamente um de client_id ou lead_id deve estar set.
--    O operador <> entre dois booleanos e XOR.
ALTER TABLE public.proposals
  DROP CONSTRAINT IF EXISTS proposals_client_xor_lead;

ALTER TABLE public.proposals
  ADD CONSTRAINT proposals_client_xor_lead
  CHECK ((client_id IS NOT NULL) <> (lead_id IS NOT NULL));

COMMENT ON CONSTRAINT proposals_client_xor_lead ON public.proposals IS
  'Toda proposta pertence a exatamente UM destinatario: cliente existente OU lead. Bloqueia propostas orfas (ambos NULL) e ambiguas (ambos set) que quebravam o fluxo de aprovacao e mascaravam metricas de CRM.';

COMMIT;
