-- ========================================================
-- TẠO 10 TÀI KHOẢN TELESALES (SQL TRỰC TIẾP - BYPASS API)
-- Khắc phục lỗi "Database error querying schema" khi login
-- ========================================================

DO $$
DECLARE
    v_email text;
    v_password text := 'Telesales@2026';
    v_user_id uuid;
    i int;
BEGIN
    -- Đảm bảo extension pgcrypto đã được bật
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    FOR i IN 1..10 LOOP
        v_email := 'telesales' || lpad(i::text, 2, '0') || '@lyhu.vn';
        v_user_id := gen_random_uuid();
        
        -- Xóa triệt để nếu đã tồn tại để tránh rác
        DELETE FROM public.profiles WHERE email = v_email;
        DELETE FROM auth.identities WHERE provider = 'email' AND identity_data->>'email' = v_email;
        DELETE FROM auth.users WHERE email = v_email;

        -- 1. Chèn vào auth.users (Bao gồm đầy đủ các trường mới của Supabase GoTrue)
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            is_sso_user,
            is_anonymous,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf', 10)), -- Dùng cost 10 chuẩn GoTrue
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', 'Telesales ' || lpad(i::text, 2, '0')),
            false,
            false,
            false,
            now(),
            now(),
            '', '', '', ''
        );

        -- 2. Chèn vào auth.identities (Định dạng chuẩn)
        INSERT INTO auth.identities (
            id,
            provider_id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id::text,
            v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
            'email',
            now(),
            now(),
            now()
        );

        -- 3. Cập nhật quyền trong profiles (Ghi đè trigger nếu có)
        UPDATE public.profiles 
        SET role = 'telesales',
            full_name = 'Telesales ' || lpad(i::text, 2, '0')
        WHERE id = v_user_id;

    END LOOP;
END $$;
