-- SCRIPT TẠO 10 TÀI KHOẢN NỘI BỘ CHO TELESALES
-- Chạy script này trong Supabase SQL Editor (Mục SQL Editor -> New query)
-- Email: telesales01@lyhu.vn -> telesales10@lyhu.vn
-- Mật khẩu mặc định: Telesales@2026

do $$
declare
    i int;
    v_email text;
    v_password text := 'Telesales@2026';
    v_user_id uuid;
begin
    -- 1. Đảm bảo extension pgcrypto đã được bật để mã hóa mật khẩu
    create extension if not exists pgcrypto;

    -- 2. Vòng lặp tạo 10 tài khoản
    for i in 1..10 loop
        v_email := 'telesales' || lpad(i::text, 2, '0') || '@lyhu.vn';
        
        -- Kiểm tra xem user đã tồn tại chưa để tránh lỗi duplicate
        select id into v_user_id from auth.users where email = v_email;
        
        if v_user_id is null then
            -- Tạo user ID mới
            v_user_id := gen_random_uuid();
            
            -- Insert trực tiếp vào bảng auth.users của Supabase
            insert into auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at
            ) values (
                '00000000-0000-0000-0000-000000000000',
                v_user_id,
                'authenticated',
                'authenticated',
                v_email,
                crypt(v_password, gen_salt('bf')),
                now(),
                '{"provider":"email","providers":["email"]}',
                json_build_object('full_name', 'Telesales ' || lpad(i::text, 2, '0')),
                now(),
                now()
            );
            
            -- Insert vào auth.identities để đảm bảo user login được bằng email chuẩn
            insert into auth.identities (
                id,
                provider_id,
                user_id,
                identity_data,
                provider,
                last_sign_in_at,
                created_at,
                updated_at
            ) values (
                gen_random_uuid(),
                v_user_id::text,
                v_user_id,
                jsonb_build_object('sub', v_user_id, 'email', v_email, 'email_verified', true),
                'email',
                now(),
                now(),
                now()
            );

            -- Kiểm tra xem bảng public.profiles đã tự động tạo qua trigger chưa
            if exists (select 1 from public.profiles where id = v_user_id) then
                update public.profiles 
                set role = 'telesales',
                    full_name = 'Telesales ' || lpad(i::text, 2, '0')
                where id = v_user_id;
            else
                insert into public.profiles (id, email, role, full_name, created_at)
                values (v_user_id, v_email, 'telesales', 'Telesales ' || lpad(i::text, 2, '0'), now());
            end if;
            
            raise notice 'Đã tạo tài khoản: % (Mật khẩu: %)', v_email, v_password;
        else
            raise notice 'Tài khoản % đã tồn tại. Đang cập nhật role thành telesales...', v_email;
            
            -- Nếu tài khoản đã có, cập nhật lại role chắc chắn là telesales
            update public.profiles 
            set role = 'telesales'
            where id = v_user_id;
        end if;
    end loop;
end;
$$;
