-- FIX: RPCs de validação exigiam is_admin() mas PO/Dev/Designer precisam usar.
-- Troca is_admin() por (is_admin() OR has_dev_access()) nas 4 RPCs de validação.

-- 1) start_validation_round
CREATE OR REPLACE FUNCTION public.start_validation_round(
  p_project_id uuid,
  p_scope_summary text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_project RECORD;
  v_next_round_no integer;
  v_round_id uuid;
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.has_dev_access(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden: admin or dev role required';
  END IF;

  SELECT * INTO v_project FROM public.projects WHERE id = p_project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'projeto nao encontrado'; END IF;
  IF v_project.status = 'cancelado' THEN RAISE EXCEPTION 'projeto cancelado'; END IF;
  IF v_project.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'projeto ja aceito'; END IF;
  IF EXISTS (SELECT 1 FROM public.project_validation_rounds WHERE project_id = p_project_id AND status = 'em_andamento') THEN
    RAISE EXCEPTION 'ja tem rodada em andamento';
  END IF;

  SELECT COALESCE(MAX(round_no), 0) + 1 INTO v_next_round_no
    FROM public.project_validation_rounds WHERE project_id = p_project_id;

  INSERT INTO public.project_validation_rounds (
    project_id, client_id, round_no, scope_summary, status, created_by
  ) VALUES (
    p_project_id, v_project.client_id, v_next_round_no,
    NULLIF(trim(COALESCE(p_scope_summary, '')), ''), 'em_andamento', auth.uid()
  ) RETURNING id INTO v_round_id;

  UPDATE public.projects
     SET current_stage = CASE WHEN current_stage IN ('Validacao & ativacao','Evolucao') THEN current_stage ELSE 'Validacao & ativacao' END,
         updated_at = now()
   WHERE id = p_project_id;

  INSERT INTO public.timeline_events (
    client_id, project_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_project.client_id, p_project_id, 'validation_round_started',
    format('Rodada de validacao #%s iniciada', v_next_round_no),
    COALESCE(NULLIF(trim(p_scope_summary), ''), 'Validacao em andamento.'),
    'ambos', 'projects', p_project_id, auth.uid(),
    jsonb_build_object('round_id', v_round_id, 'round_no', v_next_round_no)
  );

  RETURN v_round_id;
END;
$func$;

-- 2) close_validation_round
CREATE OR REPLACE FUNCTION public.close_validation_round(
  p_round_id uuid, p_status text, p_feedback text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
DECLARE v_round RECORD; v_now timestamptz := now();
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.has_dev_access(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden: admin or dev role required';
  END IF;
  IF p_status NOT IN ('aprovada','reprovada') THEN RAISE EXCEPTION 'status invalido'; END IF;
  SELECT * INTO v_round FROM public.project_validation_rounds WHERE id = p_round_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'rodada nao encontrada'; END IF;
  IF v_round.status <> 'em_andamento' THEN RAISE EXCEPTION 'rodada ja fechada'; END IF;
  IF p_status = 'aprovada' AND (v_round.internal_validated_at IS NULL OR v_round.client_validated_at IS NULL) THEN
    RAISE EXCEPTION 'aprovacao requer validacao interna E do cliente';
  END IF;

  UPDATE public.project_validation_rounds
     SET status = p_status, feedback = NULLIF(trim(COALESCE(p_feedback,'')), ''),
         closed_at = v_now, updated_at = v_now
   WHERE id = p_round_id;

  INSERT INTO public.timeline_events (
    client_id, project_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_round.client_id, v_round.project_id,
    CASE p_status WHEN 'aprovada' THEN 'validation_round_approved' ELSE 'validation_round_rejected' END,
    format('Rodada #%s %s', v_round.round_no, p_status),
    CASE WHEN p_feedback IS NOT NULL AND length(trim(p_feedback)) > 0
      THEN format('%s. Feedback: %s', p_status, trim(p_feedback))
      ELSE format('Rodada %s.', p_status) END,
    'ambos', 'project_validation_rounds', p_round_id, auth.uid(),
    jsonb_build_object('round_id', p_round_id, 'round_no', v_round.round_no, 'status', p_status)
  );

  RETURN jsonb_build_object('round_id', p_round_id, 'status', p_status);
END;
$func$;

-- 3) mark_validation_internal
CREATE OR REPLACE FUNCTION public.mark_validation_internal(p_round_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.has_dev_access(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.project_validation_rounds
     SET internal_validated_at = COALESCE(internal_validated_at, now()),
         validated_by_internal = COALESCE(validated_by_internal, auth.uid()),
         updated_at = now()
   WHERE id = p_round_id AND status = 'em_andamento';
END;
$func$;

-- 4) mark_validation_client
CREATE OR REPLACE FUNCTION public.mark_validation_client(p_round_id uuid, p_client_name text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.has_dev_access(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.project_validation_rounds
     SET client_validated_at = COALESCE(client_validated_at, now()),
         validated_by_client = COALESCE(validated_by_client, NULLIF(trim(COALESCE(p_client_name,'')), '')),
         updated_at = now()
   WHERE id = p_round_id AND status = 'em_andamento';
END;
$func$;
