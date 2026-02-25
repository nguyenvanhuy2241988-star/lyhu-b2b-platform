-- 1. Recruitment Jobs: Allow Public Read
ALTER TABLE IF EXISTS public.recruitment_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view open jobs" ON public.recruitment_jobs;
CREATE POLICY "Public can view open jobs" ON public.recruitment_jobs
    FOR SELECT
    TO anon, authenticated
    USING (status = 'open' OR status = 'hiring'); -- Adjust based on actual status values, 'open' is common.

-- 2. Recruitment Settings: Allow Public Read
ALTER TABLE IF EXISTS public.recruitment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view settings" ON public.recruitment_settings;
CREATE POLICY "Public can view settings" ON public.recruitment_settings
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 3. Storage: Allow Public Uploads to 'recruitment_cvs'
-- Try to create bucket if not exists (handling idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recruitment_cvs', 'recruitment_cvs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for INSERT (Upload)
DROP POLICY IF EXISTS "Public can upload CVs" ON storage.objects;
CREATE POLICY "Public can upload CVs" ON storage.objects
    FOR INSERT
    TO anon
    WITH CHECK (bucket_id = 'recruitment_cvs');

-- Policy for SELECT (View/Download) - mainly for Recruiter but also for the uploader to get public URL immediately
DROP POLICY IF EXISTS "Public can view CVs" ON storage.objects;
CREATE POLICY "Public can view CVs" ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'recruitment_cvs');

-- 4. Grant Table Permissions explicitly (sometimes needed alongside RLS)
GRANT SELECT ON TABLE public.recruitment_jobs TO anon, authenticated;
GRANT SELECT ON TABLE public.recruitment_settings TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
