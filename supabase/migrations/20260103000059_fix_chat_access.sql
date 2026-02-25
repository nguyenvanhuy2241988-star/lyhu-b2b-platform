-- 1. Cấp quyền thực thi cho RPC lấy danh sách hội thoại
GRANT EXECUTE ON FUNCTION public.get_conversations_with_unread(UUID) TO authenticated;

-- 2. Cấp quyền thực thi cho RPC đánh dấu đã đọc (nếu có)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_conversation_read') THEN
        GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID, UUID) TO authenticated;
    END IF;
END $$;

-- 3. Mở rộng RLS cho bảng profiles để nhân viên thấy nhau trong Chat
-- Xóa các policy cũ có thể gây xung đột nếu cần, hoặc thêm policy mới
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_all_authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 4. Đảm bảo realtime được bật cho các bảng liên quan (phòng trường hợp TRUNCATE làm mất config)
DO $$
BEGIN
    -- Thêm vào publication nếu chưa có
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'internal_participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_participants;
    END IF;
END $$;

-- 5. Fix lỗi logic RPC nếu mảng participants bị null
CREATE OR REPLACE FUNCTION get_conversations_with_unread(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    type TEXT,
    name TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT,
    participants JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.type,
        c.name,
        c.last_message,
        c.last_message_at,
        (
            SELECT count(*)
            FROM internal_messages m
            JOIN internal_participants p_sub ON m.conversation_id = p_sub.conversation_id
            WHERE p_sub.user_id = p_user_id
              AND m.conversation_id = c.id
              AND m.created_at > COALESCE(p_sub.last_read_at, '1970-01-01'::timestamptz)
              AND m.sender_id != p_user_id
        ) as unread_count,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'user_id', p1.user_id,
                        'full_name', prof.full_name,
                        'email', prof.email
                    )
                )
                FROM internal_participants p1
                LEFT JOIN profiles prof ON p1.user_id = prof.id
                WHERE p1.conversation_id = c.id
            ),
            '[]'::jsonb
        ) as participants
    FROM internal_conversations c
    JOIN internal_participants p ON c.id = p.conversation_id
    WHERE p.user_id = p_user_id
    ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;
