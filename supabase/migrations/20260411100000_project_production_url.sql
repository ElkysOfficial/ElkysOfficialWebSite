-- Adiciona coluna production_url em projects para armazenar o link
-- publico do produto/site entregue ao cliente. Permite que tanto o
-- portal admin quanto o portal do cliente exibam um botao "Acessar
-- site" direto na listagem de projetos e na tela de detalhe, evitando
-- que a equipe precise procurar o link em outros lugares (email,
-- documentos internos, chat) quando o cliente pedir suporte.
--
-- Nullable porque nem todo projeto tem URL publica (ex: branding,
-- consultoria, projetos internos). Sem default para nao poluir com
-- string vazia — leitura fica naturalmente "tem URL ou nao tem".

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS production_url text;

COMMENT ON COLUMN public.projects.production_url IS
  'URL publica do produto/site entregue ao cliente (ex: https://akproducoes.com.br). Usada nos portais admin e cliente para acesso direto ao produto.';
