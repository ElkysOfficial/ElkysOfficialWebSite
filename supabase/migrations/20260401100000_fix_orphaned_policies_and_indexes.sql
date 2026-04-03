-- ============================================
-- Fix: orphaned RLS policies, stale client lookup function in old policies,
--       missing indexes, and missing FK on marketing_calendar_events.created_by
-- ============================================

-- -----------------------------------------------
-- 1. (Skipped) Orphaned RLS policies for audit_logs and automation_settings
--    were already removed when those tables were dropped in
--    20260331123000_drop_unused_tables (DROP TABLE removes associated policies).
-- -----------------------------------------------

-- -----------------------------------------------
-- 2. Update old RLS policies that still use
--    get_client_id_for_user() → get_client_id_for_portal_user()
--    so client_contacts-based portal users can see their data
-- -----------------------------------------------

-- projects
DROP POLICY IF EXISTS "Clients can read own projects" ON public.projects;
CREATE POLICY "Clients can read own projects" ON public.projects
  FOR SELECT TO authenticated
  USING (client_id = public.get_client_id_for_portal_user(auth.uid()));

-- support_tickets (read + insert)
DROP POLICY IF EXISTS "Clients read own tickets" ON public.support_tickets;
CREATE POLICY "Clients read own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (client_id = public.get_client_id_for_portal_user(auth.uid()));

DROP POLICY IF EXISTS "Clients insert own tickets" ON public.support_tickets;
CREATE POLICY "Clients insert own tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (client_id = public.get_client_id_for_portal_user(auth.uid()));

-- -----------------------------------------------
-- 3. Add missing indexes for frequently queried columns
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_client_contacts_auth_user
  ON public.client_contacts (auth_user_id);

CREATE INDEX IF NOT EXISTS idx_charges_subscription
  ON public.charges (subscription_id);

-- -----------------------------------------------
-- 4. Add missing FK: marketing_calendar_events.created_by → auth.users
-- -----------------------------------------------
ALTER TABLE public.marketing_calendar_events
  ADD CONSTRAINT marketing_calendar_events_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
