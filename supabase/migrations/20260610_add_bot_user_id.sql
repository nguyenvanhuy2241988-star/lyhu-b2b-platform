-- Migration: Add user_id to bot tables to support multi-tenancy

ALTER TABLE public.bot_profiles
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

ALTER TABLE public.bot_campaigns
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

ALTER TABLE public.marketing_competitors
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- marketing_bot_commands already has created_by column which we will use as user_id.

-- Note: marketing_action_logs currently doesn't have a user_id because the desktop worker 
-- doesn't pass it. We will leave it global for now or add it later if the worker is updated.
