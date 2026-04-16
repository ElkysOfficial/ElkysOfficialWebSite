-- Limpeza: apagar documentos duplicados "Contrato v2" 
-- Mantém apenas o documento mais recente do tipo 'contrato' por contract_id.
-- O documento correto (que o admin anexou manualmente) fica preservado.

BEGIN;

-- Apagar documentos do tipo 'contrato' que são v2 (duplicados)
-- e não são o mais recente por contract_id
DELETE FROM public.documents
WHERE id IN (
  SELECT d.id
  FROM public.documents d
  INNER JOIN (
    -- Para cada contract_id, pegar o ID do documento mais recente
    SELECT contract_id, MAX(created_at) AS max_created
    FROM public.documents
    WHERE type = 'contrato' AND contract_id IS NOT NULL
    GROUP BY contract_id
    HAVING COUNT(*) > 1
  ) dup ON d.contract_id = dup.contract_id
  WHERE d.type = 'contrato'
    AND d.created_at < dup.max_created
);

-- Também apagar documentos do tipo 'contrato' com label 'Contrato v2'
-- que foram criados automaticamente pelo sistema (duplicados do AddContractLinkForm)
DELETE FROM public.documents
WHERE type = 'contrato'
  AND label = 'Contrato v2'
  AND id NOT IN (
    -- Preservar o mais recente por contract_id
    SELECT DISTINCT ON (contract_id) id
    FROM public.documents
    WHERE type = 'contrato' AND contract_id IS NOT NULL
    ORDER BY contract_id, created_at DESC
  );

COMMIT;
