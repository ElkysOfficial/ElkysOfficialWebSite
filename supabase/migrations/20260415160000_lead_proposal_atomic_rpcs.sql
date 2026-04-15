-- Etapa 4 / Step 2 da auditoria arquitetural.
-- Resolve P-002 (fire-and-forget na aprovacao de proposta),
-- P-004 (lead → cliente sem automacao, dois cliques manuais),
-- P-005 (conversao lead→cliente sem transacao).
--
-- Cria duas funcoes SQL atomicas:
--
--   1) convert_lead_to_client(p_lead_id, p_overrides) → uuid
--      Cria cliente a partir de lead, marca lead como ganho, migra
--      propostas vinculadas e registra timeline. Idempotente: se o lead
--      ja foi convertido (converted_client_id NOT NULL), retorna o
--      client_id existente sem refazer.
--
--   2) approve_proposal_to_project(p_proposal_id) → jsonb
--      Aprovacao atomica de proposta. Se a proposta esta vinculada a
--      lead sem cliente, dispara convert_lead_to_client internamente.
--      Cria project shell + contract draft + timeline event + (opcional)
--      anexo em documents. Marca proposta como aprovada. Tudo em uma
--      unica transacao plpgsql.

-- ────────────────────────────────────────────────────────────────────
-- 1) convert_lead_to_client
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.convert_lead_to_client(
  p_lead_id uuid,
  p_overrides jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_lead RECORD;
  v_client_id uuid;
  v_origin client_origin;
  v_full_name text;
  v_email text;
  v_phone text;
  v_company text;
  v_client_type text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead nao encontrado';
  END IF;

  -- Idempotencia: ja convertido → retorna o cliente existente.
  IF v_lead.converted_client_id IS NOT NULL THEN
    RETURN v_lead.converted_client_id;
  END IF;

  -- Overrides do JSONB sobrepoem dados do lead (admin pode editar
  -- nome/email/telefone/empresa antes de converter).
  v_full_name  := COALESCE(NULLIF(p_overrides->>'full_name', ''), v_lead.name);
  v_email      := COALESCE(NULLIF(p_overrides->>'email', ''), v_lead.email, '');
  v_phone      := COALESCE(NULLIF(p_overrides->>'phone', ''), v_lead.phone);
  v_company    := COALESCE(NULLIF(p_overrides->>'company', ''), v_lead.company);
  v_client_type := COALESCE(NULLIF(p_overrides->>'client_type', ''),
                            CASE WHEN v_company IS NOT NULL THEN 'pj' ELSE 'pf' END);

  v_origin := CASE
    WHEN v_lead.source = 'indicacao' THEN 'indicacao'::client_origin
    WHEN v_lead.source = 'inbound'   THEN 'inbound'::client_origin
    ELSE 'lead'::client_origin
  END;

  INSERT INTO public.clients (
    full_name, email, cpf, phone, client_type, nome_fantasia, client_origin
  ) VALUES (
    v_full_name,
    v_email,
    COALESCE(NULLIF(p_overrides->>'cpf', ''), ''),
    v_phone,
    v_client_type,
    v_company,
    v_origin
  ) RETURNING id INTO v_client_id;

  -- Migra propostas vinculadas ao lead para o novo cliente.
  UPDATE public.proposals
     SET client_id = v_client_id,
         lead_id   = NULL,
         updated_at = now()
   WHERE lead_id = p_lead_id;

  -- Marca lead como ganho.
  UPDATE public.leads
     SET status = 'ganho',
         converted_client_id = v_client_id,
         updated_at = now()
   WHERE id = p_lead_id;

  -- Timeline.
  INSERT INTO public.timeline_events (
    client_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_client_id,
    'lead_convertido',
    'Cliente convertido de lead',
    format(
      'Lead "%s"%s convertido em cliente.',
      v_lead.name,
      CASE WHEN v_company IS NOT NULL THEN format(' (%s)', v_company) ELSE '' END
    ),
    'interno',
    'leads',
    p_lead_id,
    auth.uid(),
    '{}'::jsonb
  );

  RETURN v_client_id;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.convert_lead_to_client(uuid, jsonb) TO authenticated;

COMMENT ON FUNCTION public.convert_lead_to_client(uuid, jsonb) IS
  'Converte lead em cliente atomicamente. Idempotente. Aceita overrides JSONB para fields editaveis pelo admin antes da conversao. Ver auditoria P-005.';

-- ────────────────────────────────────────────────────────────────────
-- 2) approve_proposal_to_project
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.approve_proposal_to_project(p_proposal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_proposal RECORD;
  v_client_id uuid;
  v_project_id uuid;
  v_contract_id uuid;
  v_today date := CURRENT_DATE;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  SELECT * INTO v_proposal FROM public.proposals WHERE id = p_proposal_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'proposta nao encontrada';
  END IF;

  IF v_proposal.status NOT IN ('enviada', 'aprovada') THEN
    RAISE EXCEPTION 'proposta nao pode ser aprovada no status atual: %', v_proposal.status;
  END IF;

  -- Resolver client_id.
  v_client_id := v_proposal.client_id;

  IF v_client_id IS NULL AND v_proposal.lead_id IS NOT NULL THEN
    -- Auto-conversao do lead. Idempotente — convert_lead_to_client
    -- retorna o client_id existente se ja foi convertido.
    v_client_id := public.convert_lead_to_client(v_proposal.lead_id, '{}'::jsonb);
    -- Recarrega proposal porque convert_lead_to_client migrou o vinculo.
    SELECT * INTO v_proposal FROM public.proposals WHERE id = p_proposal_id;
  END IF;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'proposta sem cliente nem lead vinculado — impossivel criar projeto';
  END IF;

  -- Project shell.
  INSERT INTO public.projects (
    client_id, name, description, status, current_stage, billing_type,
    proposal_id, solution_type
  ) VALUES (
    v_client_id,
    v_proposal.title,
    v_proposal.scope_summary,
    'negociacao',
    'Acordo Formal',
    'projeto',
    v_proposal.id,
    v_proposal.solution_type
  ) RETURNING id INTO v_project_id;

  -- Contract draft a partir da proposta.
  INSERT INTO public.project_contracts (
    project_id, client_id, total_amount, scope_summary, starts_at,
    status, payment_model, created_by
  ) VALUES (
    v_project_id,
    v_client_id,
    v_proposal.total_amount,
    v_proposal.scope_summary,
    v_today,
    'rascunho',
    '50_50',
    auth.uid()
  ) RETURNING id INTO v_contract_id;

  -- Documento tecnico anexo (se houver URL na proposta).
  IF v_proposal.technical_document_url IS NOT NULL
     AND length(trim(v_proposal.technical_document_url)) > 0 THEN
    INSERT INTO public.documents (
      client_id, project_id, label, url, type, uploaded_by
    ) VALUES (
      v_client_id,
      v_project_id,
      format('Anexo tecnico - %s', v_proposal.title),
      v_proposal.technical_document_url,
      'outro',
      auth.uid()
    );
  END IF;

  -- Marcar proposta como aprovada (idempotente — pode ja estar aprovada).
  UPDATE public.proposals
     SET status = 'aprovada',
         approved_at = COALESCE(approved_at, now()),
         updated_at = now()
   WHERE id = p_proposal_id;

  -- Timeline.
  INSERT INTO public.timeline_events (
    client_id, project_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_client_id,
    v_project_id,
    'proposta_aprovada',
    'Projeto criado a partir de proposta',
    format('Proposta "%s" aprovada. Projeto e contrato rascunho criados.', v_proposal.title),
    'ambos',
    'proposals',
    p_proposal_id,
    auth.uid(),
    '{}'::jsonb
  );

  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'client_id', v_client_id,
    'contract_id', v_contract_id
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION public.approve_proposal_to_project(uuid) TO authenticated;

COMMENT ON FUNCTION public.approve_proposal_to_project(uuid) IS
  'Aprova proposta atomicamente: converte lead em cliente se necessario, cria project shell + contract rascunho + (opcional) documento, marca proposta como aprovada, registra timeline. Tudo em uma transacao. Ver auditoria P-002, P-004.';
