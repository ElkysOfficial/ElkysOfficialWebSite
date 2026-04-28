-- Audit imutavel de aceite de documentos legais
--
-- A coluna terms_version em public.clients e a fonte de verdade rapida
-- consultada pelo TermsAcceptanceGuard a cada login (estado corrente).
-- Esta tabela registra cada evento de aceite com metadados de auditoria
-- (timestamp, user-agent, IP da requisicao), permitindo provar quando,
-- por quem e a partir de qual contexto cada versao foi aceita.
--
-- Rationale (LGPD/auditoria): a obrigacao de demonstrar consentimento
-- exige rastreabilidade. Um simples flag em clients responde "esta
-- aceito?" mas nao responde "quando, em qual versao, em qual contexto?".

CREATE TABLE IF NOT EXISTS public.legal_acceptance_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  document_type    TEXT NOT NULL CHECK (document_type IN ('terms', 'privacy_cookies')),
  document_version TEXT NOT NULL,
  accepted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent       TEXT,
  ip_address       INET
);

CREATE INDEX IF NOT EXISTS legal_acceptance_log_user_id_idx
  ON public.legal_acceptance_log(user_id);
CREATE INDEX IF NOT EXISTS legal_acceptance_log_accepted_at_idx
  ON public.legal_acceptance_log(accepted_at DESC);

ALTER TABLE public.legal_acceptance_log ENABLE ROW LEVEL SECURITY;

-- Policy: o proprio cliente pode ler suas linhas; a tabela e imutavel
-- por design (sem policy de UPDATE/DELETE para nao-admins).
DROP POLICY IF EXISTS "legal_log_self_select" ON public.legal_acceptance_log;
CREATE POLICY "legal_log_self_select" ON public.legal_acceptance_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.legal_acceptance_log IS
  'Trilha imutavel de aceites de documentos legais (Termos, Privacidade, Cookies) com metadados para auditoria LGPD.';

-- Substituicao da RPC: agora aceita user_agent do cliente e registra o
-- evento na tabela de audit. Mantemos as colunas em clients atualizadas
-- para o guard responder rapido sem JOIN.
DROP FUNCTION IF EXISTS public.client_accept_terms(TEXT);

CREATE OR REPLACE FUNCTION public.client_accept_terms(
  p_version    TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_now       TIMESTAMPTZ := now();
  v_client_id UUID;
  v_ip        INET;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado' USING ERRCODE = '28000';
  END IF;

  -- inet_client_addr() retorna o IP da conexao Postgres. Em ambientes
  -- atras de proxies (ex.: Supabase Edge), o IP pode ser do proxy. O
  -- audit ainda assim e util como sinal complementar.
  BEGIN
    v_ip := inet_client_addr();
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;

  UPDATE public.clients
     SET terms_accepted_at   = v_now,
         terms_version       = p_version,
         privacy_accepted_at = v_now,
         privacy_version     = p_version,
         updated_at          = v_now
   WHERE user_id = v_uid
   RETURNING id INTO v_client_id;

  IF v_client_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.legal_acceptance_log
    (user_id, client_id, document_type, document_version, accepted_at, user_agent, ip_address)
  VALUES
    (v_uid, v_client_id, 'terms',           p_version, v_now, p_user_agent, v_ip),
    (v_uid, v_client_id, 'privacy_cookies', p_version, v_now, p_user_agent, v_ip);

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.client_accept_terms(TEXT, TEXT) IS
  'Registra o aceite de Termos de Uso e Privacidade/Cookies, atualizando o estado em clients e gravando 2 linhas em legal_acceptance_log para auditoria.';

REVOKE ALL ON FUNCTION public.client_accept_terms(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.client_accept_terms(TEXT, TEXT) TO authenticated;
