-- MASTER FIX CHAT V5 (RPC Function Repair)
-- Sửa lại hàm RPC bị treo

-- 1. Drop hàm cũ và tạo lại
DROP FUNCTION IF EXISTS public.get_or_create_direct_conversation(uuid);

-- 2. Tạo hàm mới với logic đơn giản hơn
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    me uuid := auth.uid();
    low_id uuid;
    high_id uuid;
    key_str text;
    conv_id uuid;
BEGIN
    -- Check authentication
    IF me IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Check target
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'target_user_id is required';
    END IF;
    
    -- Cannot chat with yourself
    IF target_user_id = me THEN
        RAISE EXCEPTION 'Cannot create direct conversation with yourself';
    END IF;
    
    -- Create consistent direct_key (smaller UUID first)
    IF me < target_user_id THEN
        low_id := me;
        high_id := target_user_id;
    ELSE
        low_id := target_user_id;
        high_id := me;
    END IF;
    key_str := low_id::text || '_' || high_id::text;
    
    -- Try to find existing conversation
    SELECT id INTO conv_id
    FROM public.internal_conversations
    WHERE direct_key = key_str
    LIMIT 1;
    
    -- If not found, create new one
    IF conv_id IS NULL THEN
        INSERT INTO public.internal_conversations (type, direct_key, created_by, is_public, last_message_at)
        VALUES ('direct', key_str, me, false, now())
        RETURNING id INTO conv_id;
        
        -- Add both participants
        INSERT INTO public.internal_participants (conversation_id, user_id)
        VALUES (conv_id, me), (conv_id, target_user_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN conv_id;
END;
$$;

-- 3. Đảm bảo có unique constraint trên direct_key nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'internal_conversations_direct_key_key'
    ) THEN
        ALTER TABLE public.internal_conversations 
        ADD CONSTRAINT internal_conversations_direct_key_key UNIQUE (direct_key);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 4. Cấp quyền
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid) TO authenticated;
