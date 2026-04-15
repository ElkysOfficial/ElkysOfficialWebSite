-- Step 4 original da auditoria arquitetural (P-007 — imutabilidade de
-- proposta aprovada).
--
-- Antes: depois de uma proposta ser aprovada e gerar contrato/projeto/faturas,
-- nada impedia o admin (ou bug de UI) de editar o total_amount, scope_summary
-- ou outros campos contratualmente relevantes. O contrato e as charges ja
-- foram criados com base nos valores antigos, mas a proposta dizia outra
-- coisa — divergencia documental e risco contratual.
--
-- Esta migration cria um trigger BEFORE UPDATE em proposals que bloqueia
-- mudancas em campos contratualmente sensiveis quando approved_at ja esta
-- preenchido. Mudancas em campos administrativos (notas internas,
-- observations, tags) continuam permitidas.
--
-- Campos imutaveis apos aprovacao:
--   - total_amount
--   - scope_summary
--   - solution_type
--   - billing_config (a config que gerou as faturas, nao pode mudar)
--   - client_id / lead_id (vinculo)
--   - title (identidade do que foi aprovado)
--
-- Campos editaveis apos aprovacao:
--   - status (ex: pode ir para 'expirada' apos validade)
--   - rejection_reason, rejected_at (anular aprovacao em caso extremo)
--   - observations, payment_conditions (notas administrativas)
--   - document_url, technical_document_url (links podem ser corrigidos)
--   - approved_at (idempotente)
--   - updated_at (sempre)

CREATE OR REPLACE FUNCTION public.fn_proposal_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  -- So protege se a proposta JA estava aprovada antes deste UPDATE.
  IF OLD.approved_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
    RAISE EXCEPTION 'proposta aprovada: total_amount nao pode ser alterado (era %, tentou %)',
      OLD.total_amount, NEW.total_amount
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.scope_summary IS DISTINCT FROM NEW.scope_summary THEN
    RAISE EXCEPTION 'proposta aprovada: scope_summary nao pode ser alterado'
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.solution_type IS DISTINCT FROM NEW.solution_type THEN
    RAISE EXCEPTION 'proposta aprovada: solution_type nao pode ser alterado'
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.billing_config IS DISTINCT FROM NEW.billing_config THEN
    RAISE EXCEPTION 'proposta aprovada: billing_config nao pode ser alterado (faturas ja foram geradas)'
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.client_id IS DISTINCT FROM NEW.client_id THEN
    RAISE EXCEPTION 'proposta aprovada: client_id nao pode ser alterado'
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.lead_id IS DISTINCT FROM NEW.lead_id THEN
    RAISE EXCEPTION 'proposta aprovada: lead_id nao pode ser alterado'
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.title IS DISTINCT FROM NEW.title THEN
    RAISE EXCEPTION 'proposta aprovada: title nao pode ser alterado'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$func$;

COMMENT ON FUNCTION public.fn_proposal_immutability() IS
  'Trigger BEFORE UPDATE em proposals: bloqueia mudancas em campos contratuais (total_amount, scope_summary, billing_config, client_id, lead_id, title, solution_type) quando approved_at ja esta preenchido. Ver auditoria P-007.';

DROP TRIGGER IF EXISTS trg_proposal_immutability ON public.proposals;
CREATE TRIGGER trg_proposal_immutability
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_proposal_immutability();
