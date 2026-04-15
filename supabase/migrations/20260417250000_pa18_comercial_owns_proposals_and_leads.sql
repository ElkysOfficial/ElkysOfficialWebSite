-- PA18 (PROBLEMA 24) — Comercial como owner de propostas e leads.
--
-- Ate agora, INSERT/UPDATE em leads e proposals so era permitido
-- via policies "Admins manage *". Com a expansao de roles (PA7),
-- a role 'comercial' precisa ter ownership completo sobre o funil
-- comercial sem depender de admin.
--
-- Usa has_comercial_access() criada em PA10 (retorna TRUE para
-- admin + comercial).

BEGIN;

-- ========== LEADS ==========
DROP POLICY IF EXISTS "Comercial manages leads" ON public.leads;
CREATE POLICY "Comercial manages leads" ON public.leads
  FOR ALL TO authenticated
  USING (public.has_comercial_access(auth.uid()))
  WITH CHECK (public.has_comercial_access(auth.uid()));

-- ========== PROPOSALS ==========
DROP POLICY IF EXISTS "Comercial manages proposals" ON public.proposals;
CREATE POLICY "Comercial manages proposals" ON public.proposals
  FOR ALL TO authenticated
  USING (public.has_comercial_access(auth.uid()))
  WITH CHECK (public.has_comercial_access(auth.uid()));

-- Leitura do cliente dono da proposta permanece inalterada
-- (ja coberta por "Clients read own proposals" em migrations anteriores).

COMMENT ON POLICY "Comercial manages leads" ON public.leads IS
  'PA18: role comercial tem ownership completo (CRUD) sobre leads, alem de admin. Cliente nao ve leads.';

COMMENT ON POLICY "Comercial manages proposals" ON public.proposals IS
  'PA18: role comercial tem ownership completo (CRUD) sobre proposals, alem de admin. Cliente le apenas as proprias via policy separada.';

COMMIT;
