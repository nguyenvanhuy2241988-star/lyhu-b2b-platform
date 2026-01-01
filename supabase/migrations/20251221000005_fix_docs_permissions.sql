-- Fix Migration: Ensure Permissions and Functions for Documents Module

-- 1. Ensure set_updated_at function exists (Critical for triggers)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. Grant permissions to authenticated users (just in case default privileges are missing)
grant all on table public.documents_folders to authenticated;
grant all on table public.documents_files to authenticated;
grant all on table public.documents_activity to authenticated;
grant usage, select on sequence public.documents_activity_id_seq to authenticated;

-- 3. Verify Policies (Optional - Re-applying doesn't hurt if using Create Policy if not exists, 
-- but we already did that. This is just for permissions)

-- 4. Ensure RLS is on
alter table public.documents_folders enable row level security;
alter table public.documents_files enable row level security;
alter table public.documents_activity enable row level security;
