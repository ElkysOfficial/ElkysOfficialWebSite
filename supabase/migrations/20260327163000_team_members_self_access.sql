-- Allow team members to read their own record so first-access guards can
-- reliably evaluate must_change_password for non-admin roles.

DROP POLICY IF EXISTS "Team members can read own data" ON public.team_members;

CREATE POLICY "Team members can read own data" ON public.team_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
