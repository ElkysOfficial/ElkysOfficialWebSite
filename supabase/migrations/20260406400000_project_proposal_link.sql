-- Link projects to proposals for traceability
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposals(id);

CREATE INDEX IF NOT EXISTS idx_projects_proposal_id
  ON public.projects (proposal_id) WHERE proposal_id IS NOT NULL;
