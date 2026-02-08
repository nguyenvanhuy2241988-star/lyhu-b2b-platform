-- check_db.sql
select column_name, data_type 
from information_schema.columns 
where table_name = 'profiles' 
and column_name = 'misa_employee_code';

select id, email, misa_employee_code 
from profiles 
limit 5;

select * from get_users_activity_stats() limit 1;
