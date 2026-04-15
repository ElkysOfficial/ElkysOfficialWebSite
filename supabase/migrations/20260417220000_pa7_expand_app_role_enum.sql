-- PA7 (PROBLEMA 21) — Expandir app_role para cobrir roles do briefing.
--
-- Roles adicionadas:
--   financeiro — area financeira/administrativa (cobranca, despesa)
--   comercial  — area comercial/CRM (leads, propostas, negociacao)
--   juridico   — area juridica (contratos, aceite, validacao)
--   designer   — UX/UI (projetos, tarefas de design)
--   po         — product owner / gestao de entrega
--
-- Roles ja existentes preservadas:
--   admin_super, admin, cliente, marketing, developer, support
--
-- Nota tecnica: ALTER TYPE ADD VALUE IF NOT EXISTS pode ser executado
-- dentro de uma transacao a partir do PG 12+, desde que o valor novo
-- nao seja USADO na mesma transacao. Esta migration apenas adiciona
-- os valores e atualiza a funcao has_any_team_role — nao insere linhas
-- em user_roles usando os novos valores.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'comercial';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'juridico';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'designer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'po';
