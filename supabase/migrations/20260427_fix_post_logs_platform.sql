-- Drop the old constraint
ALTER TABLE public.recruitment_post_logs DROP CONSTRAINT IF EXISTS recruitment_post_logs_platform_check;

-- Add the new constraint with facebook_personal and tiktok
ALTER TABLE public.recruitment_post_logs ADD CONSTRAINT recruitment_post_logs_platform_check 
CHECK (platform IN ('facebook_group', 'facebook_page', 'facebook_personal', 'threads', 'tiktok', 'zalo', 'linkedin', 'other'));
