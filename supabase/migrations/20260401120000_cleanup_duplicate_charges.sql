-- ============================================
-- Cleanup: remove duplicate subscription charges
-- Keeps only the OLDEST charge per (subscription_id, due_date) pair
-- ============================================

DELETE FROM public.charges
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY subscription_id, due_date
        ORDER BY created_at ASC
      ) AS rn
    FROM public.charges
    WHERE subscription_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_charges_subscription_due_date_unique
  ON public.charges (subscription_id, due_date)
  WHERE subscription_id IS NOT NULL;
