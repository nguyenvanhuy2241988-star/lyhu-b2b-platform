-- Fix Foreign Key for HR Reports to match with Profiles
-- This enables: .select('*, profile:profiles(...)')

BEGIN;

-- Add explicit Foreign Key to public.profiles
-- This allows PostgREST to detect the relationship "profile"
ALTER TABLE public.recruitment_daily_activities
ADD CONSTRAINT recruitment_daily_activities_profile_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

COMMIT;
