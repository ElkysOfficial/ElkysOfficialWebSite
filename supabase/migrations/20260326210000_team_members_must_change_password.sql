-- Add must_change_password flag to team_members
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
