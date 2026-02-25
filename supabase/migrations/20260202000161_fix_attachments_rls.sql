-- 1. Increase File Size Limit to 50MB
UPDATE storage.buckets
SET file_size_limit = 52428800 -- 50MB in bytes
WHERE id = 'task_attachments';

-- 2. RESET RLS Policies to be more permissive (Fix "new row violates..." error)
-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Create comprehensive policies
-- A. Allow ANY authenticated user to UPLOAD files to this bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'task_attachments' );

-- B. Allow ANYONE (Public) to VIEW files (since it's a public bucket)
CREATE POLICY "Allow public viewing"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'task_attachments' );

-- C. Allow Authenticated users to DELETE (simplistic approach for internal tool)
-- Ideally, only the uploader or admin, but for now allow auth users for flexibility
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'task_attachments' );

-- D. Allow UPDATE (optional, usually not needed for simple storage, but good for "upsert")
CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'task_attachments' );
