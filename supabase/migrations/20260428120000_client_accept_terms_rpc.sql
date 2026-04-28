-- Bugfix: tela de aceite de termos nao persistia o registro
--
-- O front chamava UPDATE em public.clients direto via supabase-js, mas
-- o RLS existente nao tem policy de UPDATE permitindo o cliente alterar
-- a propria linha (a unica policy de UPDATE existente, se houver, nao
-- cobre os campos terms_version/privacy_version). Como o supabase-js
-- nao lanca erro quando o RLS rejeita a UPDATE silenciosamente (apenas
-- retorna 0 linhas afetadas), o front exibia toast de sucesso mas o
-- aceite nao era gravado, e o TermsAcceptanceGuard redirecionava de
-- volta para a tela de aceite numa especie de loop.
--
-- Fix: substituir o UPDATE direto por uma RPC SECURITY DEFINER que
-- valida auth.uid() internamente e atualiza apenas a linha do cliente
-- correspondente. Bypassa RLS apenas para os 4 campos legais,
-- preservando a seguranca das demais colunas.

CREATE OR REPLACE FUNCTION public.client_accept_terms(p_version TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_now TIMESTAMPTZ := now();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado' USING ERRCODE = '28000';
  END IF;

  UPDATE public.clients
     SET terms_accepted_at   = v_now,
         terms_version       = p_version,
         privacy_accepted_at = v_now,
         privacy_version     = p_version,
         updated_at          = v_now
   WHERE user_id = v_uid;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.client_accept_terms(TEXT) IS
  'Registra o aceite dos termos legais (Termos de Uso + Privacidade + Cookies) para o cliente autenticado. Retorna TRUE se uma linha foi atualizada.';

REVOKE ALL ON FUNCTION public.client_accept_terms(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.client_accept_terms(TEXT) TO authenticated;
