-- 20260103_master_fix_chat_v7_final.sql
-- GIẢI PHÁP DỨT ĐIỂM CHO HỆ THỐNG CHAT

BEGIN;

-- 1. DỌN DẸP POLICIES CŨ (TRÁNH XUNG ĐỘT)
DROP POLICY IF EXISTS "Users can view conversations they are in" ON public.internal_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.internal_conversations;
DROP POLICY IF EXISTS "Users can update conversations they are in" ON public.internal_conversations;
DROP POLICY IF EXISTS "chat_conv_insert" ON public.internal_conversations;
DROP POLICY IF EXISTS "chat_conv_select" ON public.internal_conversations;
DROP POLICY IF EXISTS "chat_conv_update" ON public.internal_conversations;

DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.internal_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.internal_participants;
DROP POLICY IF EXISTS "Users can update their own read status" ON public.internal_participants;
DROP POLICY IF EXISTS "chat_part_select" ON public.internal_participants;
DROP POLICY IF EXISTS "chat_part_insert" ON public.internal_participants;
DROP POLICY IF EXISTS "chat_part_update" ON public.internal_participants;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.internal_messages;
DROP POLICY IF EXISTS "chat_msg_select" ON public.internal_messages;
DROP POLICY IF EXISTS "chat_msg_insert" ON public.internal_messages;

-- 2. THIẾT LẬP RLS MỚI (KHÔNG ĐỆ QUY)

-- BẢNG: internal_conversations
CREATE POLICY "chat_conv_insert" ON public.internal_conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "chat_conv_select" ON public.internal_conversations FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.internal_participants WHERE conversation_id = internal_conversations.id AND user_id = auth.uid()));
CREATE POLICY "chat_conv_update" ON public.internal_conversations FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.internal_participants WHERE conversation_id = internal_conversations.id AND user_id = auth.uid()));

-- BẢNG: internal_participants
-- CHỐNG ĐỆ QUY: Dùng một query phụ đơn giản hơn
CREATE POLICY "chat_part_select" ON public.internal_participants FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR conversation_id IN (SELECT p2.conversation_id FROM public.internal_participants p2 WHERE p2.user_id = auth.uid()));
CREATE POLICY "chat_part_insert" ON public.internal_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "chat_part_update" ON public.internal_participants FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- BẢNG: internal_messages
CREATE POLICY "chat_msg_select" ON public.internal_messages FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.internal_participants WHERE conversation_id = internal_messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "chat_msg_insert" ON public.internal_messages FOR INSERT TO authenticated 
WITH CHECK (sender_id = auth.uid()); 

-- 3. CẤU HÌNH REALTIME & IDENTITY
DO $$
BEGIN
    -- Thêm bảng vào Publication (idempotent)
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_messages;
    EXCEPTION WHEN others THEN RAISE NOTICE 'Table already in publication';
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_conversations;
    EXCEPTION WHEN others THEN RAISE NOTICE 'Table already in publication';
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_participants;
    EXCEPTION WHEN others THEN RAISE NOTICE 'Table already in publication';
    END;
END $$;

ALTER TABLE public.internal_messages REPLICA IDENTITY FULL;
ALTER TABLE public.internal_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.internal_participants REPLICA IDENTITY FULL;

-- 4. PHÂN QUYỀN TRUY CẬP (GRANT)
GRANT ALL ON public.internal_messages TO authenticated;
GRANT ALL ON public.internal_conversations TO authenticated;
GRANT ALL ON public.internal_participants TO authenticated;

COMMIT;
