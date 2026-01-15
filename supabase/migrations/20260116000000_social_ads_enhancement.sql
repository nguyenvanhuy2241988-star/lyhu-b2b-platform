-- Migration: Add Ads Source Tracking columns to social_conversations
-- Date: 2026-01-16

ALTER TABLE social_conversations
ADD COLUMN IF NOT EXISTS ad_id TEXT,
ADD COLUMN IF NOT EXISTS ad_title TEXT,
ADD COLUMN IF NOT EXISTS post_id TEXT, -- For organic posts or where ad_id is not available
ADD COLUMN IF NOT EXISTS post_url TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT; -- 'ads', 'post', 'messenger_search', 'unknown'

-- Add index for analytics
CREATE INDEX IF NOT EXISTS idx_social_conversations_referral ON social_conversations(referral_source);
CREATE INDEX IF NOT EXISTS idx_social_conversations_ad_id ON social_conversations(ad_id);

-- Add page_name denormalization if helpful (optional, but good for performance)
-- We will stick to JOINs for now as pages are few.

-- Comment on columns
COMMENT ON COLUMN social_conversations.ad_id IS 'Facebook Ad ID if conversation started from an ad';
COMMENT ON COLUMN social_conversations.referral_source IS 'Source of the conversation: ads, organic_post, etc.';
