-- Create table for holding raw leads from Marketing Bot
create table if not exists marketing_leads_staging (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  source varchar not null,
  source_id varchar,
  name varchar,
  phone varchar,
  profile_url varchar,
  raw_data jsonb default '{}'::jsonb,
  status varchar default 'pending',
  rejection_reason varchar,
  quality_score int default 0
);

-- RLS
alter table marketing_leads_staging enable row level security;

-- Drop old policy
drop policy if exists "Enable all access for authenticated users" on marketing_leads_staging;
drop policy if exists "Enable all access for public" on marketing_leads_staging;

-- Create New Policy for PUBLIC (Allows Anon script to insert)
create policy "Enable all access for public" 
on marketing_leads_staging for all 
to public 
using (true) 
with check (true);

-- Realtime
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'marketing_leads_staging') then
    alter publication supabase_realtime add table marketing_leads_staging;
  end if;
end $$;
