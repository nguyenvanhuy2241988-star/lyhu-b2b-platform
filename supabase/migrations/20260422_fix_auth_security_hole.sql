-- ==============================================================================
-- BẢN VÁ BẢO MẬT NGHIÊM TRỌNG (CRITICAL SECURITY PATCH)
-- Vấn đề: Tài khoản mới đăng nhập Google tự động được cấp quyền 'telesales'
-- Giải pháp: Đổi quyền mặc định cho mọi tài khoản mới thành 'customer' (Khách hàng)
-- ==============================================================================

-- 1. Xóa bỏ giá trị mặc định 'telesales' ở cấp độ bảng (Table Level)
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'customer';

-- 2. Cập nhật lại Trigger tự động tạo Profile khi có User mới đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- Khi một User mới đăng nhập/đăng ký qua Google/Email:
  -- Luôn luôn cấp quyền 'customer' mặc định để tránh lộ lọt dữ liệu CRM
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'customer')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  
  RETURN new;
END; 
$$;
