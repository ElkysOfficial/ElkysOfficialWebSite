-- Fix: ampliar check constraint de source_table para incluir todas as tabelas usadas no app
ALTER TABLE public.timeline_events
  DROP CONSTRAINT IF EXISTS timeline_events_source_table_check;

ALTER TABLE public.timeline_events
  ADD CONSTRAINT timeline_events_source_table_check
  CHECK (
    source_table IS NULL
    OR source_table IN (
      'charges',
      'documents',
      'leads',
      'project_contracts',
      'project_installments',
      'project_next_steps',
      'project_subscriptions',
      'projects',
      'proposals'
    )
  );
