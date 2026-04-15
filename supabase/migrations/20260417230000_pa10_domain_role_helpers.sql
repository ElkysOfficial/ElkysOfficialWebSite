-- PA10 (PROBLEMA 22) — helpers de acesso por dominio.
--
-- Cria funcoes STABLE SECURITY DEFINER que encapsulam o conceito de
-- "pertence ao dominio X". Elas sao usadas pelas RLS policies
-- especificas por tabela para segregar visibilidade sem duplicar
-- logica em cada policy.
--
-- Regra geral:
--   admin_super e admin: acesso total (bypass via is_admin).
--   roles de dominio: acesso apenas ao que e relevante para a funcao.

CREATE OR REPLACE FUNCTION public.has_finance_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles
         WHERE user_id = _user_id AND role = 'financeiro'
      );
$$;

CREATE OR REPLACE FUNCTION public.has_comercial_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles
         WHERE user_id = _user_id AND role = 'comercial'
      );
$$;

CREATE OR REPLACE FUNCTION public.has_juridico_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles
         WHERE user_id = _user_id AND role = 'juridico'
      );
$$;

CREATE OR REPLACE FUNCTION public.has_dev_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles
         WHERE user_id = _user_id
           AND role IN ('developer', 'designer', 'po')
      );
$$;

COMMENT ON FUNCTION public.has_finance_access(UUID) IS
  'PA10: TRUE se o usuario e admin ou tem role financeiro. Usado em policies de clients/charges/expenses/project_installments para segregar dados financeiros.';

COMMENT ON FUNCTION public.has_comercial_access(UUID) IS
  'PA10: TRUE se o usuario e admin ou tem role comercial. Usado em policies de leads/proposals/pipeline para segregar dados de negociacao.';

COMMENT ON FUNCTION public.has_juridico_access(UUID) IS
  'PA10: TRUE se o usuario e admin ou tem role juridico. Usado em policies de project_contracts/documents tipo contrato para segregar dados juridicos.';

COMMENT ON FUNCTION public.has_dev_access(UUID) IS
  'PA10: TRUE se o usuario e admin ou tem role developer/designer/po. Usado em policies de projects/project_tasks para segregar execucao.';
