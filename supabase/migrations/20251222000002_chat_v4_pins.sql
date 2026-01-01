-- Chat V4: Pinned Messages

BEGIN;

-- Add columns for Pinned Messages
ALTER TABLE public.internal_messages
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS pinned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for searching (optional but good for performance)
CREATE INDEX IF NOT EXISTS idx_internal_messages_content ON public.internal_messages USING gin(to_tsvector('english', content));
-- Note: 'english' is default, for Vietnamese we might want simple or custom, but 'english' or 'simple' is fine for basic tokenization.
-- Using simple to avoid stemming that ruins Vietnamese.
CREATE INDEX IF NOT EXISTS idx_internal_messages_content_simple ON public.internal_messages USING gin(to_tsvector('simple', content));

COMMIT;
