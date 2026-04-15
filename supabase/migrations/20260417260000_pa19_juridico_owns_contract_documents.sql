-- PA19 (PROBLEMA 25) — juridico como owner de documentos tipo contrato.
--
-- Regra: documento com type='contrato' so pode ser inserido/atualizado
-- por admin ou juridico. Documentos de outros tipos (briefing,
-- nota_fiscal, codigo_fonte, outro) seguem o modelo antigo (admin).
--
-- Implementacao: policy com FOR ALL filtrando por type. Cliente e
-- team members continuam lendo via policies ja existentes.

BEGIN;

DROP POLICY IF EXISTS "Juridico manages contract documents" ON public.documents;
CREATE POLICY "Juridico manages contract documents" ON public.documents
  FOR ALL TO authenticated
  USING (
    type = 'contrato' AND public.has_juridico_access(auth.uid())
  )
  WITH CHECK (
    type = 'contrato' AND public.has_juridico_access(auth.uid())
  );

COMMENT ON POLICY "Juridico manages contract documents" ON public.documents IS
  'PA19: juridico tem CRUD completo em documentos tipo contrato via has_juridico_access (admin + juridico). Outros tipos seguem policies de admin.';

COMMIT;
