-- FIX: PO/Developer/Designer não conseguem ler projetos
-- A rota frontend permite (PortalRoleGuard) mas a RLS bloqueava.
-- Usa has_dev_access() que cobre admin + developer + designer + po.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Dev team can read projects'
      AND tablename = 'projects'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Dev team can read projects"
        ON public.projects
        FOR SELECT
        TO authenticated
        USING (public.has_dev_access(auth.uid()))
    $pol$;
  END IF;
END
$$;

-- Dev team também precisa ler charges para ver tab Financeiro do projeto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Dev team can read charges'
      AND tablename = 'charges'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Dev team can read charges"
        ON public.charges
        FOR SELECT
        TO authenticated
        USING (public.has_dev_access(auth.uid()))
    $pol$;
  END IF;
END
$$;

-- Dev team precisa ler contratos para ver ContractVersionHistory no projeto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Dev team can read contracts'
      AND tablename = 'project_contracts'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Dev team can read contracts"
        ON public.project_contracts
        FOR SELECT
        TO authenticated
        USING (public.has_dev_access(auth.uid()))
    $pol$;
  END IF;
END
$$;

-- Dev team precisa ler clients para ver nome do cliente no projeto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Dev team can read clients'
      AND tablename = 'clients'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Dev team can read clients"
        ON public.clients
        FOR SELECT
        TO authenticated
        USING (public.has_dev_access(auth.uid()))
    $pol$;
  END IF;
END
$$;
