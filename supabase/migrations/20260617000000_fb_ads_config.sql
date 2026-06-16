ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS facebook_ads_config jsonb DEFAULT '{}'::jsonb;
