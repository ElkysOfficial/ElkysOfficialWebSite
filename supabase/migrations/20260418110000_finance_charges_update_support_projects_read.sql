-- F6: Financeiro pode atualizar status de cobranças (marcar pago, etc.)
-- F5: Suporte pode ler projetos vinculados aos tickets que atende
--
-- Antes: charges UPDATE era exclusivo de is_admin.
-- Agora: has_finance_access (admin + financeiro) também pode UPDATE.
--
-- Antes: projects SELECT não incluía support.
-- Agora: support pode ler projetos para ter contexto dos tickets.

-- ─── F6: Financeiro edita charges ───────────────────────────────────

-- Adiciona política de UPDATE para financeiro em charges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Finance can update charges'
      AND tablename = 'charges'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Finance can update charges"
        ON public.charges
        FOR UPDATE
        TO authenticated
        USING (public.has_finance_access(auth.uid()))
        WITH CHECK (public.has_finance_access(auth.uid()))
    $pol$;
  END IF;
END
$$;

-- ─── F5: Suporte lê projetos ───────────────────────────────────────

-- Adiciona política de SELECT para support em projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Support can read projects'
      AND tablename = 'projects'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Support can read projects"
        ON public.projects
        FOR SELECT
        TO authenticated
        USING (public.has_role(auth.uid(), 'support'))
    $pol$;
  END IF;
END
$$;

-- Suporte também precisa ler clients para ver nome do cliente no ticket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Support can read clients'
      AND tablename = 'clients'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Support can read clients"
        ON public.clients
        FOR SELECT
        TO authenticated
        USING (public.has_role(auth.uid(), 'support'))
    $pol$;
  END IF;
END
$$;

-- PO precisa ler propostas para validar viabilidade técnica (F9)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'PO can read proposals'
      AND tablename = 'proposals'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "PO can read proposals"
        ON public.proposals
        FOR SELECT
        TO authenticated
        USING (public.has_role(auth.uid(), 'po'))
    $pol$;
  END IF;
END
$$;
