-- Reseting Documents Tables (Fix for Schema Cache / Column Missing)
-- WARNING: This will delete all existing data in documents folders/files!

-- 1. Drop existing tables
drop table if exists public.documents_activity cascade;
drop table if exists public.documents_files cascade;
drop table if exists public.documents_folders cascade;

-- 2. Recreate Tables (With guidance_md explicitly)
create table public.documents_folders (
    id uuid primary key default gen_random_uuid(),
    parent_id uuid references public.documents_folders(id) on delete set null,
    name text not null,
    slug text null,
    guidance_md text not null default '', -- Explicitly included
    visibility text not null default 'all',
    allowed_roles text[] not null default '{}'::text[],
    owner_id uuid references auth.users(id),
    created_by uuid not null default auth.uid() references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    is_deleted boolean not null default false
);

create table public.documents_files (
    id uuid primary key default gen_random_uuid(),
    folder_id uuid not null references public.documents_folders(id),
    title text not null,
    original_name text not null,
    mime_type text not null,
    size_bytes bigint not null default 0,
    storage_bucket text not null default 'lyhu-docs',
    storage_path text not null,
    visibility text not null default 'inherit',
    allowed_roles text[] not null default '{}'::text[],
    owner_id uuid references auth.users(id),
    created_by uuid not null default auth.uid() references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    is_deleted boolean not null default false
);

create table public.documents_activity (
    id bigserial primary key,
    entity_type text not null,
    entity_id uuid not null,
    action text not null,
    message text not null default '',
    actor_id uuid not null default auth.uid() references auth.users(id),
    created_at timestamptz not null default now()
);

-- 3. Indexes & Triggers
create index idx_docs_folders_parent on public.documents_folders(parent_id);
create index idx_docs_files_folder on public.documents_files(folder_id);

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_docs_folders_updated_at before update on public.documents_folders for each row execute function public.set_updated_at();
create trigger trg_docs_files_updated_at before update on public.documents_files for each row execute function public.set_updated_at();

-- 4. RLS & Permissions
alter table public.documents_folders enable row level security;
alter table public.documents_files enable row level security;
alter table public.documents_activity enable row level security;

grant all on table public.documents_folders to authenticated;
grant all on table public.documents_files to authenticated;
grant all on table public.documents_activity to authenticated;
grant usage, select on sequence public.documents_activity_id_seq to authenticated;

-- Policies
drop policy if exists "Enable all for authenticated" on public.documents_folders;
create policy "Enable all for authenticated" on public.documents_folders for all to authenticated using (true) with check (true);
drop policy if exists "Enable all for authenticated" on public.documents_files;
create policy "Enable all for authenticated" on public.documents_files for all to authenticated using (true) with check (true);
drop policy if exists "Enable all for authenticated" on public.documents_activity;
create policy "Enable all for authenticated" on public.documents_activity for all to authenticated using (true) with check (true);

-- 5. Force Cache Reload
NOTIFY pgrst, 'reload config';

-- 6. Initial Seed (Safely handling auth.uid() being null in SQL Editor)
do $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users limit 1;
  
  if v_uid is not null then
    insert into public.documents_folders (name, guidance_md, created_by)
    values ('Công ty', '# Tài liệu chung công ty', v_uid);
  end if;
end $$;
