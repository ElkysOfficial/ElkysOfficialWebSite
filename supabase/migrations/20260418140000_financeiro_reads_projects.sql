-- FI1: Financeiro precisa ler projetos para saber se projeto foi
-- entregue antes de cobrar parcela de entrega.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Finance can read projects'
      AND tablename = 'projects'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Finance can read projects"
        ON public.projects
        FOR SELECT
        TO authenticated
        USING (public.has_finance_access(auth.uid()))
    $pol$;
  END IF;
END
$$;
