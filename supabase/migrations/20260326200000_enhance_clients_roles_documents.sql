
-- ============================================
-- Migration Part 1: Add new enum values ONLY
-- (Must be a separate transaction from any
--  statements that USE those new values)
-- ============================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
