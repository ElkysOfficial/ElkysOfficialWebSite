-- Reescreve approve_proposal_to_project para, após criar projeto/contrato/
-- cobranças, inserir admin_notifications para cada área downstream e
-- criar tarefas automáticas no kanban (team_tasks).
--
-- Notificações criadas:
--   1. Jurídico: "Contrato para revisar"
--   2. Financeiro: "Cobranças geradas — verificar"
--   3. Dev/PO: "Projeto criado — iniciar kickoff"
--   4. Comercial: "Proposta aprovada — deal fechado"
--
-- Tarefas criadas:
--   1. Jurídico: "Revisar e ativar contrato - {titulo}"
--   2. Financeiro: "Verificar cobranças geradas - {titulo}"
--   3. Dev/PO: "Kickoff do projeto - {titulo}"

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
  v_actor uuid := auth.uid();
  v_onboarding_default jsonb := jsonb_build_object(
    'scope_confirmed',    jsonb_build_object('done', false, 'owner', 'elkys',         'note', ''),
    'materials_received', jsonb_build_object('done', false, 'owner', 'cliente',       'note', ''),
    'access_provided',    jsonb_build_object('done', false, 'owner', 'cliente',       'note', ''),
    'schedule_aligned',   jsonb_build_object('done', false, 'owner', 'compartilhado', 'note', ''),
    'team_assigned',      jsonb_build_object('done', false, 'owner', 'elkys',         'note', '')
  );
BEGIN
  IF NOT public.is_admin(v_actor) THEN
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
    v_today, 'rascunho', v_payment_model, v_actor
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
      v_proposal.technical_document_url, 'outro', v_actor
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
    'ambos', 'proposals', p_proposal_id, v_actor, '{}'::jsonb
  );

  -- ═══════════════════════════════════════════════════════════════════
  -- 8. NOTIFICAÇÕES AUTOMÁTICAS PARA ÁREAS DOWNSTREAM
  -- ═══════════════════════════════════════════════════════════════════

  -- Jurídico: contrato para revisar
  INSERT INTO public.admin_notifications (
    type, title, body, severity, target_roles,
    entity_type, entity_id, action_url, created_by
  ) VALUES (
    'contrato_gerado',
    format('Contrato para revisar: %s', v_proposal.title),
    format('A proposta "%s" foi aprovada e um contrato em rascunho foi gerado. Revise e ative o contrato.', v_proposal.title),
    'action_required',
    ARRAY['admin_super', 'admin', 'juridico']::app_role[],
    'project_contract', v_contract_id,
    '/portal/admin/contratos',
    v_actor
  );

  -- Financeiro: cobranças geradas
  INSERT INTO public.admin_notifications (
    type, title, body, severity, target_roles,
    entity_type, entity_id, action_url, created_by
  ) VALUES (
    'cobrancas_geradas',
    format('Cobranças criadas: %s', v_proposal.title),
    format('O projeto "%s" foi criado com cobranças vinculadas. Verifique parcelas e mensalidades no financeiro.', v_proposal.title),
    'info',
    ARRAY['admin_super', 'admin', 'financeiro']::app_role[],
    'project', v_project_id,
    '/portal/admin/financeiro',
    v_actor
  );

  -- Dev/PO: projeto criado
  INSERT INTO public.admin_notifications (
    type, title, body, severity, target_roles,
    entity_type, entity_id, action_url, created_by
  ) VALUES (
    'projeto_criado',
    format('Novo projeto: %s', v_proposal.title),
    format('O projeto "%s" foi criado a partir de proposta aprovada. Inicie o onboarding e kickoff.', v_proposal.title),
    'action_required',
    ARRAY['admin_super', 'admin', 'developer', 'designer', 'po']::app_role[],
    'project', v_project_id,
    format('/portal/admin/projetos/%s', v_project_id),
    v_actor
  );

  -- Comercial: deal fechado
  INSERT INTO public.admin_notifications (
    type, title, body, severity, target_roles,
    entity_type, entity_id, action_url, created_by
  ) VALUES (
    'deal_fechado',
    format('Deal fechado: %s', v_proposal.title),
    format('A proposta "%s" foi convertida em projeto. Contrato, cobranças e onboarding foram criados automaticamente.', v_proposal.title),
    'success',
    ARRAY['admin_super', 'admin', 'comercial']::app_role[],
    'proposal', p_proposal_id,
    format('/portal/admin/propostas/%s', p_proposal_id),
    v_actor
  );

  -- ═══════════════════════════════════════════════════════════════════
  -- 9. TAREFAS AUTOMÁTICAS NO KANBAN
  -- ═══════════════════════════════════════════════════════════════════

  -- Tarefa jurídico: revisar contrato (prazo 3 dias úteis)
  INSERT INTO public.team_tasks (
    title, description, category, status, priority,
    project_id, client_id, role_visibility, due_date, created_by
  ) VALUES (
    format('Revisar e ativar contrato - %s', v_proposal.title),
    format('Contrato gerado automaticamente a partir da proposta "%s". Revise o escopo, condições e ative o contrato para o cliente validar.', v_proposal.title),
    'juridico', 'pendente', 'alta',
    v_project_id, v_client_id,
    ARRAY['admin_super', 'admin', 'juridico'],
    v_today + 3,
    v_actor
  );

  -- Tarefa financeiro: verificar cobranças (prazo 1 dia útil)
  INSERT INTO public.team_tasks (
    title, description, category, status, priority,
    project_id, client_id, role_visibility, due_date, created_by
  ) VALUES (
    format('Verificar cobranças geradas - %s', v_proposal.title),
    format('Cobranças foram criadas automaticamente para o projeto "%s". Verifique valores, datas de vencimento e modelo de pagamento.', v_proposal.title),
    'financeiro', 'pendente', 'media',
    v_project_id, v_client_id,
    ARRAY['admin_super', 'admin', 'financeiro'],
    v_today + 1,
    v_actor
  );

  -- Tarefa dev/PO: kickoff do projeto (prazo 5 dias úteis)
  INSERT INTO public.team_tasks (
    title, description, category, status, priority,
    project_id, client_id, role_visibility, due_date, created_by
  ) VALUES (
    format('Kickoff do projeto - %s', v_proposal.title),
    format('O projeto "%s" foi criado. Complete o onboarding (escopo, materiais, acessos, cronograma, equipe) e inicie a execução.', v_proposal.title),
    'desenvolvimento', 'pendente', 'alta',
    v_project_id, v_client_id,
    ARRAY['admin_super', 'admin', 'developer', 'designer', 'po'],
    v_today + 5,
    v_actor
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

COMMENT ON FUNCTION public.approve_proposal_to_project(uuid) IS
  'Aprova proposta atomicamente: converte lead em cliente se necessario, cria projeto + contract draft + installments + charges + opcional subscription. Inicializa onboarding_checklist com 5 itens. Cria admin_notifications para juridico, financeiro, dev/PO e comercial. Cria tarefas automaticas no kanban para cada area.';
