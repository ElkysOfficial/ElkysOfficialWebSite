-- Limpar contas E2E criadas incorretamente via SQL direto
-- GoTrue exige criação via Admin API, não SQL

BEGIN;

-- Limpar team_members
DELETE FROM public.team_members WHERE email LIKE 'e2e-%@elkys.com.br';

-- Limpar user_roles
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e-%@elkys.com.br'
);

-- Limpar profiles
DELETE FROM public.profiles WHERE email LIKE 'e2e-%@elkys.com.br';

-- Limpar auth.users (registros inválidos)
DELETE FROM auth.users WHERE email LIKE 'e2e-%@elkys.com.br';

COMMIT;
