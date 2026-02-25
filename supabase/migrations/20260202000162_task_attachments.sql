-- 1. Add 'attachments' column to telesales_tasks
ALTER TABLE public.telesales_tasks 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::JSONB;

-- 2. Create Storage Bucket for Task Attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task_attachments', 
  'task_attachments', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880;

-- 3. Storage Policies (RLS)

-- Helper policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'task_attachments' );

-- Helper policy to allow public to view (since it's a public bucket, but good to be explicit for SELECT)
CREATE POLICY "Public can view task attachments"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'task_attachments' );

-- Helper policy to allow users to delete their own uploads (optional, simplistic version)
CREATE POLICY "Users can delete task attachments"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'task_attachments' );
