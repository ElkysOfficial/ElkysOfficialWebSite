-- ============================================
-- Fix notification cron: use supabase_url() helper
-- Also cleanup orphaned notifications stuck in 'enviando' status
-- ============================================

-- 1. Remove old cron job
SELECT cron.unschedule('process-scheduled-notifications');

-- 2. Cleanup orphaned notifications stuck in 'enviando' with 0 recipients
DELETE FROM notification_recipients
WHERE notification_id IN (
  SELECT id FROM notifications WHERE status = 'enviando' AND (recipient_count = 0 OR recipient_count IS NULL)
);

DELETE FROM notifications
WHERE status = 'enviando' AND (recipient_count = 0 OR recipient_count IS NULL);
