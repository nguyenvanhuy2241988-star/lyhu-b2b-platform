-- Add customer info columns to social_conversations
ALTER TABLE social_conversations 
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS customer_region text,
ADD COLUMN IF NOT EXISTS fb_thread_id text;

COMMENT ON COLUMN social_conversations.customer_phone IS 'Phone number collected from chat';
COMMENT ON COLUMN social_conversations.customer_region IS 'Customer region/location collected from chat';
COMMENT ON COLUMN social_conversations.fb_thread_id IS 'Facebook conversation thread ID (t_XXX format) for Meta Business Suite linking';
