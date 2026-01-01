-- Legacy cleanup (just in case)
drop policy if exists "Docs Bucket Select" on storage.objects;
drop policy if exists "Docs Bucket Insert" on storage.objects;
drop policy if exists "Docs Bucket Delete" on storage.objects;

-- 1. Try to create the bucket (Note: If this fails, you must create it manually in Dashboard)
insert into storage.buckets (id, name, public)
values ('lyhu-docs', 'lyhu-docs', false)
on conflict (id) do nothing;

-- 2. Create Storage Policies (Simple Authenticated Access)
create policy "Docs Bucket Select" on storage.objects
    for select using ( bucket_id = 'lyhu-docs' AND auth.role() = 'authenticated' );

create policy "Docs Bucket Insert" on storage.objects
    for insert with check ( bucket_id = 'lyhu-docs' AND auth.role() = 'authenticated' );

create policy "Docs Bucket Delete" on storage.objects
    for delete using ( bucket_id = 'lyhu-docs' AND auth.role() = 'authenticated' );
