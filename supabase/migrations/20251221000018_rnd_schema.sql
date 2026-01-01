-- Add 'rnd' role to profiles check constraint

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

-- Re-add constraint with 'rnd'
alter table public.profiles
add constraint profiles_role_check
check (role in ('admin', 'customer', 'sales', 'ctv', 'telesales', 'recruiter', 'warehouse', 'marketing', 'ecommerce', 'rnd'));

-- Tables for R&D (Projects & Samples)
create table if not exists public.rnd_projects (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    status text not null default 'ideation' check (status in ('ideation', 'testing', 'review', 'approved', 'rejected')),
    description text,
    assignee_id uuid references auth.users(id),
    priority text default 'normal'
);

create table if not exists public.rnd_samples (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    project_id uuid references public.rnd_projects(id) on delete set null,
    name text not null,
    status text not null default 'draft' check (status in ('draft', 'sent', 'received', 'testing', 'approved', 'rejected')),
    notes text,
    tracking_code text
);

-- RLS
alter table public.rnd_projects enable row level security;
alter table public.rnd_samples enable row level security;

create policy "R&D staff and admins can manage projects"
  on public.rnd_projects for all
  using (
    auth.uid() in (
      select id from public.profiles
      where role in ('admin', 'rnd')
    )
  );

create policy "R&D staff and admins can manage samples"
  on public.rnd_samples for all
  using (
    auth.uid() in (
      select id from public.profiles
      where role in ('admin', 'rnd')
    )
  );
