-- RPC: get_client_for_portal_user
--
-- Retorna a linha completa de `clients` vinculada ao auth user, seja via
-- `clients.user_id` direto ou via `client_contacts.auth_user_id`.
--
-- Motivacao: o fluxo atual em src/lib/portal-data.ts:resolveClientForUser
-- faz 2 a 3 queries sequenciais (clients por user_id, client_contacts,
-- clients por id do contato). Em cold start do portal cliente, isso
-- significa 2-3 round-trips Hostinger -> Supabase ANTES do portal renderizar.
--
-- Esta RPC consolida a lookup em 1 round-trip, reutilizando a funcao
-- `get_client_id_for_portal_user` ja existente (mantem consistencia com
-- RLS policies que dependem dela).
--
-- Retorna uma row de `clients` ou NULL se o usuario nao e vinculado a nenhum.
-- SECURITY DEFINER para garantir que funcione independente das policies RLS
-- especificas, mas a visibilidade ja e limitada pelo JOIN transitivo via
-- `get_client_id_for_portal_user` (que so resolve o ID para o proprio user).

CREATE OR REPLACE FUNCTION public.get_client_for_portal_user(_user_id UUID)
RETURNS public.clients
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.*
  FROM public.clients c
  WHERE c.id = public.get_client_id_for_portal_user(_user_id)
  LIMIT 1
$$;

-- Permissoes: apenas usuarios autenticados podem executar (guest nao tem razao).
REVOKE ALL ON FUNCTION public.get_client_for_portal_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_client_for_portal_user(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_client_for_portal_user(UUID) IS
  'Retorna a linha completa de clients vinculada ao auth user (via user_id direto ou client_contacts). Reduz 2-3 round-trips para 1 no cold start do portal cliente.';
