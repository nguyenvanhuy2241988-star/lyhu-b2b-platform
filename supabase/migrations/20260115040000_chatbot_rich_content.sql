-- Migration: Add Rich Content support to Chatbot Rules

ALTER TABLE public.chatbot_rules
ADD COLUMN IF NOT EXISTS response_type text DEFAULT 'text', -- 'text', 'image', 'gallery'
ADD COLUMN IF NOT EXISTS media_url text, -- For image URL
ADD COLUMN IF NOT EXISTS buttons jsonb DEFAULT '[]'::jsonb; -- Array of buttons

-- Update comment
COMMENT ON COLUMN public.chatbot_rules.response_type IS 'Type of response: text, image, gallery';
COMMENT ON COLUMN public.chatbot_rules.buttons IS 'JSON array of buttons/quick replies: [{type: "postback", title: "View", payload: "..."}]';
