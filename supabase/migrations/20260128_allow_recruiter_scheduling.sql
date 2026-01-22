-- Migration: Allow Recruiters to Manage Scheduling
-- Purpose: Update RLS policies to include 'recruiter' role for scheduling tables

BEGIN;

-- 1. update "Admins manage shifts" on work_shifts
DROP POLICY IF EXISTS "Admins manage shifts" ON public.work_shifts;
CREATE POLICY "Admins manage shifts" ON public.work_shifts USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'recruiter'))
);

-- 2. update "Admins manage schedules" on weekly_schedules
DROP POLICY IF EXISTS "Admins manage schedules" ON public.weekly_schedules;
CREATE POLICY "Admins manage schedules" ON public.weekly_schedules USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'recruiter'))
);

-- 3. update "View own registrations or Admin" on shift_registrations
DROP POLICY IF EXISTS "View own registrations or Admin" ON public.shift_registrations;
CREATE POLICY "View own registrations or Admin" ON public.shift_registrations FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'recruiter'))
);

-- 4. update "Admins update registrations" on shift_registrations
DROP POLICY IF EXISTS "Admins update registrations" ON public.shift_registrations;
CREATE POLICY "Admins update registrations" ON public.shift_registrations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'recruiter'))
);

COMMIT;
