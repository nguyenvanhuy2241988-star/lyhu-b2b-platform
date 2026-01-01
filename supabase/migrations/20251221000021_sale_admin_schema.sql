-- Add 'sale_admin' role to profiles check constraint

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

-- Re-add constraint with 'sale_admin'
alter table public.profiles
add constraint profiles_role_check
check (role in ('admin', 'customer', 'sales', 'ctv', 'telesales', 'recruiter', 'warehouse', 'marketing', 'ecommerce', 'rnd', 'shipper', 'accountant', 'sale_admin'));

-- Create Quotations Table
create table if not exists public.quotations (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    customer_name text not null,
    total_amount numeric default 0,
    status text default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
    created_by uuid references auth.users(id),
    valid_until date
);

-- RLS
alter table public.quotations enable row level security;

create policy "Sale Admin and Sales can manage quotations"
  on public.quotations for all
  using (
    auth.uid() in (
      select id from public.profiles
      where role in ('admin', 'sale_admin', 'sales', 'telesales')
    )
  );
