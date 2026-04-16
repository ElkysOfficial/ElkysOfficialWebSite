-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Criar contas de teste para E2E multi-persona
-- Cada persona tem sua conta com role específico.
-- Senha padrão: E2eTest@2026 (bcrypt hash gerado com gen_salt)
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- Habilitar extensão pgcrypto se necessário
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Variáveis para IDs fixos (facilita referência em testes e limpeza)
DO $$
DECLARE
  v_password_hash text;
  v_comercial_id uuid := 'e2e00000-0000-0000-0000-000000000001';
  v_juridico_id uuid := 'e2e00000-0000-0000-0000-000000000002';
  v_financeiro_id uuid := 'e2e00000-0000-0000-0000-000000000003';
  v_po_id uuid := 'e2e00000-0000-0000-0000-000000000004';
  v_suporte_id uuid := 'e2e00000-0000-0000-0000-000000000005';
BEGIN
  -- Gerar hash bcrypt da senha padrão usando extensão pgcrypto
  v_password_hash := extensions.crypt('E2eTest@2026', extensions.gen_salt('bf'));

  -- ═══════════════════════════════════════════════════
  -- 1. COMERCIAL
  -- ═══════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, confirmation_token
  ) VALUES (
    v_comercial_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'e2e-comercial@elkys.com.br', v_password_hash,
    now(), now(), now(),
    '{"full_name": "E2E Comercial"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, email, is_active)
  VALUES (v_comercial_id, 'E2E Comercial', 'e2e-comercial@elkys.com.br', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_comercial_id, 'comercial')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.team_members (user_id, full_name, email, role_title, system_role, is_active, must_change_password)
  VALUES (v_comercial_id, 'E2E Comercial', 'e2e-comercial@elkys.com.br', 'Comercial', 'comercial', true, false)
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════
  -- 2. JURÍDICO
  -- ═══════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, confirmation_token
  ) VALUES (
    v_juridico_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'e2e-juridico@elkys.com.br', v_password_hash,
    now(), now(), now(),
    '{"full_name": "E2E Jurídico"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, email, is_active)
  VALUES (v_juridico_id, 'E2E Jurídico', 'e2e-juridico@elkys.com.br', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_juridico_id, 'juridico')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.team_members (user_id, full_name, email, role_title, system_role, is_active, must_change_password)
  VALUES (v_juridico_id, 'E2E Jurídico', 'e2e-juridico@elkys.com.br', 'Jurídico', 'juridico', true, false)
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════
  -- 3. FINANCEIRO
  -- ═══════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, confirmation_token
  ) VALUES (
    v_financeiro_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'e2e-financeiro@elkys.com.br', v_password_hash,
    now(), now(), now(),
    '{"full_name": "E2E Financeiro"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, email, is_active)
  VALUES (v_financeiro_id, 'E2E Financeiro', 'e2e-financeiro@elkys.com.br', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_financeiro_id, 'financeiro')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.team_members (user_id, full_name, email, role_title, system_role, is_active, must_change_password)
  VALUES (v_financeiro_id, 'E2E Financeiro', 'e2e-financeiro@elkys.com.br', 'Financeiro', 'financeiro', true, false)
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════
  -- 4. PO (Desenvolvimento)
  -- ═══════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, confirmation_token
  ) VALUES (
    v_po_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'e2e-po@elkys.com.br', v_password_hash,
    now(), now(), now(),
    '{"full_name": "E2E Product Owner"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, email, is_active)
  VALUES (v_po_id, 'E2E Product Owner', 'e2e-po@elkys.com.br', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_po_id, 'po')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.team_members (user_id, full_name, email, role_title, system_role, is_active, must_change_password)
  VALUES (v_po_id, 'E2E Product Owner', 'e2e-po@elkys.com.br', 'Desenvolvimento — PO', 'po', true, false)
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════
  -- 5. SUPORTE
  -- ═══════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, confirmation_token
  ) VALUES (
    v_suporte_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'e2e-suporte@elkys.com.br', v_password_hash,
    now(), now(), now(),
    '{"full_name": "E2E Suporte"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, email, is_active)
  VALUES (v_suporte_id, 'E2E Suporte', 'e2e-suporte@elkys.com.br', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_suporte_id, 'support')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.team_members (user_id, full_name, email, role_title, system_role, is_active, must_change_password)
  VALUES (v_suporte_id, 'E2E Suporte', 'e2e-suporte@elkys.com.br', 'Suporte', 'support', true, false)
  ON CONFLICT DO NOTHING;

END $$;

COMMIT;
