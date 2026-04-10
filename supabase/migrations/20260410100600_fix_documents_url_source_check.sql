-- Fix: remover check constraint que impede inserts usando a coluna url legada
-- O app insere documentos via coluna "url" (original), mas o constraint exigia
-- storage_path ou external_url exclusivamente.
-- Nova regra: pelo menos uma fonte de URL deve estar preenchida.
ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_url_source_check;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_url_source_check
  CHECK (
    url IS NOT NULL
    OR storage_path IS NOT NULL
    OR external_url IS NOT NULL
  );
