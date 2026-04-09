-- Add SELECT policies for team members on CRM tables.
-- Follows the same pattern used for charges, projects, documents, etc.
-- Only grants read access; write remains admin-only.

-- proposals
DROP POLICY IF EXISTS "Team members read proposals" ON public.proposals;
CREATE POLICY "Team members read proposals" ON public.proposals
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

-- leads
DROP POLICY IF EXISTS "Team members read leads" ON public.leads;
CREATE POLICY "Team members read leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));

-- lead_interactions
DROP POLICY IF EXISTS "Team members read lead interactions" ON public.lead_interactions;
CREATE POLICY "Team members read lead interactions" ON public.lead_interactions
  FOR SELECT TO authenticated
  USING (public.has_any_team_role(auth.uid()));
