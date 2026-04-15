-- PROBLEMA 15 — RPC atomica para abrir ticket vinculado a projeto
-- com calculo automatico de garantia.

CREATE OR REPLACE FUNCTION public.open_project_support_ticket(
  p_project_id uuid,
  p_subject text,
  p_body text,
  p_category text DEFAULT 'outro',
  p_priority text DEFAULT 'media'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_project RECORD;
  v_in_warranty boolean := false;
  v_warranty_until timestamptz;
  v_now timestamptz := now();
  v_ticket_id uuid;
BEGIN
  -- Permite admin OU team OU cliente do projeto.
  IF NOT (
    public.is_admin(auth.uid())
    OR public.has_any_team_role(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.projects p
       JOIN public.clients c ON c.id = p.client_id
       WHERE p.id = p_project_id AND c.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'forbidden: requer admin, team ou cliente dono do projeto';
  END IF;

  IF p_subject IS NULL OR length(trim(p_subject)) < 3 THEN
    RAISE EXCEPTION 'subject obrigatorio (>= 3 caracteres)';
  END IF;
  IF p_body IS NULL OR length(trim(p_body)) < 3 THEN
    RAISE EXCEPTION 'body obrigatorio (>= 3 caracteres)';
  END IF;
  IF p_category NOT IN ('bug','duvida','acesso','financeiro','conteudo','outro') THEN
    RAISE EXCEPTION 'category invalida';
  END IF;
  IF p_priority NOT IN ('baixa','media','alta') THEN
    RAISE EXCEPTION 'priority invalida';
  END IF;

  SELECT * INTO v_project FROM public.projects WHERE id = p_project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'projeto nao encontrado';
  END IF;

  -- Calculo de garantia: precisa estar aceito E dentro da janela.
  IF v_project.accepted_at IS NOT NULL THEN
    v_warranty_until := v_project.accepted_at
      + (COALESCE(v_project.warranty_period_days, 90) || ' days')::interval;
    v_in_warranty := v_now <= v_warranty_until;
  END IF;

  INSERT INTO public.support_tickets (
    client_id, project_id, subject, body, status, priority, category, in_warranty
  ) VALUES (
    v_project.client_id,
    p_project_id,
    trim(p_subject),
    trim(p_body),
    'aberto',
    p_priority,
    p_category,
    v_in_warranty
  ) RETURNING id INTO v_ticket_id;

  -- Timeline event diferenciando garantia.
  INSERT INTO public.timeline_events (
    client_id, project_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_project.client_id, p_project_id,
    CASE WHEN v_in_warranty THEN 'support_ticket_warranty' ELSE 'support_ticket_opened' END,
    CASE WHEN v_in_warranty THEN 'Chamado aberto (garantia)' ELSE 'Chamado aberto' END,
    format('%s — %s', trim(p_subject), p_category),
    'ambos', 'support_tickets', v_ticket_id, auth.uid(),
    jsonb_build_object(
      'in_warranty', v_in_warranty,
      'warranty_until', v_warranty_until,
      'category', p_category,
      'priority', p_priority
    )
  );

  RETURN jsonb_build_object(
    'ticket_id', v_ticket_id,
    'in_warranty', v_in_warranty,
    'warranty_until', v_warranty_until,
    'project_id', p_project_id,
    'client_id', v_project.client_id
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION public.open_project_support_ticket(uuid, text, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.open_project_support_ticket(uuid, text, text, text, text) IS
  'Abre um support_ticket vinculado a projeto com calculo automatico de garantia baseado em projects.accepted_at + warranty_period_days. Atomico: insere ticket + timeline event. Permitido para admin, team ou cliente dono do projeto.';
