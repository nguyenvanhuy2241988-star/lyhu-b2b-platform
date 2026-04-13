-- Bổ sung cơ chế chống trùng lặp nhóm cho Bot
ALTER TABLE public.telesales_fb_groups 
ADD COLUMN IF NOT EXISTS last_bot_run_at TIMESTAMPTZ;
