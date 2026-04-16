-- Jurídico precisa ler projetos e clientes para:
-- 1. Ver nome do projeto no contrato (join FK)
-- 2. Ver dados do cliente (CNPJ, razão social) no contrato
-- Sem essas policies, o join FK retorna null e aparece
-- "Projeto removido" / "Cliente desconhecido".

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Juridico can read projects'
      AND tablename = 'projects'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Juridico can read projects"
        ON public.projects
        FOR SELECT
        TO authenticated
        USING (public.has_juridico_access(auth.uid()))
    $pol$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Juridico can read clients'
      AND tablename = 'clients'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Juridico can read clients"
        ON public.clients
        FOR SELECT
        TO authenticated
        USING (public.has_juridico_access(auth.uid()))
    $pol$;
  END IF;
END
$$;
