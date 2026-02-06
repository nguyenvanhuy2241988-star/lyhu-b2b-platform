-- Up Migration
-- Drop the existing check constraint on activity_type
ALTER TABLE public.recruitment_post_logs 
DROP CONSTRAINT IF EXISTS recruitment_post_logs_activity_type_check;

-- Add the new check constraint including 'friend'
ALTER TABLE public.recruitment_post_logs 
ADD CONSTRAINT recruitment_post_logs_activity_type_check 
CHECK (activity_type IN ('post', 'comment', 'reaction', 'share', 'friend'));
