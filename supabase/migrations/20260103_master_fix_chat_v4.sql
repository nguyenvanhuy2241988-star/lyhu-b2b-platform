-- MASTER FIX CHAT V4 (PROFILES RLS + COLUMNS)
-- Bản này tập trung vào việc đảm bảo RLS profiles mở cho tất cả người đã đăng nhập

-- 1. XÓA TẤT CẢ POLICY CŨ TRÊN PROFILES (để tránh conflict)
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all_v3" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_can_read_all_profiles" ON public.profiles;

-- 2. TẠO POLICY MỚI CHO PHÉP TẤT CẢ NGƯỜI ĐĂNG NHẬP ĐỌC PROFILES
CREATE POLICY "authenticated_can_read_all_profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 3. ĐẢM BẢO RLS ĐƯỢC BẬT (nhưng với policy mở)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Đảm bảo các cột cần thiết tồn tại
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 5. Đảm bảo bảng internal_conversations có đầy đủ cột
ALTER TABLE public.internal_conversations ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.internal_conversations ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE public.internal_conversations ADD COLUMN IF NOT EXISTS direct_key text;
ALTER TABLE public.internal_conversations ADD COLUMN IF NOT EXISTS name text;

-- 6. Cấp quyền RPC
GRANT EXECUTE ON FUNCTION public.get_conversations_with_unread(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;

-- 7. TEST: Xác minh số lượng profiles có thể đọc được
-- Uncomment dòng dưới để test
-- SELECT COUNT(*) as profile_count FROM public.profiles;
