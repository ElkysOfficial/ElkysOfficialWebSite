-- Etapa 4 / Step 1 da auditoria arquitetural (P-001 — atomicidade).
--
-- Antes desta migration, ProjectCreate.tsx fazia 7+ inserts sequenciais
-- client-side (projects, project_contracts, 2x project_installments,
-- 2x charges, opcional project_subscriptions + N charges recorrentes,
-- opcional project_next_steps, N timeline_events) sem transacao Postgres
-- e com rollback manual via try/catch que tentava DELETE FROM projects
-- confiando em CASCADE. Qualquer queda de rede no meio deixava dados
-- parciais — projeto sem contrato, contrato sem parcelas, parcelas sem
-- charges. Ver auditoria P-001.
--
-- Esta migration cria a funcao create_project_with_billing(jsonb) que
-- executa toda a criacao em uma unica transacao plpgsql (funcoes plpgsql
-- sao atomicas por padrao — qualquer EXCEPTION rollback tudo).
--
-- Contrato de entrada (JSONB):
-- {
--   "client_id": "uuid",
--   "project": {
--     "name", "description", "status", "current_stage", "billing_type",
--     "started_at", "solution_type", "expected_delivery_date",
--     "client_visible_summary", "tags": [...], "delivered_at"
--   },
--   "contract": {
--     "total_amount", "signed_at", "starts_at", "ends_at",
--     "scope_summary", "status"
--   },
--   "installments": {
--     "entry":    { "percentage", "amount", "expected_due_date", "status", "paid_at", "is_blocking" },
--     "delivery": { "percentage", "amount", "expected_due_date", "status", "paid_at", "is_blocking" }
--   },
--   "charges": [ entry_charge, delivery_charge ],
--     // cada um: { "description","amount","due_date","status","paid_at","is_blocking","is_historical" }
--   "subscription": null | {
--     "label","amount","due_day","starts_on","ends_on","status","is_blocking",
--     "recurring_charges": [ { "due_date", "status" }, ... ]
--   },
--   "next_step": null | { "title","description","owner","client_visible","sort_order" },
--   "timeline_events": [
--     // cada evento usa source_kind ('project'|'contract'|'subscription'|'next_step')
--     // a funcao preenche source_id/source_table com o ID gerado
--     { "event_type","title","summary","visibility","source_kind","metadata" }
--   ]
-- }
--
-- Retorna: UUID do projeto criado.
-- Em caso de erro: a transacao inteira e revertida e EXCEPTION e propagada
-- para o supabase-js como erro de RPC.

