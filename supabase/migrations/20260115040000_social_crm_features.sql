-- Add CRM columns to social_conversations
ALTER TABLE social_conversations 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'organic', -- 'ads', 'post', 'organic', 'referral'
ADD COLUMN IF NOT EXISTS source_detail jsonb DEFAULT '{}'::jsonb, -- Stores ad_id, ref_code, post_id
ADD COLUMN IF NOT EXISTS customer_profile_url text;

-- Add index for tags for faster filtering
CREATE INDEX IF NOT EXISTS idx_social_conversations_tags ON social_conversations USING GIN(tags);

-- Add index for source_type
CREATE INDEX IF NOT EXISTS idx_social_conversations_source_type ON social_conversations(source_type);

comment on column social_conversations.tags is 'List of tags like ["VIP", "Spam", "Potential"]';
comment on column social_conversations.source_detail is 'Details about dynamic source e.g. {"ad_id": "123", "ref": "promo_summer"}';
