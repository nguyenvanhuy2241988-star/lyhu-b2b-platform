-- Force user to admin role to allow access to debug switcher

do $$
declare
    target_email text := 'nguyenvanhuy2241988@gmail.com';
    target_id uuid;
begin
    -- Check if user exists in auth.users
    select id into target_id from auth.users where email = target_email;

    if target_id is not null then
        -- Update or Insert into profiles
        insert into public.profiles (id, email, full_name, role)
        values (target_id, target_email, 'Nguyen Van Huy (Admin)', 'admin')
        on conflict (id) do update
        set role = 'admin';
        
        raise notice 'User % updated to admin role.', target_email;
    else
        raise notice 'User % not found in auth.users. Please sign up first.', target_email;
    end if;
end $$;
