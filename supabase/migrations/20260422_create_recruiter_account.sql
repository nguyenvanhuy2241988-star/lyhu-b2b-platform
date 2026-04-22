-- Tạo tài khoản nội bộ cho Tuyển dụng mà không cần qua Google hay xác thực Email
-- Bước 1: Tạo User trong hệ thống Auth (Mật khẩu: Lyhu123456!)
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- 1. Chèn vào bảng auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', 
    new_user_id, 
    'authenticated', 
    'authenticated', 
    'tuyendung@lyhu.vn', 
    crypt('Lyhu123456!', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{}', 
    now(), 
    now(), 
    '', '', '', ''
  );

  -- 2. Cập nhật quyền (Role) thành Tuyển dụng (Recruiter) trong bảng profiles
  -- (Trigger handle_new_user đã tự động tạo profile ở trên, ta chỉ cần update)
  UPDATE public.profiles
  SET role = 'recruiter'
  WHERE id = new_user_id;

END $$;
