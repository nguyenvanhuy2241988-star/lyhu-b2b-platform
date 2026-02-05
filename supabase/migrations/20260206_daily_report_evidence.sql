-- Create new table for tracking individual post evidence
CREATE TABLE IF NOT EXISTS public.recruitment_post_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    platform TEXT CHECK (platform IN ('facebook_group', 'facebook_page', 'threads', 'zalo', 'linkedin', 'other')),
    group_name TEXT,
    group_link TEXT,
    post_link TEXT,
    content_excerpt TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for post_logs
ALTER TABLE public.recruitment_post_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own logs
CREATE POLICY "Users can manage own post logs" ON public.recruitment_post_logs
    FOR ALL
    USING (auth.uid() = user_id);

-- Policy: Admin/Recruiter Managers can view all
CREATE POLICY "Admins can view all post logs" ON public.recruitment_post_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'recruiter_manager', 'sale_admin', 'manager')
        )
    );

-- Add explanation columns to daily activities
ALTER TABLE public.recruitment_daily_activities
ADD COLUMN IF NOT EXISTS other_tasks TEXT,
ADD COLUMN IF NOT EXISTS no_post_reason TEXT,
ADD COLUMN IF NOT EXISTS plan_next_day TEXT;

-- Create storage bucket for report evidence if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for storage: Authenticated users can upload
CREATE POLICY "Authenticated users can upload report images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'report-images');

-- Policy for storage: Public view
CREATE POLICY "Public view report images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'report-images');
