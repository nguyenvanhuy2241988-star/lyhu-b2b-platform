-- Add AI-related columns to social_conversations for follow-up tracking
ALTER TABLE public.social_conversations
    ADD COLUMN IF NOT EXISTS needs_followup BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS followup_sent BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.social_conversations.needs_followup IS 'True if customer has not left phone number and needs AI follow-up';
COMMENT ON COLUMN public.social_conversations.followup_sent IS 'True if follow-up message has been sent';
