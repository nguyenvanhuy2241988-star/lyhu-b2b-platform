-- 1. Đảm bảo bảng profiles có đầy đủ các cột cần thiết
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Đảm bảo cột email tồn tại (nên có rồi nhưng verify cho chắc)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 3. Mở RLS cho bảng profiles (Cho phép mọi người đã đăng nhập nhìn thấy nhau)
-- Điều này cực kỳ quan trọng để module Chat có thể tìm kiếm đồng nghiệp.
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 4. Đảm bảo quyền thực thi cho các hàm RPC quan trọng
GRANT EXECUTE ON FUNCTION public.get_conversations_with_unread(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;

-- 5. Đảm bảo Realtime hoạt động cho bảng tin nhắn và hội thoại
DO $$
BEGIN
    -- Thêm bảng vào publication realtime nếu chưa có
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_participants;
EXCEPTION WHEN others THEN
    -- Table might already be in publication
    NULL;
END $$;
