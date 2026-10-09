-- Migration: Allow all file types and increase size limit for task_attachments bucket
UPDATE storage.buckets
SET allowed_mime_types = NULL,
    file_size_limit = 52428800 -- 50MB
WHERE id = 'task_attachments';

-- If bucket doesn't exist, create it with no restrictions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('task_attachments', 'task_attachments', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  allowed_mime_types = NULL,
  file_size_limit = 52428800;
