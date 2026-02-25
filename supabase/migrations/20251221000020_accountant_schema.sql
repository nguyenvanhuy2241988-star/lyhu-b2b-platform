-- Add 'accountant' role to profiles check constraint

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

-- Re-add constraint with 'accountant'
alter table public.profiles
add constraint profiles_role_check
check (role in ('admin', 'customer', 'sales', 'ctv', 'telesales', 'recruiter', 'warehouse', 'marketing', 'ecommerce', 'rnd', 'shipper', 'accountant', 'sale_admin', 'livestream', 'manager', 'telesales_manager', 'hr_manager', 'leader', 'hr'));

-- Create Expenses Table
create table if not exists public.expenses (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    amount numeric not null,
    category text default 'operating' check (category in ('operating', 'marketing', 'salary', 'logistics', 'other')),
    status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_by uuid references auth.users(id),
    receipt_url text
);

-- RLS
alter table public.expenses enable row level security;

drop policy if exists "Accountants and Admin can manage expenses" on public.expenses;
create policy "Accountants and Admin can manage expenses"
  on public.expenses for all
  using (
    auth.uid() in (
      select id from public.profiles
      where role in ('admin', 'accountant')
    )
  );
