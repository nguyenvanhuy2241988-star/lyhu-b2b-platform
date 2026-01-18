-- 1. Create Storage Bucket for CVs
INSERT INTO storage.buckets (id, name, public)
VALUES ('recruitment_cvs', 'recruitment_cvs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies (Allow Public Upload)
CREATE POLICY "Public Upload CVs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'recruitment_cvs');

CREATE POLICY "Public Read CVs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recruitment_cvs');

-- 3. Add 'benefits' column to Job Description
ALTER TABLE public.recruitment_jobs
ADD COLUMN IF NOT EXISTS benefits text;

-- 4. Update Public RPC to include Benefits in fetch? 
-- Actually, the frontend fetches directly via SELECT. 
-- We just need to ensure RLS allows reading 'benefits' (it allows * so we are good).

COMMIT;
