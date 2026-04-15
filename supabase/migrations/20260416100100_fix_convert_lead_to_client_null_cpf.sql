-- PROBLEMA 1 — convert_lead_to_client deve inserir NULL em cpf/cnpj
-- quando o override nao trouxer valor. Antes inseria '' o que violava
-- UNIQUE constraint de clients.cpf a partir da segunda conversao.

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
  v_cpf text;
  v_cnpj text;
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

  v_full_name  := COALESCE(NULLIF(p_overrides->>'full_name', ''), v_lead.name);
  v_email      := COALESCE(NULLIF(p_overrides->>'email', ''), v_lead.email, '');
  v_phone      := COALESCE(NULLIF(p_overrides->>'phone', ''), v_lead.phone);
  v_company    := COALESCE(NULLIF(p_overrides->>'company', ''), v_lead.company);
  v_client_type := COALESCE(NULLIF(p_overrides->>'client_type', ''),
                            CASE WHEN v_company IS NOT NULL THEN 'pj' ELSE 'pf' END);

  -- CPF e CNPJ: NULL quando ausente (NUNCA string vazia, para nao
  -- violar UNIQUE constraint a partir da segunda conversao).
  v_cpf  := NULLIF(p_overrides->>'cpf', '');
  v_cnpj := NULLIF(p_overrides->>'cnpj', '');

  v_origin := CASE
    WHEN v_lead.source = 'indicacao' THEN 'indicacao'::client_origin
    WHEN v_lead.source = 'inbound'   THEN 'inbound'::client_origin
    ELSE 'lead'::client_origin
  END;

  INSERT INTO public.clients (
    full_name, email, cpf, cnpj, phone, client_type, nome_fantasia, client_origin
  ) VALUES (
    v_full_name,
    v_email,
    v_cpf,
    v_cnpj,
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
  'Converte lead em cliente atomicamente. Idempotente. CPF/CNPJ inseridos como NULL quando ausentes do override (NUNCA string vazia).';
