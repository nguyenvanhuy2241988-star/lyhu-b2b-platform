-- Add 'livestream' role to profiles check constraint

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

-- Re-add constraint with 'livestream'
alter table public.profiles
add constraint profiles_role_check
check (role in ('admin', 'customer', 'sales', 'ctv', 'telesales', 'recruiter', 'warehouse', 'marketing', 'ecommerce', 'rnd', 'shipper', 'accountant', 'sale_admin', 'livestream', 'manager', 'telesales_manager', 'hr_manager', 'leader', 'hr'));

-- Create Livestream Sessions Table
create table if not exists public.livestream_sessions (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    platform text check (platform in ('facebook', 'tiktok', 'shopee', 'other')),
    status text default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    host_id uuid references auth.users(id),
    total_orders integer default 0,
    total_revenue numeric default 0
);

-- RLS
alter table public.livestream_sessions enable row level security;

drop policy if exists "Livestream staff and Admin can manage sessions" on public.livestream_sessions;
create policy "Livestream staff and Admin can manage sessions"
  on public.livestream_sessions for all
  using (
    auth.uid() in (
      select id from public.profiles
      where role in ('admin', 'livestream', 'marketing')
    )
  );
