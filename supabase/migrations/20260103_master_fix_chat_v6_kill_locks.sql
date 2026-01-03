-- MASTER FIX CHAT V6 (KILL LOCKS & VERIFY)
-- Mục tiêu: Loại bỏ mọi query đang treo và kiểm tra quyền insert

-- 1. Kill tất cả các kết nối đang active (trừ kết nối hiện tại của bạn)
-- Điều này sẽ giải phóng mọi khóa (lock) trên bảng
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND datname = current_database()
  AND state = 'active'
  AND (query ILIKE '%get_or_create_direct_conversation%' OR query ILIKE '%internal_conversations%');

-- 2. Kiểm tra lại hàm RPC source code (để chắc chắn là V5)
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_or_create_direct_conversation';

-- 3. Kiểm tra Policies trên bảng internal_conversations
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'internal_conversations';

-- 4. Thêm quyền INSERT cho authenticated user vào internal_participants và internal_conversations
GRANT INSERT ON public.internal_conversations TO authenticated;
GRANT INSERT ON public.internal_participants TO authenticated;

-- 5. Đảm bảo Policy INSERT cho internal_conversations tồn tại
DROP POLICY IF EXISTS "Users can create conversations" ON public.internal_conversations;
CREATE POLICY "Users can create conversations"
ON public.internal_conversations FOR INSERT
TO authenticated
WITH CHECK (true); -- Cho phép tạo thoải mái, RPC sẽ lo logic

-- 6. Đảm bảo Policy INSERT cho internal_participants tồn tại
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON public.internal_participants;
CREATE POLICY "Users can add themselves to conversations"
ON public.internal_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.internal_conversations 
  WHERE id = conversation_id AND created_by = auth.uid()
));
