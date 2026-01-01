-- Fix: Repair Schema and Reload Cache
-- The error "Could not find column ... in schema cache" usually means the PostgREST cache is stale
-- OR the column was missed in a failed previous migration.

-- 1. Safely ensure column exists
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'documents_folders') then
    if not exists (select 1 from information_schema.columns where table_name = 'documents_folders' and column_name = 'guidance_md') then
       alter table public.documents_folders add column guidance_md text not null default '';
    end if;
  end if;
end $$;

-- 2. Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload config';
