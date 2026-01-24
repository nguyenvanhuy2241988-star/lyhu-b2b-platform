-- Create table for holding raw leads from Marketing Bot
create table if not exists marketing_leads_staging (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Source info
  source varchar not null, -- 'facebook_profile', 'facebook_group', 'zalo', etc.
  source_id varchar, -- UID or Message ID
  
  -- Raw Data
  name varchar,
  phone varchar,
  profile_url varchar,
  raw_data jsonb default '{}'::jsonb, -- Store full scraped object here
  
  -- Status
  status varchar default 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason varchar,
  
  -- Quality Score (Optional AI feature)
  quality_score int default 0
);

-- RLS
alter table marketing_leads_staging enable row level security;

-- Drop policy if exists to allow re-running the script
drop policy if exists "Enable all access for authenticated users" on marketing_leads_staging;

create policy "Enable all access for authenticated users" 
on marketing_leads_staging for all 
to authenticated 
using (true) 
with check (true);

-- Realtime (Safe Add)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'marketing_leads_staging') then
    alter publication supabase_realtime add table marketing_leads_staging;
  end if;
end $$;
