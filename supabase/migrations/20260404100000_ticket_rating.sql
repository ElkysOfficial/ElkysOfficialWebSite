-- Add rating columns to support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS rating_feedback TEXT,
  ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;

-- Index for admin queries on rated tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_rating ON public.support_tickets (rating)
  WHERE rating IS NOT NULL;
