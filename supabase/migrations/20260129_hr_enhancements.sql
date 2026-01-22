-- Migration: HR Enhancements (Banner, Notes, Public Visibility)
-- Purpose: Add banner support, user notes table, and relax RLS for public viewing
-- Date: 2026-01-29

BEGIN;

-- 1. Storage for HR Assets (Banners)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hr-assets', 'hr-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public View HR Assets" ON storage.objects;
CREATE POLICY "Public View HR Assets" ON storage.objects
    FOR SELECT USING ( bucket_id = 'hr-assets' );

DROP POLICY IF EXISTS "Admin/HR Upload HR Assets" ON storage.objects;
CREATE POLICY "Admin/HR Upload HR Assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'hr-assets' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'recruiter'))
    );

DROP POLICY IF EXISTS "Admin/HR Delete HR Assets" ON storage.objects;
CREATE POLICY "Admin/HR Delete HR Assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'hr-assets' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'recruiter'))
    );

-- 2. Weekly Schedules Enhancements (Banner)
ALTER TABLE public.weekly_schedules 
ADD COLUMN IF NOT EXISTS banner_url text;

-- 3. Weekly Schedule User Notes
CREATE TABLE IF NOT EXISTS public.weekly_schedule_user_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id uuid REFERENCES public.weekly_schedules(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    note text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(schedule_id, user_id)
);

ALTER TABLE public.weekly_schedule_user_notes ENABLE ROW LEVEL SECURITY;

-- Policies for Notes
DROP POLICY IF EXISTS "Everyone can view notes" ON public.weekly_schedule_user_notes;
CREATE POLICY "Everyone can view notes" ON public.weekly_schedule_user_notes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own notes" ON public.weekly_schedule_user_notes;
CREATE POLICY "Users manage own notes" ON public.weekly_schedule_user_notes
    FOR ALL USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'recruiter'))
    );

-- 4. Update Shift Registrations Policies for Public Visibility
-- Everyone can VIEW all registrations (to see who is working when)
DROP POLICY IF EXISTS "View own registrations or Admin" ON public.shift_registrations;
CREATE POLICY "Everyone view all registrations" ON public.shift_registrations
    FOR SELECT USING (true);

-- Ensure users can still only register for THEMSELVES (or Admin/HR helper)
-- Existing Insert Policy: "Users register own shifts" -> auth.uid() = user_id
-- We might need Admin override for insert too if not already present
DROP POLICY IF EXISTS "Admin/HR manage registrations" ON public.shift_registrations;
CREATE POLICY "Admin/HR manage registrations" ON public.shift_registrations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'recruiter'))
    );

COMMIT;
