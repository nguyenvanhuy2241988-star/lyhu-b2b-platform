-- Add new fields to affiliate_post_logs to support KOL/CTV detailed profiles
ALTER TABLE public.affiliate_post_logs
ADD COLUMN IF NOT EXISTS follower_count TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS contact_info TEXT,
ADD COLUMN IF NOT EXISTS potential_rating TEXT,
ADD COLUMN IF NOT EXISTS booking_cost TEXT;
