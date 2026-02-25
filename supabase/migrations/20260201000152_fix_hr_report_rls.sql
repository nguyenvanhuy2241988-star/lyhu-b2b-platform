-- Fix RLS for recruitment_daily_activities to ensure Admin visibility
-- Date: 2026-02-01

BEGIN;

-- 1. Drop existing policy to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own reports" ON public.recruitment_daily_activities;

-- 2. Re-create policy with explicit Admin access
CREATE POLICY "Users can view their own reports"
ON public.recruitment_daily_activities
FOR SELECT
USING (
    -- User can see their own
    auth.uid() = user_id 
    OR 
    -- Admin and Recruiter Manager can see ALL
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'recruiter_manager', 'sale_admin', 'manager')
    )
);

-- 3. Ensure profiles are visible (Just in case)
-- Normally profiles are public/authenticated readable, but ensuring here doesn't hurt context
-- (Skipping explicit profile RLS change to avoid side effects, focusing on report table)

COMMIT;
