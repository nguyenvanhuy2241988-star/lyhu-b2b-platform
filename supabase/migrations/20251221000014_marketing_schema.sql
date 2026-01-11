-- Add 'marketing' role to profiles check constraint

do $$
declare
    con_name text;
begin
    -- Find the check constraint for 'role'
    select con.conname into con_name
    from pg_catalog.pg_constraint con
        inner join pg_catalog.pg_class rel on rel.oid = con.conrelid
        inner join pg_catalog.pg_namespace nsp on nsp.oid = con.connamespace
    where nsp.nspname = 'public'
      and rel.relname = 'profiles'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%role%';

    -- Drop it if exists
    if con_name is not null then
        execute format('alter table public.profiles drop constraint %I', con_name);
    end if;
end $$;

-- Re-add constraint with 'marketing'
alter table public.profiles
add constraint profiles_role_check
check (role in ('admin', 'customer', 'sales', 'ctv', 'telesales', 'recruiter', 'warehouse', 'marketing', 'ecommerce', 'rnd', 'shipper', 'accountant', 'sale_admin', 'livestream'));

-- Create Marketing Campaigns Table
create table if not exists public.marketing_campaigns (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  status text not null default 'planning' check (status in ('planning', 'active', 'completed', 'paused')),
  start_date date,
  end_date date,
  budget numeric(12, 2) default 0,
  channel text -- e.g. Facebook, Google, Offline
);

-- Create Marketing Posts Table
create table if not exists public.marketing_posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text,
  platform text not null check (platform in ('facebook', 'tiktok', 'website', 'zalo', 'other')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  scheduled_at timestamp with time zone,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null
);

-- Enable RLS
alter table public.marketing_campaigns enable row level security;
alter table public.marketing_posts enable row level security;

-- Policies
create policy "Marketing staff and admins can manage campaigns"
  on public.marketing_campaigns for all
  using (
    auth.uid() in (
      select id from public.profiles 
      where role in ('admin', 'marketing', 'sales') -- Sales might want to see? Let's give marketing & admin full control
    )
  );

create policy "Marketing staff and admins can manage posts"
  on public.marketing_posts for all
  using (
    auth.uid() in (
      select id from public.profiles 
      where role in ('admin', 'marketing')
    )
  );
