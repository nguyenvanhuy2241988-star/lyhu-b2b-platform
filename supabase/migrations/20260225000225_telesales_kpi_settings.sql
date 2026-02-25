-- 1. Create table for storing Telesales KPI Settings
CREATE TABLE IF NOT EXISTS public.telesales_kpi_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    calls_target INTEGER DEFAULT 50,
    self_sourced_data_target INTEGER DEFAULT 10,
    fb_group_posts_target INTEGER DEFAULT 20,
    fb_comments_target INTEGER DEFAULT 50,
    fb_friends_target INTEGER DEFAULT 10,
    fb_personal_posts_target INTEGER DEFAULT 5,
    zalo_posts_target INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Realtime for telesales tables
alter publication supabase_realtime add table telesales_daily_activities;
alter publication supabase_realtime add table telesales_kpi_settings;

-- 3. Enable RLS
ALTER TABLE public.telesales_kpi_settings ENABLE ROW LEVEL SECURITY;

-- 4. Policies

-- Policy: Users can view their own KPI settings
CREATE POLICY "Users can view own telesales KPI settings" ON public.telesales_kpi_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Admins can view ALL KPI settings
CREATE POLICY "Admins can view all telesales KPI settings" ON public.telesales_kpi_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager', 'telesales_manager')
        )
    );

-- Policy: Users can insert their own default settings
CREATE POLICY "Users can insert own telesales KPI settings" ON public.telesales_kpi_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Allow Admins to UPDATE any record
CREATE POLICY "Admins can update telesales KPI settings" ON public.telesales_kpi_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager', 'telesales_manager')
        )
    );

-- Policy: Allow Admins to DELETE any record
CREATE POLICY "Admins can delete telesales KPI settings" ON public.telesales_kpi_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager', 'telesales_manager')
        )
    );
