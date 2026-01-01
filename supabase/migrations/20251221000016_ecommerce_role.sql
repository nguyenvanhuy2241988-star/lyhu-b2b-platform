-- Add 'ecommerce' role to profiles check constraint

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

-- Re-add constraint with 'ecommerce'
alter table public.profiles
add constraint profiles_role_check
check (role in ('admin', 'customer', 'sales', 'ctv', 'telesales', 'recruiter', 'warehouse', 'marketing', 'ecommerce'));

-- For V1, we don't strictly need new tables, but let's ensure 'profiles' is ready.
-- Future: ecommerce_orders table.
