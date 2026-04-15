-- PA10 — aperta RLS em tabelas financeiras/comerciais para respeitar
-- a segregacao por dominio.
--
-- ANTES: "Team members read X" usava has_any_team_role — qualquer
-- membro da equipe (support, developer, marketing, etc.) via tudo.
-- DEPOIS: apenas admin + roles do dominio relevante.
--
-- Tabelas afetadas:
--   clients  → admin + financeiro + comercial (leitura)
--   expenses → admin + financeiro
--   charges  → admin + financeiro
--
-- Escrita continua restrita a admin_super/admin via is_admin().
-- Politicas "Clients read own" e equivalentes nao sao tocadas.

BEGIN;

-- ========== CLIENTS ==========
DROP POLICY IF EXISTS "Team members read clients" ON public.clients;
CREATE POLICY "Domain members read clients" ON public.clients
  FOR SELECT TO authenticated
  USING (
    public.has_finance_access(auth.uid())
    OR public.has_comercial_access(auth.uid())
  );

-- ========== EXPENSES ==========
-- Expenses e dominio exclusivamente financeiro.
DROP POLICY IF EXISTS "Team members read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Team read expenses" ON public.expenses;
CREATE POLICY "Finance read expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (public.has_finance_access(auth.uid()));

-- ========== CHARGES ==========
-- Cobranca e dominio exclusivamente financeiro.
DROP POLICY IF EXISTS "Team members read charges" ON public.charges;
DROP POLICY IF EXISTS "Admins read charges" ON public.charges;
DROP POLICY IF EXISTS "Team read charges" ON public.charges;
CREATE POLICY "Finance read charges" ON public.charges
  FOR SELECT TO authenticated
  USING (
    public.has_finance_access(auth.uid())
    OR client_id = public.get_client_id_for_user(auth.uid())
  );

COMMIT;
