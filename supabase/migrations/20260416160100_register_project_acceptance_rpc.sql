-- PROBLEMA 7 — RPC atomica para registrar aceite formal de entrega.

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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
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

  INSERT INTO public.timeline_events (
    client_id, project_id, event_type, title, summary, visibility,
    source_table, source_id, actor_user_id, metadata
  ) VALUES (
    v_project.client_id, p_project_id,
    'project_accepted',
    'Aceite formal registrado',
    CASE
      WHEN p_notes IS NOT NULL AND length(trim(p_notes)) > 0
        THEN format('Cliente aceitou a entrega. Observacoes: %s', trim(p_notes))
      ELSE 'Cliente aceitou a entrega formalmente.'
    END,
    'ambos', 'projects', p_project_id, auth.uid(),
    jsonb_build_object('charges_unlocked', v_charges_unlocked)
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

GRANT EXECUTE ON FUNCTION public.register_project_acceptance(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.register_project_acceptance(uuid, text) IS
  'Registra aceite formal de entrega de projeto. Atomico: marca accepted_at/by/notes, avanca status para concluido, libera parcela de entrega para cobranca (agendada → pendente), registra timeline event. Idempotente: nao reescreve se ja aceito.';
