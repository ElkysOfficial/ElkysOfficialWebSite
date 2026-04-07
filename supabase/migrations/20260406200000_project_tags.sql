-- Add tags column to projects (same pattern as clients.tags)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_projects_tags ON public.projects USING GIN (tags);
