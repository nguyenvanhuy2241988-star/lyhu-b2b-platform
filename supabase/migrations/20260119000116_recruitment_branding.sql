-- 1. Create Recruitment Settings Table (Singleton)
CREATE TABLE IF NOT EXISTS public.recruitment_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name text DEFAULT 'My Company',
    logo_url text,
    description text,
    website text,
    culture_description text,
    culture_images text[], -- Array of image URLs
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Ensure only one row exists (Singleton Pattern)
CREATE UNIQUE INDEX IF NOT EXISTS recruitment_settings_singleton_idx ON public.recruitment_settings ((true));

-- 2. Add Banner URL to Jobs
ALTER TABLE public.recruitment_jobs
ADD COLUMN IF NOT EXISTS banner_url text;

-- 3. RLS for Settings
ALTER TABLE public.recruitment_settings ENABLE ROW LEVEL SECURITY;

-- Allow Public Read
CREATE POLICY "Public Read Settings"
ON public.recruitment_settings FOR SELECT
TO public, anon, authenticated
USING (true);

-- Allow Admin/Recruiter Update (Adjust roles as needed)
CREATE POLICY "Admin Update Settings"
ON public.recruitment_settings FOR ALL
TO authenticated
USING (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role in ('admin', 'recruiter')
    )
);

-- 4. Storage for Assets (Logo, Banners, Culture)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recruitment_assets', 'recruitment_assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recruitment_assets');

CREATE POLICY "Authenticated Upload Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recruitment_assets');

COMMIT;
