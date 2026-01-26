-- Migration: Allow any authenticated user to UPDATE weekly schedules (for Banner/Poster/Color)
-- While keeping INSERT/DELETE restricted to Admins

BEGIN;

-- 1. Create a specific policy for UPDATE that allows all authenticated users
-- This will exist alongside "Admins manage schedules" (which covers ALL).
-- Since Policies are permissive (OR), this adds the ability for users to Update.
CREATE POLICY "Allow authenticated update schedules" 
ON public.weekly_schedules 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

COMMIT;
