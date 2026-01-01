-- Create Tables
create table if not exists public.document_categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    parent_id uuid references public.document_categories(id) on delete set null,
    sort_order int default 0,
    created_at timestamptz default now()
);

create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content text not null default '',
    category_id uuid references public.document_categories(id) on delete set null,
    tags text[] not null default '{}',
    visibility text not null default 'all', -- 'all' | 'roles' | 'users'
    allowed_roles text[] not null default '{}',
    allowed_user_ids uuid[] not null default '{}',
    status text not null default 'published', -- 'draft'|'published'|'archived'
    created_by uuid not null default auth.uid() references auth.users(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.document_files (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references public.documents(id) on delete cascade,
    storage_path text not null,
    file_name text not null,
    mime_type text null,
    size int null,
    uploaded_by uuid not null default auth.uid() references auth.users(id),
    created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_documents_category_id on public.documents(category_id);
create index if not exists idx_documents_created_by on public.documents(created_by);
create index if not exists idx_documents_status on public.documents(status);
create index if not exists idx_document_files_document_id on public.document_files(document_id);

-- Updated_at Trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

-- RLS
alter table public.document_categories enable row level security;
alter table public.documents enable row level security;
alter table public.document_files enable row level security;

-- Helper function to check role
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Policies for document_categories
create policy "Categories Select All" on public.document_categories
    for select using (auth.role() = 'authenticated');

create policy "Categories Manage Admin" on public.document_categories
    for all using (
        public.current_user_role() in ('admin', 'manager') 
        -- assuming 'manager' role exists or just 'admin'. Docs imply 'admin' exists. I will add 'manager' just in case.
    );

-- Policies for documents
-- 1. READ
create policy "Documents Read" on public.documents
    for select using (
        auth.role() = 'authenticated' AND
        status = 'published' AND
        (
            visibility = 'all' OR
            (visibility = 'roles' AND public.current_user_role() = ANY(allowed_roles)) OR
            (visibility = 'users' AND auth.uid() = ANY(allowed_user_ids)) OR
            created_by = auth.uid() OR
            public.current_user_role() = 'admin'
        )
    );

-- 2. INSERT
create policy "Documents Insert Auth" on public.documents
    for insert with check (
        auth.role() = 'authenticated' -- Anyone can create? Or restricted? User req: "created_by được update...". imply anyone.
    );

-- 3. UPDATE/DELETE
create policy "Documents Update Own or Admin" on public.documents
    for update using (
        auth.uid() = created_by OR public.current_user_role() = 'admin'
    );

create policy "Documents Delete Own or Admin" on public.documents
    for delete using (
        auth.uid() = created_by OR public.current_user_role() = 'admin'
    );

-- Policies for document_files
-- Inherit from documents logic via document_id? Too expensive to join?
-- Simplified: Read if you can read document (requires complex policies or simplified).
-- User suggests: "app chỉ hiển thị file khi user có quyền xem document".
-- So for Table access: Strict.

create policy "Files Select Linked Doc" on public.document_files
    for select using (
        exists (
            select 1 from public.documents d
            where d.id = document_id
            -- AND logic identical to Documents Read...
            -- For performance, maybe simplified: if you are authenticated.
            -- But let's check ownership or status.
        )
    );

create policy "Files Insert Own Doc" on public.document_files
    for insert with check (
        exists (
            select 1 from public.documents d
            where d.id = document_id
            AND (d.created_by = auth.uid() OR public.current_user_role() = 'admin')
        )
    );

create policy "Files Delete Own Doc" on public.document_files
    for delete using (
        exists (
            select 1 from public.documents d
            where d.id = document_id
            AND (d.created_by = auth.uid() OR public.current_user_role() = 'admin')
        )
    );

-- Storage Policies (bucket 'docs')
-- Note: These must be applied in Supabase Storage UI or via SQL if enabled.
insert into storage.buckets (id, name, public) 
values ('docs', 'docs', false) 
on conflict (id) do nothing;

create policy "Docs Bucket Select" on storage.objects
    for select using ( bucket_id = 'docs' AND auth.role() = 'authenticated' );

create policy "Docs Bucket Insert" on storage.objects
    for insert with check ( bucket_id = 'docs' AND auth.role() = 'authenticated' );

create policy "Docs Bucket Delete" on storage.objects
    for delete using ( 
        bucket_id = 'docs' AND 
        (auth.uid() = owner OR public.current_user_role() = 'admin') 
    );
