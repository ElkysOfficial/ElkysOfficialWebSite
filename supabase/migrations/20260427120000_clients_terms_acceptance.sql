-- Feature: Aceite de Termos no primeiro acesso ao portal do cliente
--
-- Adiciona colunas em public.clients para registrar o aceite (com
-- versionamento) dos documentos legais (Termos de Uso e Politica de
-- Privacidade + Cookies).
--
-- Versionamento permite forcar o re-aceite quando publicarmos uma nova
-- versao das politicas (por exigencia LGPD). O front compara a versao
-- corrente (LEGAL_VERSION) com a registrada no perfil; se diferentes,
-- o guard redireciona para a tela de aceite.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT;

COMMENT ON COLUMN public.clients.terms_accepted_at IS
  'Timestamp do aceite dos Termos de Uso pelo cliente no portal.';
COMMENT ON COLUMN public.clients.terms_version IS
  'Versao dos Termos de Uso aceitos. Se diferente da versao corrente do front, o guard reapresenta a tela de aceite.';
COMMENT ON COLUMN public.clients.privacy_accepted_at IS
  'Timestamp do aceite combinado da Politica de Privacidade e Politica de Cookies pelo cliente no portal.';
COMMENT ON COLUMN public.clients.privacy_version IS
  'Versao das politicas de privacidade/cookies aceitas. Mesma logica do terms_version.';
