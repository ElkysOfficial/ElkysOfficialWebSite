-- AJUSTES V2 DO FLUXO OPERACIONAL
--
-- 1. Proposals: campo viewed_at para tracking de visualização pelo cliente
-- 2. activate_contract_to_project: idempotência forte contra duplicação
-- 3. Contrato: ativação automática pelo sistema após validação do jurídico
--    (jurídico valida, sistema promove estado)

-- ═══════════════════════════════════════════════════════════════════════
-- AJUSTE 2: proposals.viewed_at — quando cliente visualiza a proposta
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS viewed_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.proposals.viewed_at IS
  'Timestamp de quando o cliente visualizou a proposta pela primeira vez no portal.';

-- ═══════════════════════════════════════════════════════════════════════
-- AJUSTE 4+5: Reescreve activate_contract_to_project com:
--   - Idempotência forte: verifica projeto/charges/subscription existentes
--   - Ativação feita pelo sistema, não ação manual do jurídico
--   - Guard contra duplicação de projeto, charges e subscription
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
  v_existing_project_id uuid;
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
  v_existing_charges_count int;
  v_existing_sub_count int;
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

  -- ── IDEMPOTÊNCIA: se contrato já tem projeto, retorna sem duplicar ──
  IF v_contract.project_id IS NOT NULL THEN
    SELECT id INTO v_existing_project_id FROM public.projects WHERE id = v_contract.project_id;
    IF v_existing_project_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'project_id', v_existing_project_id,
        'contract_id', p_contract_id,
        'client_id', v_contract.client_id,
        'already_exists', true
      );
    END IF;
  END IF;

  -- ── IDEMPOTÊNCIA: verifica se já existe projeto vinculado a este contrato ──
  SELECT p.id INTO v_existing_project_id
    FROM public.projects p
    JOIN public.project_contracts pc ON pc.project_id = p.id
   WHERE pc.id = p_contract_id
   LIMIT 1;

  IF v_existing_project_id IS NOT NULL THEN
    -- Atualiza vínculo se necessário
    UPDATE public.project_contracts SET project_id = v_existing_project_id WHERE id = p_contract_id AND project_id IS NULL;
    RETURN jsonb_build_object(
      'project_id', v_existing_project_id,
      'contract_id', p_contract_id,
      'client_id', v_contract.client_id,
      'already_exists', true
    );
  END IF;

  -- Buscar proposta vinculada
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

  -- ── IDEMPOTÊNCIA CHARGES: só cria se não existem charges para este contrato ──
  SELECT count(*) INTO v_existing_charges_count
    FROM public.charges
   WHERE contract_id = p_contract_id AND NOT is_historical;

  IF v_existing_charges_count = 0 AND v_total > 0
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

  -- ── IDEMPOTÊNCIA SUBSCRIPTION: só cria se não existe para este projeto ──
  SELECT count(*) INTO v_existing_sub_count
    FROM public.project_subscriptions
   WHERE project_id = v_project_id;

  v_subscription := v_billing->'subscription';
  IF v_existing_sub_count = 0
     AND v_subscription IS NOT NULL
     AND jsonb_typeof(v_subscription) = 'object' THEN
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
    -- Idempotência: só cria se não existe
    IF NOT EXISTS (
      SELECT 1 FROM public.documents
       WHERE project_id = v_project_id AND url = v_proposal.technical_document_url
    ) THEN
      INSERT INTO public.documents (
        client_id, project_id, label, url, type, uploaded_by
      ) VALUES (
        v_contract.client_id, v_project_id,
        format('Anexo tecnico - %s', COALESCE(v_proposal.title, 'Projeto')),
        v_proposal.technical_document_url, 'outro', v_actor
      );
    END IF;
  END IF;

  -- 6. Timeline
  INSERT INTO public.timeline_events (
    client_id, project_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_contract.client_id, v_project_id,
    'projeto_criado',
    'Projeto criado — contrato ativado',
    'Contrato ativado. Projeto, cobranças e onboarding criados automaticamente.',
    'ambos', 'project_contracts', p_contract_id, v_actor, '{}'::jsonb
  );

  -- 7. Notificações
  INSERT INTO public.admin_notifications (
    type, title, body, severity, target_roles,
    entity_type, entity_id, action_url, created_by
  ) VALUES
  (
    'cobrancas_geradas',
    format('Cobranças criadas: %s', COALESCE(v_proposal.title, 'Projeto')),
    'Contrato ativado. Cobranças vinculadas criadas automaticamente.',
    'info',
    ARRAY['admin_super', 'admin', 'financeiro']::app_role[],
    'project', v_project_id,
    '/portal/admin/financeiro',
    v_actor
  ),
  (
    'projeto_criado',
    format('Novo projeto: %s', COALESCE(v_proposal.title, 'Projeto')),
    'Contrato ativado. Projeto criado — inicie o onboarding.',
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
  ) VALUES
  (
    format('Verificar cobranças - %s', COALESCE(v_proposal.title, 'Projeto')),
    'Cobranças geradas automaticamente. Verifique valores e datas.',
    'financeiro', 'pendente', 'media',
    v_project_id, v_contract.client_id,
    ARRAY['admin_super', 'admin', 'financeiro'],
    v_today + 1,
    v_actor
  ),
  (
    format('Kickoff do projeto - %s', COALESCE(v_proposal.title, 'Projeto')),
    'Projeto criado. Complete o onboarding e inicie a execução.',
    'desenvolvimento', 'pendente', 'alta',
    v_project_id, v_contract.client_id,
    ARRAY['admin_super', 'admin', 'developer', 'designer', 'po'],
    v_today + 5,
    v_actor
  );

  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'contract_id', p_contract_id,
    'client_id', v_contract.client_id,
    'already_exists', false
  );
