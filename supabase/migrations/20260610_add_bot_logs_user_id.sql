-- Migration: Add user_id to bot logs and leads to isolate data per user

ALTER TABLE public.marketing_action_logs
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.marketing_leads_staging
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
