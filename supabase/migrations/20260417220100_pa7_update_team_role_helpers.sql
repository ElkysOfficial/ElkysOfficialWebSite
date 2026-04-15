-- PA7 — atualiza has_any_team_role para incluir as novas roles
-- adicionadas em 20260417220000. Migration separada porque
-- ALTER TYPE ADD VALUE so se torna visivel em transacoes
-- posteriores.
--
-- is_admin() continua inalterado: apenas admin_super/admin sao
-- "admin de sistema". Roles novas sao membros da equipe (team)
-- com escopo limitado ao seu dominio.

CREATE OR REPLACE FUNCTION public.has_any_team_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'admin_super',
        'admin',
        'marketing',
        'developer',
        'support',
        'financeiro',
        'comercial',
        'juridico',
        'designer',
        'po'
      )
  )
$$;

COMMENT ON FUNCTION public.has_any_team_role(UUID) IS
  'PA7: retorna TRUE se o usuario tem qualquer role de equipe (team member). Inclui roles legadas (admin_super, admin, marketing, developer, support) e as novas do briefing (financeiro, comercial, juridico, designer, po). NAO inclui cliente.';
