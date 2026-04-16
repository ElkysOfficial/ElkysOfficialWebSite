-- REESTRUTURAÇÃO DO FLUXO OPERACIONAL
--
-- Fluxo ANTES (errado):
--   Proposta aprovada → cria Cliente + Contrato + Projeto + Cobranças + Onboarding
--
-- Fluxo DEPOIS (correto):
--   1. Proposta aprovada → cria Cliente + Contrato (rascunho)
--   2. Jurídico revisa → envia para validação → cliente assina
--   3. Contrato ativado → cria Projeto + Cobranças + Onboarding
--
-- Isso garante que:
--   - Projeto NÃO nasce sem contrato assinado
--   - Jurídico tem tempo para revisar
--   - Financeiro só gera cobranças com contrato vigente
--   - Dev só recebe projeto quando tudo está formalizado

-- ═══════════════════════════════════════════════════════════════════════
-- 1. REESCREVE approve_proposal_to_project
--    Agora cria APENAS: cliente (se lead) + contrato (rascunho)
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.approve_proposal_to_project(p_proposal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_proposal RECORD;
  v_client_id uuid;
  v_contract_id uuid;
  v_today date := CURRENT_DATE;
  v_billing jsonb;
  v_payment_model payment_model;
  v_actor uuid := auth.uid();
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

  -- 1. Converter lead em cliente (se necessário)
  v_client_id := v_proposal.client_id;
  IF v_client_id IS NULL AND v_proposal.lead_id IS NOT NULL THEN
    v_client_id := public.convert_lead_to_client(v_proposal.lead_id, '{}'::jsonb);
    SELECT * INTO v_proposal FROM public.proposals WHERE id = p_proposal_id;
  END IF;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'proposta sem cliente nem lead vinculado';
  END IF;

  v_billing := COALESCE(v_proposal.billing_config, '{}'::jsonb);
  v_payment_model := COALESCE(
    NULLIF(v_billing->>'payment_model', '')::payment_model,
    '50_50'::payment_model
  );

  -- 2. Criar contrato (rascunho) — SEM projeto
  INSERT INTO public.project_contracts (
    project_id, client_id, total_amount, scope_summary, starts_at,
    status, payment_model, created_by
  ) VALUES (
    -- project_id será preenchido quando contrato for ativado
    NULL, v_client_id, v_proposal.total_amount, v_proposal.scope_summary,
    v_today, 'rascunho', v_payment_model, v_actor
  ) RETURNING id INTO v_contract_id;

  -- 3. Marcar proposta como aprovada
  UPDATE public.proposals
     SET status = 'aprovada',
         approved_at = COALESCE(approved_at, now()),
         updated_at = now()
   WHERE id = p_proposal_id;

  -- 4. Timeline
  INSERT INTO public.timeline_events (
    client_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_client_id,
    'proposta_aprovada',
    'Proposta aprovada — contrato em elaboração',
    format('Proposta "%s" aprovada. Contrato gerado para revisão jurídica.', v_proposal.title),
    'ambos', 'proposals', p_proposal_id, v_actor,
    jsonb_build_object('contract_id', v_contract_id)
  );

  -- 5. Notificações
  -- Jurídico: contrato para revisar
  INSERT INTO public.admin_notifications (
    type, title, body, severity, target_roles,
    entity_type, entity_id, action_url, created_by
  ) VALUES (
    'contrato_gerado',
    format('Contrato para revisar: %s', v_proposal.title),
    format('A proposta "%s" foi aprovada. Revise e ative o contrato.', v_proposal.title),
    'action_required',
    ARRAY['admin_super', 'admin', 'juridico']::app_role[],
    'project_contract', v_contract_id,
    '/portal/admin/contratos',
    v_actor
  );

  -- Comercial: deal avançou
  INSERT INTO public.admin_notifications (
    type, title, body, severity, target_roles,
    entity_type, entity_id, action_url, created_by
  ) VALUES (
    'deal_fechado',
    format('Proposta aprovada: %s', v_proposal.title),
    format('A proposta "%s" foi aprovada. Contrato gerado para o jurídico.', v_proposal.title),
    'success',
    ARRAY['admin_super', 'admin', 'comercial']::app_role[],
    'proposal', p_proposal_id,
    format('/portal/admin/propostas/%s', p_proposal_id),
    v_actor
  );

  -- 6. Tarefa para jurídico
  INSERT INTO public.team_tasks (
    title, description, category, status, priority,
    client_id, role_visibility, due_date, created_by
  ) VALUES (
    format('Revisar e ativar contrato - %s', v_proposal.title),
    format('Contrato gerado a partir da proposta "%s". Revise, anexe o PDF e envie para validação do cliente.', v_proposal.title),
    'juridico', 'pendente', 'alta',
    v_client_id,
    ARRAY['admin_super', 'admin', 'juridico'],
    v_today + 3,
    v_actor
  );

  RETURN jsonb_build_object(
    'client_id', v_client_id,
    'contract_id', v_contract_id,
    'proposal_id', p_proposal_id
  );
END;
$func$;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. NOVA RPC: activate_contract_to_project
--    Chamada quando contrato é ATIVADO → cria Projeto + Cobranças + Onboarding
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.activate_contract_to_project(p_contract_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_contract RECORD;
  v_proposal RECORD;
  v_project_id uuid;
  v_today date := CURRENT_DATE;
  v_actor uuid := auth.uid();
  v_billing jsonb;
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
  IF NOT public.is_admin_or_juridico(v_actor) THEN
    RAISE EXCEPTION 'forbidden: admin or juridico role required';
  END IF;

  SELECT * INTO v_contract FROM public.project_contracts WHERE id = p_contract_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'contrato nao encontrado';
  END IF;

  -- Só pode criar projeto se contrato está sendo ativado e ainda não tem projeto
  IF v_contract.project_id IS NOT NULL THEN
    -- Projeto já existe — retorna sem erro (idempotente)
    RETURN jsonb_build_object(
      'project_id', v_contract.project_id,
      'already_exists', true
    );
  END IF;

  -- Buscar proposta vinculada (se houver) para herdar dados
  SELECT * INTO v_proposal
    FROM public.proposals
   WHERE client_id = v_contract.client_id
     AND status = 'aprovada'
   ORDER BY approved_at DESC NULLS LAST
   LIMIT 1;

  v_billing := COALESCE(v_proposal.billing_config, '{}'::jsonb);
  v_total := COALESCE(v_contract.total_amount, 0);

  -- 1. Criar projeto
  INSERT INTO public.projects (
    client_id, name, description, status, current_stage, billing_type,
    proposal_id, solution_type, onboarding_checklist
  ) VALUES (
    v_contract.client_id,
    COALESCE(v_proposal.title, 'Projeto'),
    COALESCE(v_contract.scope_summary, v_proposal.scope_summary),
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

  -- 2. Vincular contrato ao projeto
  UPDATE public.project_contracts
     SET project_id = v_project_id,
         updated_at = now()
   WHERE id = p_contract_id;

  -- 3. Parcelas + cobranças (mesmo código que antes)
  IF v_total > 0
     AND (v_billing ? 'entry_due_date')
     AND (v_billing ? 'delivery_due_date')
     AND NULLIF(v_billing->>'entry_due_date', '') IS NOT NULL
     AND NULLIF(v_billing->>'delivery_due_date', '') IS NOT NULL
  THEN
    v_entry_due := (v_billing->>'entry_due_date')::date;
    v_delivery_due := (v_billing->>'delivery_due_date')::date;

    v_entry_percentage := CASE v_contract.payment_model
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
      v_contract.client_id, p_contract_id, v_project_id,
      'entrada', v_entry_percentage, v_entry_amount,
      'assinatura', v_entry_due, v_entry_due, 'pendente', true
    ) RETURNING id INTO v_entry_installment_id;

    IF v_delivery_amount > 0 THEN
      INSERT INTO public.project_installments (
        client_id, contract_id, project_id, installment_type, percentage, amount,
        trigger_type, expected_due_date, effective_due_date, status, is_blocking
      ) VALUES (
        v_contract.client_id, p_contract_id, v_project_id,
        'entrega', v_delivery_percentage, v_delivery_amount,
        'conclusao', v_delivery_due, v_delivery_due, 'agendada', true
      ) RETURNING id INTO v_delivery_installment_id;
    END IF;

    INSERT INTO public.charges (
      client_id, project_id, contract_id, installment_id, origin_type,
      description, amount, due_date, status, is_blocking, is_historical
    ) VALUES (
      v_contract.client_id, v_project_id, p_contract_id, v_entry_installment_id,
      'parcela_projeto',
      format('Entrada %s%% - %s', v_entry_percentage, COALESCE(v_proposal.title, 'Projeto')),
      v_entry_amount, v_entry_due, 'pendente', true, false
    );

    IF v_delivery_amount > 0 THEN
      INSERT INTO public.charges (
        client_id, project_id, contract_id, installment_id, origin_type,
        description, amount, due_date, status, is_blocking, is_historical
      ) VALUES (
        v_contract.client_id, v_project_id, p_contract_id, v_delivery_installment_id,
        'parcela_projeto',
        format('Entrega %s%% - %s', v_delivery_percentage, COALESCE(v_proposal.title, 'Projeto')),
        v_delivery_amount, v_delivery_due, 'pendente', true, false
      );
    END IF;
  END IF;

  -- 4. Mensalidade opcional
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
        v_contract.client_id, v_project_id,
        COALESCE(NULLIF(v_subscription->>'label', ''), 'Mensalidade'),
        v_sub_amount, v_sub_due_day, v_sub_starts, v_sub_ends,
        'ativa', true
      ) RETURNING id INTO v_subscription_id;

      INSERT INTO public.charges (
        client_id, project_id, subscription_id, origin_type, description,
        amount, due_date, status, is_blocking
      ) VALUES (
        v_contract.client_id, v_project_id, v_subscription_id, 'mensalidade',
        COALESCE(NULLIF(v_subscription->>'label', ''), 'Mensalidade'),
        v_sub_amount, v_sub_starts,
        CASE WHEN v_sub_starts > v_today THEN 'agendada'::invoice_status
             ELSE 'pendente'::invoice_status END,
        true
      );
    END IF;
  END IF;

  -- 5. Documento técnico
  IF v_proposal.technical_document_url IS NOT NULL
     AND length(trim(v_proposal.technical_document_url)) > 0 THEN
    INSERT INTO public.documents (
      client_id, project_id, label, url, type, uploaded_by
    ) VALUES (
      v_contract.client_id, v_project_id,
      format('Anexo tecnico - %s', COALESCE(v_proposal.title, 'Projeto')),
      v_proposal.technical_document_url, 'outro', v_actor
    );
  END IF;

  -- 6. Timeline
  INSERT INTO public.timeline_events (
    client_id, project_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_contract.client_id, v_project_id,
    'projeto_criado',
    'Projeto criado a partir de contrato ativado',
    format('Contrato ativado. Projeto, cobranças e onboarding foram criados.'),
    'ambos', 'project_contracts', p_contract_id, v_actor, '{}'::jsonb
  );

  -- 7. Notificações para áreas downstream
  INSERT INTO public.admin_notifications (
    type, title, body, severity, target_roles,
    entity_type, entity_id, action_url, created_by
  ) VALUES (
    'cobrancas_geradas',
    format('Cobranças criadas: %s', COALESCE(v_proposal.title, 'Projeto')),
    'Contrato ativado. Cobranças vinculadas foram criadas automaticamente.',
    'info',
    ARRAY['admin_super', 'admin', 'financeiro']::app_role[],
    'project', v_project_id,
    '/portal/admin/financeiro',
    v_actor
  );

  INSERT INTO public.admin_notifications (
    type, title, body, severity, target_roles,
    entity_type, entity_id, action_url, created_by
  ) VALUES (
    'projeto_criado',
    format('Novo projeto: %s', COALESCE(v_proposal.title, 'Projeto')),
    'Contrato ativado pelo jurídico. Projeto criado — inicie o onboarding.',
    'action_required',
    ARRAY['admin_super', 'admin', 'developer', 'designer', 'po']::app_role[],
    'project', v_project_id,
    format('/portal/admin/projetos/%s', v_project_id),
    v_actor
  );

  -- 8. Tarefas automáticas
  INSERT INTO public.team_tasks (
    title, description, category, status, priority,
    project_id, client_id, role_visibility, due_date, created_by
  ) VALUES (
    format('Verificar cobranças - %s', COALESCE(v_proposal.title, 'Projeto')),
    'Cobranças geradas automaticamente a partir do contrato ativado. Verifique valores e datas.',
    'financeiro', 'pendente', 'media',
    v_project_id, v_contract.client_id,
    ARRAY['admin_super', 'admin', 'financeiro'],
    v_today + 1,
    v_actor
  );

  INSERT INTO public.team_tasks (
    title, description, category, status, priority,
    project_id, client_id, role_visibility, due_date, created_by
  ) VALUES (
    format('Kickoff do projeto - %s', COALESCE(v_proposal.title, 'Projeto')),
    'Projeto criado a partir de contrato ativado. Complete o onboarding e inicie a execução.',
    'desenvolvimento', 'pendente', 'alta',
    v_project_id, v_contract.client_id,
    ARRAY['admin_super', 'admin', 'developer', 'designer', 'po'],
    v_today + 5,
    v_actor
  );

  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'contract_id', p_contract_id,
    'client_id', v_contract.client_id
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION public.activate_contract_to_project(uuid) TO authenticated;

COMMENT ON FUNCTION public.activate_contract_to_project(uuid) IS
  'Chamada quando contrato é ativado. Cria projeto + parcelas + cobranças + subscription + onboarding. Notifica financeiro e dev/PO. Cria tarefas automáticas.';

-- Permitir project_id NULL no contrato (preenchido na ativação)
ALTER TABLE public.project_contracts ALTER COLUMN project_id DROP NOT NULL;
