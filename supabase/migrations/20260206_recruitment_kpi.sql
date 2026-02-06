-- Create table for storing User KPI Settings
CREATE TABLE IF NOT EXISTS public.recruitment_kpi_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    fb_posts_target INTEGER DEFAULT 20,
    fb_comments_target INTEGER DEFAULT 50,
    fb_friends_target INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.recruitment_kpi_settings ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own KPI settings
CREATE POLICY "Users can view own KPI settings" ON public.recruitment_kpi_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Admins can view ALL KPI settings
CREATE POLICY "Admins can view all KPI settings" ON public.recruitment_kpi_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager', 'recruiter_manager')
        )
    );

-- 3. Only Admins can INSERT/UPDATE/DELETE (Configure KPIs)
-- Note: We might want to allow users to INSERT their own default row if it doesn't exist,
-- but for strict control, Admins should provision it, OR we allow insert but only update by Admin.
-- For simplicity and self-service initialization, let's allow users to INSERT their own row (default values),
-- but UPDATE is restricted to Admins.

-- Allow users to insert their own default settings
CREATE POLICY "Users can insert own KPI settings" ON public.recruitment_kpi_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow Admins to UPDATE any record
CREATE POLICY "Admins can update KPI settings" ON public.recruitment_kpi_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager', 'recruiter_manager')
        )
    );

-- Allow Admins to DELETE any record
CREATE POLICY "Admins can delete KPI settings" ON public.recruitment_kpi_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager', 'recruiter_manager')
        )
    );
