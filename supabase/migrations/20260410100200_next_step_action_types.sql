-- ============================================
-- Add action_type to project_next_steps for typed pendencies.
-- Each type triggers a customized email to the client.
-- ============================================

-- 1. Create the enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'next_step_action_type') THEN
    CREATE TYPE public.next_step_action_type AS ENUM (
      'geral',
      'reuniao',
      'documento',
      'aprovacao',
      'informacao',
      'feedback',
      'acesso',
      'conteudo'
    );
  END IF;
END
$$;

-- 2. Add columns
ALTER TABLE public.project_next_steps
  ADD COLUMN IF NOT EXISTS action_type public.next_step_action_type NOT NULL DEFAULT 'geral';

-- Optional meeting link for 'reuniao' type
ALTER TABLE public.project_next_steps
  ADD COLUMN IF NOT EXISTS meeting_link text;
