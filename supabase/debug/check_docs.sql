-- Debug script to check documents tables
SELECT
    (SELECT count(*) FROM public.documents_folders) as total_folders,
    (SELECT count(*) FROM public.documents_files) as total_files;

-- Check RLS policies on folders
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'documents_folders';

-- Check RLS policies on files
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'documents_files';