CREATE OR REPLACE FUNCTION public.create_project_with_billing(p_input jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_client_id uuid;
  v_project_id uuid;
  v_contract_id uuid;
  v_entry_installment_id uuid;
  v_delivery_installment_id uuid;
  v_subscription_id uuid;
  v_next_step_id uuid;
  v_project jsonb;
  v_contract jsonb;
  v_installments jsonb;
  v_charges jsonb;
  v_subscription jsonb;
  v_next_step jsonb;
  v_timeline jsonb;
  v_event jsonb;
  v_source_table text;
  v_source_id uuid;
BEGIN
  -- Apenas admins podem criar projetos com cobrança.
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  v_client_id := NULLIF(p_input->>'client_id', '')::uuid;
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'client_id obrigatorio';
  END IF;

  v_project       := p_input->'project';
  v_contract      := p_input->'contract';
  v_installments  := p_input->'installments';
  v_charges       := p_input->'charges';
  v_subscription  := p_input->'subscription';
  v_next_step     := p_input->'next_step';
  v_timeline      := p_input->'timeline_events';

  IF v_project IS NULL OR v_contract IS NULL
     OR v_installments IS NULL OR v_charges IS NULL THEN
    RAISE EXCEPTION 'project, contract, installments e charges sao obrigatorios';
  END IF;

  -- 1. Project
  INSERT INTO public.projects (
    client_id, name, description, status, current_stage, billing_type,
    started_at, solution_type, expected_delivery_date, client_visible_summary,
    tags, delivered_at
  ) VALUES (
    v_client_id,
    v_project->>'name',
    NULLIF(v_project->>'description', ''),
    (v_project->>'status')::project_status,
    NULLIF(v_project->>'current_stage', ''),
    (v_project->>'billing_type')::billing_type,
    NULLIF(v_project->>'started_at', '')::date,
    NULLIF(v_project->>'solution_type', ''),
    NULLIF(v_project->>'expected_delivery_date', '')::date,
    NULLIF(v_project->>'client_visible_summary', ''),
    CASE WHEN v_project ? 'tags' AND jsonb_typeof(v_project->'tags') = 'array'
         THEN ARRAY(SELECT jsonb_array_elements_text(v_project->'tags'))
         ELSE NULL
    END,
    NULLIF(v_project->>'delivered_at', '')::date
  ) RETURNING id INTO v_project_id;

  -- 2. Contract
  INSERT INTO public.project_contracts (
    client_id, project_id, total_amount, signed_at, starts_at, ends_at,
    scope_summary, status
  ) VALUES (
    v_client_id,
    v_project_id,
    (v_contract->>'total_amount')::numeric,
    NULLIF(v_contract->>'signed_at', '')::date,
    NULLIF(v_contract->>'starts_at', '')::date,
    NULLIF(v_contract->>'ends_at', '')::date,
    NULLIF(v_contract->>'scope_summary', ''),
    COALESCE(NULLIF(v_contract->>'status', '')::contract_record_status, 'rascunho')
  ) RETURNING id INTO v_contract_id;

  -- 3. Installments (entrada + entrega)
  INSERT INTO public.project_installments (
    client_id, contract_id, project_id, installment_type, percentage, amount,
    trigger_type, expected_due_date, effective_due_date, status, paid_at, is_blocking
  ) VALUES (
    v_client_id, v_contract_id, v_project_id,
    'entrada',
    (v_installments->'entry'->>'percentage')::numeric,
    (v_installments->'entry'->>'amount')::numeric,
    'assinatura',
    NULLIF(v_installments->'entry'->>'expected_due_date', '')::date,
    NULLIF(v_installments->'entry'->>'expected_due_date', '')::date,
    (v_installments->'entry'->>'status')::project_installment_status,
    NULLIF(v_installments->'entry'->>'paid_at', '')::date,
    COALESCE((v_installments->'entry'->>'is_blocking')::boolean, true)
  ) RETURNING id INTO v_entry_installment_id;

  INSERT INTO public.project_installments (
    client_id, contract_id, project_id, installment_type, percentage, amount,
    trigger_type, expected_due_date, effective_due_date, status, paid_at, is_blocking
  ) VALUES (
    v_client_id, v_contract_id, v_project_id,
    'entrega',
    (v_installments->'delivery'->>'percentage')::numeric,
    (v_installments->'delivery'->>'amount')::numeric,
    'conclusao',
    NULLIF(v_installments->'delivery'->>'expected_due_date', '')::date,
    NULLIF(v_installments->'delivery'->>'expected_due_date', '')::date,
    (v_installments->'delivery'->>'status')::project_installment_status,
    NULLIF(v_installments->'delivery'->>'paid_at', '')::date,
    COALESCE((v_installments->'delivery'->>'is_blocking')::boolean, true)
  ) RETURNING id INTO v_delivery_installment_id;

  -- 4. Charges das parcelas (entry/delivery na mesma ordem do array)
  INSERT INTO public.charges (
    client_id, project_id, contract_id, installment_id, origin_type,
    description, amount, due_date, status, paid_at, is_blocking, is_historical
  )
  SELECT
    v_client_id,
    v_project_id,
    v_contract_id,
    CASE WHEN ord = 1 THEN v_entry_installment_id ELSE v_delivery_installment_id END,
    'parcela_projeto',
    ch->>'description',
    (ch->>'amount')::numeric,
    NULLIF(ch->>'due_date', '')::date,
    (ch->>'status')::invoice_status,
    NULLIF(ch->>'paid_at', '')::date,
    COALESCE((ch->>'is_blocking')::boolean, true),
    COALESCE((ch->>'is_historical')::boolean, false)
  FROM jsonb_array_elements(v_charges) WITH ORDINALITY AS t(ch, ord);

  -- 5. Subscription opcional + charges recorrentes
  IF v_subscription IS NOT NULL AND jsonb_typeof(v_subscription) = 'object' THEN
    INSERT INTO public.project_subscriptions (
      client_id, project_id, label, amount, due_day, starts_on, ends_on,
      status, is_blocking
    ) VALUES (
      v_client_id, v_project_id,
      v_subscription->>'label',
      (v_subscription->>'amount')::numeric,
      (v_subscription->>'due_day')::int,
      NULLIF(v_subscription->>'starts_on', '')::date,
      NULLIF(v_subscription->>'ends_on', '')::date,
      COALESCE(NULLIF(v_subscription->>'status', '')::subscription_status, 'ativa'),
      COALESCE((v_subscription->>'is_blocking')::boolean, true)
    ) RETURNING id INTO v_subscription_id;

    IF v_subscription ? 'recurring_charges'
       AND jsonb_typeof(v_subscription->'recurring_charges') = 'array' THEN
      INSERT INTO public.charges (
        client_id, project_id, subscription_id, origin_type, description,
        amount, due_date, status, is_blocking
      )
      SELECT
        v_client_id, v_project_id, v_subscription_id, 'mensalidade',
        v_subscription->>'label',
        (v_subscription->>'amount')::numeric,
        (rc->>'due_date')::date,
        (rc->>'status')::invoice_status,
        COALESCE((v_subscription->>'is_blocking')::boolean, true)
      FROM jsonb_array_elements(v_subscription->'recurring_charges') AS rc;
    END IF;
  END IF;

  -- 6. Next step opcional
  IF v_next_step IS NOT NULL AND jsonb_typeof(v_next_step) = 'object' THEN
    INSERT INTO public.project_next_steps (
      client_id, project_id, title, description, owner, client_visible, sort_order
    ) VALUES (
      v_client_id, v_project_id,
      v_next_step->>'title',
      NULLIF(v_next_step->>'description', ''),
      (v_next_step->>'owner')::next_step_owner,
      COALESCE((v_next_step->>'client_visible')::boolean, true),
      COALESCE((v_next_step->>'sort_order')::int, 0)
    ) RETURNING id INTO v_next_step_id;
  END IF;

  -- 7. Timeline events. Cliente envia source_kind, funcao traduz para
  -- source_table + source_id usando os UUIDs gerados nesta transacao.
  -- Eventos com source_kind='subscription'/'next_step' so sao inseridos
  -- se as entidades correspondentes foram efetivamente criadas.
  IF v_timeline IS NOT NULL AND jsonb_typeof(v_timeline) = 'array' THEN
    FOR v_event IN SELECT * FROM jsonb_array_elements(v_timeline)
    LOOP
      v_source_table := NULL;
      v_source_id := NULL;
      CASE v_event->>'source_kind'
        WHEN 'project' THEN
          v_source_table := 'projects';
          v_source_id := v_project_id;
        WHEN 'contract' THEN
          v_source_table := 'project_contracts';
          v_source_id := v_contract_id;
        WHEN 'subscription' THEN
          IF v_subscription_id IS NULL THEN CONTINUE; END IF;
          v_source_table := 'project_subscriptions';
          v_source_id := v_subscription_id;
        WHEN 'next_step' THEN
          IF v_next_step_id IS NULL THEN CONTINUE; END IF;
          v_source_table := 'project_next_steps';
          v_source_id := v_next_step_id;
        ELSE
          v_source_table := 'projects';
          v_source_id := v_project_id;
      END CASE;

      INSERT INTO public.timeline_events (
        client_id, project_id, event_type, title, summary, visibility,
        source_table, source_id, metadata
      ) VALUES (
        v_client_id,
        v_project_id,
        v_event->>'event_type',
        v_event->>'title',
        v_event->>'summary',
        COALESCE(NULLIF(v_event->>'visibility', ''), 'ambos'),
        v_source_table,
        v_source_id,
        COALESCE(v_event->'metadata', '{}'::jsonb)
      );
    END LOOP;
  END IF;

  RETURN v_project_id;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.create_project_with_billing(jsonb) TO authenticated;

COMMENT ON FUNCTION public.create_project_with_billing(jsonb) IS
  'Cria projeto + contrato + parcelas + charges + opcional subscription/next_step/timeline atomicamente. Substitui o fluxo client-side de ProjectCreate.tsx que nao tinha garantia de transacao. Ver auditoria P-001.';
