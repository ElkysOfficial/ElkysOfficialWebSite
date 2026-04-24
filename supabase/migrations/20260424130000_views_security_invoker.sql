-- Fix: Supabase Security Advisor — SECURITY DEFINER Views (Critical)
--
-- As tres views abaixo foram criadas antes do PG15 expor security_invoker
-- como opcao por view, entao herdaram o comportamento legado SECURITY
-- DEFINER: executavam com as permissoes do criador (superuser/postgres),
-- bypassando a RLS das tabelas base.
--
-- Risco: um usuario com role `cliente` consultando client_financial_summary
-- podia, em tese, receber linhas de outros clientes porque o RLS de
-- `clients`/`project_subscriptions`/`project_contracts` nao era aplicado.
-- Na pratica, os hooks (ex: useAdminClients.ts) filtram explicitamente por
-- client_id, entao nao houve vazamento confirmado — mas a defense-in-depth
-- exige que o RLS proteja a view tambem.
--
-- Fix (PG15+): ALTER VIEW ... SET (security_invoker = on) transforma a
-- view em caller-rights. Agora as policies de RLS das tabelas subjacentes
-- sao avaliadas contra o auth.uid() de quem esta consultando.
--
-- Impacto esperado:
-- - Admin roles (admin_super, admin, financeiro, comercial): sem mudanca —
--   ja tem policies amplas de SELECT nas tabelas base.
-- - Cliente: ve apenas sua propria linha em client_financial_summary
--   (RLS em clients filtra por auth.uid()).
-- - Contract history / CRM deals: consumidos so pelo admin portal.
--
-- Reversao: ALTER VIEW ... SET (security_invoker = off); (nao recomendado).

ALTER VIEW public.project_contract_history SET (security_invoker = on);
ALTER VIEW public.client_financial_summary SET (security_invoker = on);
ALTER VIEW public.crm_deals_view           SET (security_invoker = on);

COMMENT ON VIEW public.project_contract_history IS
  'Historico de versoes de contratos. security_invoker=on aplica RLS do caller (PA fix 2026-04-24).';
COMMENT ON VIEW public.client_financial_summary IS
  'Resumo financeiro por cliente calculado em tempo real. security_invoker=on aplica RLS do caller (PA fix 2026-04-24).';
COMMENT ON VIEW public.crm_deals_view IS
  'Oportunidades consolidadas do CRM. security_invoker=on aplica RLS do caller (PA fix 2026-04-24).';
