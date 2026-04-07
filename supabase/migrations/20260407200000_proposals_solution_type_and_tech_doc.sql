-- Add solution_type and technical_document_url to proposals
-- solution_type: flows to project.solution_type on conversion (required field in projects)
-- technical_document_url: technical scope document, separate from commercial proposal (document_url)
ALTER TABLE public.proposals
  ADD COLUMN solution_type TEXT,
  ADD COLUMN technical_document_url TEXT;
