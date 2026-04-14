-- Seed de production_url para os projetos iniciais conhecidos (AK
-- Producoes e Jose Pedro Advocacia) que foram criados antes da coluna
-- existir. Match defensivo por nome do cliente (full_name,
-- nome_fantasia e razao_social), case-insensitive e idempotente
-- (so atualiza quando production_url ainda e NULL para nao sobrescrever
-- edicoes posteriores).
--
-- Alem disso, corrige as tags do projeto do Jose Pedro que foi criado
-- antes da atualizacao do site e ficou com tags desatualizadas. A
-- correcao usa o enum canonico PROJECT_TAG_OPTIONS do portal:
-- "Site Institucional" e "Manutencao".

UPDATE public.projects
SET production_url = 'https://akproducoes.com.br'
WHERE production_url IS NULL
  AND client_id IN (
    SELECT id FROM public.clients
    WHERE lower(full_name) LIKE '%ak produ%'
       OR lower(coalesce(nome_fantasia, '')) LIKE '%ak produ%'
       OR lower(coalesce(razao_social, '')) LIKE '%ak produ%'
  );

UPDATE public.projects
SET
  production_url = 'https://josepedroadv.com.br',
  tags = ARRAY['Site Institucional', 'Manutencao']::text[]
WHERE client_id IN (
    SELECT id FROM public.clients
    WHERE lower(full_name) LIKE '%jose pedro%'
       OR lower(full_name) LIKE '%josé pedro%'
       OR lower(coalesce(nome_fantasia, '')) LIKE '%jose pedro%'
       OR lower(coalesce(nome_fantasia, '')) LIKE '%josé pedro%'
  )
  AND (production_url IS NULL OR production_url = '');
