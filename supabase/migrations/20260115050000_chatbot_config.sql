-- Add chatbot_config to facebook_pages to store Welcome Screen & Menu settings
ALTER TABLE public.facebook_pages
ADD COLUMN IF NOT EXISTS chatbot_config jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.facebook_pages.chatbot_config IS 'Stores greeting_text, persistent_menu, get_started payload';
