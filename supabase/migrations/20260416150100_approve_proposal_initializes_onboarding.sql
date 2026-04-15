-- PROBLEMA 6 — approve_proposal_to_project agora inicializa o checklist
-- de onboarding com 5 itens default em done=false. Resto da funcao
-- preserva o comportamento anterior (criacao atomica de projeto +
-- contrato + parcelas + charges + opcional subscription + timeline).

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
  v_billing jsonb;
  v_payment_model payment_model;
  v_entry_percentage numeric;
  v_delivery_percentage numeric;
  v_entry_amount numeric;
  v_delivery_amount numeric;
  v_entry_due date;
  v_delivery_due date;
  v_entry_installment_id uuid;
  v_delivery_installment_id uuid;
  v_subscription jsonb;
  v_subscription_id uuid;
  v_sub_amount numeric;
  v_sub_due_day int;
  v_sub_starts date;
  v_sub_ends date;
  v_total numeric;
  v_onboarding_default jsonb := jsonb_build_object(
    'scope_confirmed',    jsonb_build_object('done', false, 'owner', 'elkys',         'note', ''),
    'materials_received', jsonb_build_object('done', false, 'owner', 'cliente',       'note', ''),
    'access_provided',    jsonb_build_object('done', false, 'owner', 'cliente',       'note', ''),
    'schedule_aligned',   jsonb_build_object('done', false, 'owner', 'compartilhado', 'note', ''),
    'team_assigned',      jsonb_build_object('done', false, 'owner', 'elkys',         'note', '')
  );
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

  v_client_id := v_proposal.client_id;
  IF v_client_id IS NULL AND v_proposal.lead_id IS NOT NULL THEN
    v_client_id := public.convert_lead_to_client(v_proposal.lead_id, '{}'::jsonb);
    SELECT * INTO v_proposal FROM public.proposals WHERE id = p_proposal_id;
  END IF;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'proposta sem cliente nem lead vinculado — impossivel criar projeto';
  END IF;

  v_billing := COALESCE(v_proposal.billing_config, '{}'::jsonb);
  v_payment_model := COALESCE(
    NULLIF(v_billing->>'payment_model', '')::payment_model,
    '50_50'::payment_model
  );

  -- 1. Project shell + onboarding_checklist inicializado.
  INSERT INTO public.projects (
    client_id, name, description, status, current_stage, billing_type,
    proposal_id, solution_type, onboarding_checklist
  ) VALUES (
    v_client_id,
    v_proposal.title,
    v_proposal.scope_summary,
    'negociacao',
    'Acordo Formal',
    CASE WHEN (v_billing->'subscription') IS NOT NULL
              AND jsonb_typeof(v_billing->'subscription') = 'object'
         THEN 'mensal'::billing_type
         ELSE 'projeto'::billing_type
    END,
    v_proposal.id,
    v_proposal.solution_type,
    v_onboarding_default
  ) RETURNING id INTO v_project_id;

  -- 2. Contract draft.
  INSERT INTO public.project_contracts (
    project_id, client_id, total_amount, scope_summary, starts_at,
    status, payment_model, created_by
  ) VALUES (
    v_project_id, v_client_id, v_proposal.total_amount, v_proposal.scope_summary,
    v_today, 'rascunho', v_payment_model, auth.uid()
  ) RETURNING id INTO v_contract_id;

  -- 3. Installments + charges.
  v_total := COALESCE(v_proposal.total_amount, 0);

  IF v_total > 0
     AND (v_billing ? 'entry_due_date')
     AND (v_billing ? 'delivery_due_date')
     AND NULLIF(v_billing->>'entry_due_date', '') IS NOT NULL
     AND NULLIF(v_billing->>'delivery_due_date', '') IS NOT NULL
  THEN
    v_entry_due := (v_billing->>'entry_due_date')::date;
    v_delivery_due := (v_billing->>'delivery_due_date')::date;

    v_entry_percentage := CASE v_payment_model
      WHEN '50_50' THEN 50
      WHEN 'a_vista' THEN 100
      ELSE COALESCE(NULLIF(v_billing->>'entry_percentage', '')::numeric, 50)
    END;
    v_delivery_percentage := 100 - v_entry_percentage;

    v_entry_amount := round((v_total * v_entry_percentage / 100)::numeric, 2);
    v_delivery_amount := round((v_total - v_entry_amount)::numeric, 2);

    INSERT INTO public.project_installments (
      client_id, contract_id, project_id, installment_type, percentage, amount,
      trigger_type, expected_due_date, effective_due_date, status, is_blocking
    ) VALUES (
      v_client_id, v_contract_id, v_project_id,
      'entrada', v_entry_percentage, v_entry_amount,
      'assinatura', v_entry_due, v_entry_due, 'pendente', true
    ) RETURNING id INTO v_entry_installment_id;

    IF v_delivery_amount > 0 THEN
      INSERT INTO public.project_installments (
        client_id, contract_id, project_id, installment_type, percentage, amount,
        trigger_type, expected_due_date, effective_due_date, status, is_blocking
      ) VALUES (
        v_client_id, v_contract_id, v_project_id,
        'entrega', v_delivery_percentage, v_delivery_amount,
        'conclusao', v_delivery_due, v_delivery_due, 'agendada', true
      ) RETURNING id INTO v_delivery_installment_id;
    END IF;

    INSERT INTO public.charges (
      client_id, project_id, contract_id, installment_id, origin_type,
      description, amount, due_date, status, is_blocking, is_historical
    ) VALUES (
      v_client_id, v_project_id, v_contract_id, v_entry_installment_id,
      'parcela_projeto',
      format('Entrada %s%% - %s', v_entry_percentage, v_proposal.title),
      v_entry_amount, v_entry_due, 'pendente', true, false
    );

    IF v_delivery_amount > 0 THEN
      INSERT INTO public.charges (
        client_id, project_id, contract_id, installment_id, origin_type,
        description, amount, due_date, status, is_blocking, is_historical
      ) VALUES (
        v_client_id, v_project_id, v_contract_id, v_delivery_installment_id,
        'parcela_projeto',
        format('Entrega %s%% - %s', v_delivery_percentage, v_proposal.title),
        v_delivery_amount, v_delivery_due, 'pendente', true, false
      );
    END IF;
  END IF;

  -- 4. Mensalidade opcional.
  v_subscription := v_billing->'subscription';
  IF v_subscription IS NOT NULL AND jsonb_typeof(v_subscription) = 'object' THEN
    v_sub_amount := NULLIF(v_subscription->>'amount', '')::numeric;
    v_sub_due_day := NULLIF(v_subscription->>'due_day', '')::int;
    v_sub_starts := NULLIF(v_subscription->>'starts_on', '')::date;
    v_sub_ends := NULLIF(v_subscription->>'ends_on', '')::date;

    IF v_sub_amount IS NOT NULL AND v_sub_amount > 0
       AND v_sub_due_day BETWEEN 1 AND 31
       AND v_sub_starts IS NOT NULL THEN
      INSERT INTO public.project_subscriptions (
        client_id, project_id, label, amount, due_day, starts_on, ends_on,
        status, is_blocking
      ) VALUES (
        v_client_id, v_project_id,
        COALESCE(NULLIF(v_subscription->>'label', ''), 'Mensalidade'),
        v_sub_amount, v_sub_due_day, v_sub_starts, v_sub_ends,
        'ativa', true
      ) RETURNING id INTO v_subscription_id;

      INSERT INTO public.charges (
        client_id, project_id, subscription_id, origin_type, description,
        amount, due_date, status, is_blocking
      )
      SELECT
        v_client_id, v_project_id, v_subscription_id, 'mensalidade',
        COALESCE(NULLIF(v_subscription->>'label', ''), 'Mensalidade'),
        v_sub_amount,
        v_sub_starts,
        CASE WHEN v_sub_starts > v_today THEN 'agendada'::invoice_status
             ELSE 'pendente'::invoice_status END,
        true;
    END IF;
  END IF;

  -- 5. Documento tecnico anexo.
  IF v_proposal.technical_document_url IS NOT NULL
     AND length(trim(v_proposal.technical_document_url)) > 0 THEN
    INSERT INTO public.documents (
      client_id, project_id, label, url, type, uploaded_by
    ) VALUES (
      v_client_id, v_project_id,
      format('Anexo tecnico - %s', v_proposal.title),
      v_proposal.technical_document_url, 'outro', auth.uid()
    );
  END IF;

  -- 6. Marcar proposta como aprovada.
  UPDATE public.proposals
     SET status = 'aprovada',
         approved_at = COALESCE(approved_at, now()),
         updated_at = now()
   WHERE id = p_proposal_id;

  -- 7. Timeline.
  INSERT INTO public.timeline_events (
    client_id, project_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_client_id, v_project_id,
    'proposta_aprovada',
    'Projeto criado a partir de proposta',
    format('Proposta "%s" aprovada. Projeto, contrato, cobrancas e onboarding criados.', v_proposal.title),
    'ambos', 'proposals', p_proposal_id, auth.uid(), '{}'::jsonb
  );

  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'client_id', v_client_id,
    'contract_id', v_contract_id,
    'subscription_id', v_subscription_id,
    'has_billing', v_entry_installment_id IS NOT NULL,
    'onboarding_initialized', true
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION public.approve_proposal_to_project(uuid) TO authenticated;

COMMENT ON FUNCTION public.approve_proposal_to_project(uuid) IS
  'Aprova proposta atomicamente: converte lead em cliente se necessario, cria projeto + contract draft + (se billing_config preenchido) installments + charges + opcional subscription + primeira charge recorrente. Inicializa onboarding_checklist com 5 itens default. Tudo em uma transacao.';
