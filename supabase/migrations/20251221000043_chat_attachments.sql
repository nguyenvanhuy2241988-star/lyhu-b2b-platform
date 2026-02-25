-- Add Attachment Support to Chat
-- 1. Add columns to internal_messages
-- 2. Create Storage Bucket

BEGIN;

-- 1. Add columns
ALTER TABLE public.internal_messages
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_type text CHECK (attachment_type IN ('image', 'file', 'video', 'audio')),
ADD COLUMN IF NOT EXISTS attachment_name text;

-- 2. Create Storage Bucket (if not exists)
-- This usually requires Supabase UI, but we can try via SQL extensions if enabled, 
-- or we rely on the user to create it if this fails. 
-- Standard way in Supabase migrations is to insert into storage.buckets

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- Allow authenticated users to upload
drop policy if exists "Authenticated users can upload chat attachments" on storage.objects;
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Allow authenticated users to read
drop policy if exists "Authenticated users can read chat attachments" on storage.objects;
CREATE POLICY "Authenticated users can read chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

COMMIT;
