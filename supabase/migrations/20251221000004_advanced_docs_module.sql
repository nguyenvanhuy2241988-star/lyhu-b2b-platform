-- Migration: Advanced Documents Module (Folders, Files, Activity)
-- Replaces previous simpler 'docs' module if present.

-- 1. Drop previous tables if they exist (Cleanup)
drop table if exists public.document_files cascade;
drop table if exists public.documents cascade;
drop table if exists public.document_categories cascade;

-- 2. Create New Tables

-- 2.1 documents_folders
create table if not exists public.documents_folders (
    id uuid primary key default gen_random_uuid(),
    parent_id uuid references public.documents_folders(id) on delete set null,
    name text not null,
    slug text null,
    guidance_md text not null default '',
    visibility text not null default 'all', -- 'all' | 'roles' | 'private'
    allowed_roles text[] not null default '{}'::text[],
    owner_id uuid references auth.users(id),
    created_by uuid not null default auth.uid() references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    is_deleted boolean not null default false
);

-- 2.2 documents_files
create table if not exists public.documents_files (
    id uuid primary key default gen_random_uuid(),
    folder_id uuid not null references public.documents_folders(id),
    title text not null,
    original_name text not null,
    mime_type text not null,
    size_bytes bigint not null default 0,
    storage_bucket text not null default 'lyhu-docs',
    storage_path text not null,
    visibility text not null default 'inherit', -- 'inherit'|'all'|'roles'|'private'
    allowed_roles text[] not null default '{}'::text[],
    owner_id uuid references auth.users(id),
    created_by uuid not null default auth.uid() references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    is_deleted boolean not null default false
);

-- 2.3 documents_activity
create table if not exists public.documents_activity (
    id bigserial primary key,
    entity_type text not null, -- 'folder'|'file'
    entity_id uuid not null,
    action text not null, -- 'create'|'rename'|'upload'|'move'|'delete'|'update_guidance'
    message text not null default '',
    actor_id uuid not null default auth.uid() references auth.users(id),
    created_at timestamptz not null default now()
);

-- 3. Indexes
create index if not exists idx_docs_folders_parent on public.documents_folders(parent_id);
create index if not exists idx_docs_folders_is_deleted on public.documents_folders(is_deleted);
create index if not exists idx_docs_files_folder on public.documents_files(folder_id);
create index if not exists idx_docs_files_is_deleted on public.documents_files(is_deleted);
-- optional text search index
create extension if not exists pg_trgm;
create index if not exists idx_docs_files_title_trgm on public.documents_files using gin (title gin_trgm_ops);

-- 4. Triggers (updated_at)
drop trigger if exists trg_docs_folders_updated_at on public.documents_folders;
create trigger trg_docs_folders_updated_at
before update on public.documents_folders
for each row execute function public.set_updated_at();

drop trigger if exists trg_docs_files_updated_at on public.documents_files;
create trigger trg_docs_files_updated_at
before update on public.documents_files
for each row execute function public.set_updated_at();

-- 5. RLS
alter table public.documents_folders enable row level security;
alter table public.documents_files enable row level security;
alter table public.documents_activity enable row level security;

-- Helper to check role (reusing previous or defining new if missing)
-- Assuming public.current_user_role() exists from previous migration or define it here
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Policies: Folders
drop policy if exists "Folders Select" on public.documents_folders;
create policy "Folders Select" on public.documents_folders
    for select using (
        auth.role() = 'authenticated' AND is_deleted = false
        -- Advanced visibility checks can be added here (e.g. check roles)
    );

drop policy if exists "Folders Insert" on public.documents_folders;
create policy "Folders Insert" on public.documents_folders
    for insert with check ( auth.role() = 'authenticated' );

drop policy if exists "Folders Update Own/Admin" on public.documents_folders;
create policy "Folders Update Own/Admin" on public.documents_folders
    for update using (
        (auth.uid() = created_by) OR (public.current_user_role() in ('admin', 'manager'))
    );

-- Policies: Files
drop policy if exists "Files Select" on public.documents_files;
create policy "Files Select" on public.documents_files
    for select using (
        auth.role() = 'authenticated' AND is_deleted = false
    );

drop policy if exists "Files Insert" on public.documents_files;
create policy "Files Insert" on public.documents_files
    for insert with check ( auth.role() = 'authenticated' );

drop policy if exists "Files Update Own/Admin" on public.documents_files;
create policy "Files Update Own/Admin" on public.documents_files
    for update using (
        (auth.uid() = created_by) OR (public.current_user_role() in ('admin', 'manager'))
    );

-- Policies: Activity
drop policy if exists "Activity Select" on public.documents_activity;
create policy "Activity Select" on public.documents_activity
    for select using ( auth.role() = 'authenticated' );
    
drop policy if exists "Activity Insert" on public.documents_activity;
create policy "Activity Insert" on public.documents_activity
    for insert with check ( auth.role() = 'authenticated' );

-- 6. Storage Bucket (lyhu-docs)
insert into storage.buckets (id, name, public) 
values ('lyhu-docs', 'lyhu-docs', false) 
on conflict (id) do nothing;

drop policy if exists "Docs Bucket Select" on storage.objects;
create policy "Docs Bucket Select" on storage.objects
    for select using ( bucket_id = 'lyhu-docs' AND auth.role() = 'authenticated' );

drop policy if exists "Docs Bucket Insert" on storage.objects;
create policy "Docs Bucket Insert" on storage.objects
    for insert with check ( bucket_id = 'lyhu-docs' AND auth.role() = 'authenticated' );

drop policy if exists "Docs Bucket Delete" on storage.objects;
create policy "Docs Bucket Delete" on storage.objects
    for delete using ( 
        bucket_id = 'lyhu-docs' AND 
        (auth.uid() = owner OR public.current_user_role() in ('admin', 'manager')) 
    );

-- 7. Seed Data
-- Root Folders
do $$
declare
  root_id uuid;
begin
  if not exists (select 1 from public.documents_folders where name = 'Công ty') then
     insert into public.documents_folders (name, guidance_md, created_by)
     values ('Công ty', '# Tài liệu chung công ty\n\nNơi lưu trữ quy định, biểu mẫu.', (select id from auth.users limit 1))
     returning id into root_id;

     if root_id is not null then
        insert into public.documents_folders (name, parent_id, created_by) values 
        ('Sản phẩm', root_id, (select id from auth.users limit 1)),
        ('Marketing', root_id, (select id from auth.users limit 1)),
        ('Nhân sự', root_id, (select id from auth.users limit 1)),
        ('Báo giá', root_id, (select id from auth.users limit 1));
     end if;
  end if;
end $$;