END;
$func$;

-- ═══════════════════════════════════════════════════════════════════════
-- AJUSTE 6: register_project_acceptance aceita PO e dev (não só admin)
-- PO/responsável operacional registra entrega, não admin.
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.register_project_acceptance(
  p_project_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_project RECORD;
  v_today date := CURRENT_DATE;
  v_now timestamptz := now();
  v_charges_unlocked integer := 0;
BEGIN
  -- PO, dev, designer e admin podem registrar aceite
  IF NOT (public.is_admin(auth.uid()) OR public.has_dev_access(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden: admin, developer, designer or po role required';
  END IF;

  SELECT * INTO v_project FROM public.projects WHERE id = p_project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'projeto nao encontrado';
  END IF;

  IF v_project.status = 'cancelado' THEN
    RAISE EXCEPTION 'projeto cancelado nao pode ter aceite registrado';
  END IF;

  IF v_project.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'project_id', v_project.id,
      'accepted_at', v_project.accepted_at,
      'accepted_by', v_project.accepted_by,
      'already_accepted', true
    );
  END IF;

  UPDATE public.projects
     SET accepted_at = v_now,
         accepted_by = auth.uid(),
         acceptance_notes = NULLIF(trim(COALESCE(p_notes, '')), ''),
         delivered_at = COALESCE(delivered_at, v_today),
         status = CASE WHEN status IN ('cancelado', 'pausado') THEN status
                       ELSE 'concluido'::project_status END,
         updated_at = v_now
   WHERE id = p_project_id;

  -- Liberar parcela de entrega
  WITH updated_installments AS (
    UPDATE public.project_installments
       SET status = 'pendente',
           updated_at = v_now
     WHERE project_id = p_project_id
       AND installment_type = 'entrega'
       AND status = 'agendada'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_charges_unlocked FROM updated_installments;

  UPDATE public.charges
     SET status = 'pendente',
         updated_at = v_now
   WHERE project_id = p_project_id
     AND origin_type = 'parcela_projeto'
     AND status = 'agendada'
     AND installment_id IN (
       SELECT id FROM public.project_installments
        WHERE project_id = p_project_id
          AND installment_type = 'entrega'
     );

  -- Timeline
  INSERT INTO public.timeline_events (
    client_id, project_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_project.client_id, p_project_id,
    'project_accepted',
    'Aceite formal registrado',
    CASE
      WHEN p_notes IS NOT NULL AND length(trim(p_notes)) > 0
        THEN format('Entrega aceita formalmente. Observacoes: %s', trim(p_notes))
      ELSE 'Entrega aceita formalmente. Janela de suporte iniciada.'
    END,
    'ambos', 'projects', p_project_id, auth.uid(),
    jsonb_build_object('charges_unlocked', v_charges_unlocked)
  );

  -- Ajuste 7: Notificação formal de início do suporte pós-venda
  INSERT INTO public.admin_notifications (
    type, title, body, severity, target_roles,
    entity_type, entity_id, action_url, created_by
  ) VALUES (
    'suporte_iniciado',
    format('Suporte ativo: %s', v_project.name),
    format('O projeto "%s" foi entregue e aceito. Janela de suporte pós-venda iniciada.', v_project.name),
    'info',
    ARRAY['admin_super', 'admin', 'support']::app_role[],
    'project', p_project_id,
    format('/portal/admin/projetos/%s', p_project_id),
    auth.uid()
  );

  RETURN jsonb_build_object(
    'project_id', p_project_id,
    'accepted_at', v_now,
    'accepted_by', auth.uid(),
    'charges_unlocked', v_charges_unlocked,
    'already_accepted', false
  );
END;
$func$;

COMMENT ON FUNCTION public.register_project_acceptance(uuid, text) IS
  'Registra aceite formal de entrega. PO, dev, designer ou admin podem registrar. Marca accepted_at/by/notes, avanca status para concluido, libera parcela de entrega, notifica suporte que janela pos-venda iniciou. Idempotente.';
