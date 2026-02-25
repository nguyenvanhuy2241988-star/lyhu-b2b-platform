-- Migration to add 'recruiter' role
-- 1. Update Check Constraint on profiles table

do $$
declare
    con_name text;
begin
    -- Find the name of the check constraint for 'role' column on 'profiles' table
    select con.conname into con_name
    from pg_catalog.pg_constraint con
        inner join pg_catalog.pg_class rel on rel.oid = con.conrelid
        inner join pg_catalog.pg_namespace nsp on nsp.oid = con.connamespace
    where nsp.nspname = 'public'
      and rel.relname = 'profiles'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%role%';

    -- Drop the constraint if it exists
    if con_name is not null then
        execute format('alter table public.profiles drop constraint %I', con_name);
    end if;
end $$;

-- 2. Re-add the constraint with 'recruiter' included (expanded to include future roles to prevent push errors on existing DB)
alter table public.profiles
add constraint profiles_role_check
check (role in ('admin', 'customer', 'sales', 'ctv', 'telesales', 'recruiter', 'warehouse', 'marketing', 'ecommerce', 'rnd', 'shipper', 'accountant', 'sale_admin', 'livestream', 'manager', 'telesales_manager', 'hr_manager', 'leader', 'hr'));

-- 3. (Optional) Create a policy update if necessary (but RLS usually relies onauth.uid())
