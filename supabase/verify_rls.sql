-- Verify Tables and RLS
select tablename, rowsecurity 
from pg_tables 
where schemaname = 'public' 
  and tablename in ('leads', 'orders', 'earnings');

-- Verify Policies
select schemaname, tablename, policyname, cmd, roles, qual, with_check 
from pg_policies 
where schemaname = 'public' 
  and tablename in ('leads', 'orders', 'earnings');
