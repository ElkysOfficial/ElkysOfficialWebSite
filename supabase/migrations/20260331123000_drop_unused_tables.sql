-- ============================================
-- Drop tables sem uso no código atual
-- Critério: sem uso no frontend, libs ou Edge Functions
-- e sem dependência explícita no repositório além do próprio schema.
-- Não usamos CASCADE de propósito: se existir dependência externa
-- fora do repositório, a migration deve falhar em vez de apagar junto.
-- ============================================

DROP TABLE IF EXISTS public.support_response_templates;
DROP TABLE IF EXISTS public.support_knowledge_articles;
DROP TABLE IF EXISTS public.project_dev_status;
DROP TABLE IF EXISTS public.project_dev_links;
DROP TABLE IF EXISTS public.project_dev_doc_links;
DROP TABLE IF EXISTS public.project_client_requirements;
DROP TABLE IF EXISTS public.marketing_materials;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.automation_settings;
DROP TABLE IF EXISTS public.audit_logs;
