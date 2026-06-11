-- Create table for short videos
CREATE TABLE IF NOT EXISTS public.wholesale_short_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.wholesale_short_videos ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active videos
CREATE POLICY "Allow public read access to active short videos"
    ON public.wholesale_short_videos
    FOR SELECT
    USING (is_active = true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to short videos"
    ON public.wholesale_short_videos
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role IN ('admin', 'superadmin', 'manager')
        )
    );

-- Insert bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('short_videos', 'short_videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow public to view short videos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'short_videos' );

CREATE POLICY "Allow admins to upload short videos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'short_videos' AND 
    auth.role() = 'authenticated' AND
    auth.uid() IN (
        SELECT id FROM profiles WHERE role IN ('admin', 'superadmin', 'manager')
    )
);

CREATE POLICY "Allow admins to update short videos"
ON storage.objects FOR UPDATE
WITH CHECK (
    bucket_id = 'short_videos' AND 
    auth.role() = 'authenticated' AND
    auth.uid() IN (
        SELECT id FROM profiles WHERE role IN ('admin', 'superadmin', 'manager')
    )
);

CREATE POLICY "Allow admins to delete short videos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'short_videos' AND 
    auth.role() = 'authenticated' AND
    auth.uid() IN (
        SELECT id FROM profiles WHERE role IN ('admin', 'superadmin', 'manager')
    )
);
