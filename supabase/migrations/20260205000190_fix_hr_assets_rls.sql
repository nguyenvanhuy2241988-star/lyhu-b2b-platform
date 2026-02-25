-- Fix RLS for "hr-assets" bucket
-- Purpose: Allow authenticated users to upload/view/delete images for HR module

-- 1. Ensure 50MB limit
UPDATE storage.buckets
SET file_size_limit = 52428800 -- 50MB
WHERE id = 'hr-assets';

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public View hr-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload hr-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete hr-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update hr-assets" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to own files hr-assets" ON storage.objects;

-- 3. Create Permissive Policies for Authenticated Users
-- A. VIEW (Allow Public or Authenticated? Let's allow Public for easy image loading)
CREATE POLICY "Public View hr-assets"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'hr-assets' );

-- B. UPLOAD (Authenticated users)
CREATE POLICY "Authenticated Upload hr-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'hr-assets' );

-- C. DELETE (Authenticated users)
CREATE POLICY "Authenticated Delete hr-assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'hr-assets' );

-- D. UPDATE (Authenticated users - optional)
CREATE POLICY "Authenticated Update hr-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'hr-assets' );
