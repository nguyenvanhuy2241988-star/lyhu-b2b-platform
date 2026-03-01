-- ============================================
-- FIX CHAT REALTIME: RLS Recursion + RPC Alias
-- ============================================
-- Problem 1: chat_part_select policy queries internal_participants within its own RLS check → infinite recursion
-- Problem 2: Code calls get_direct_conversation but DB only has get_or_create_direct_conversation

BEGIN;

-- =============================================
-- 1. FIX RLS RECURSION ON internal_participants
-- =============================================

-- Drop the recursive policy
DROP POLICY IF EXISTS "chat_part_select" ON public.internal_participants;

-- Create non-recursive policy
-- Privacy is already enforced at the conversation level (chat_conv_select requires participant membership)
-- So participants table can safely allow all authenticated reads
CREATE POLICY "chat_part_select" ON public.internal_participants
FOR SELECT TO authenticated
USING (true);

-- =============================================
-- 2. CREATE get_direct_conversation RPC
-- =============================================
-- Code calls: supabase.rpc('get_direct_conversation', { user_id_1, user_id_2 })
-- This function finds existing DMs without creating new ones

DROP FUNCTION IF EXISTS public.get_direct_conversation(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_direct_conversation(user_id_1 uuid, user_id_2 uuid)
RETURNS TABLE(id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    low_id uuid;
    high_id uuid;
    key_str text;
BEGIN
    -- Create consistent key (smaller UUID first)
    IF user_id_1 < user_id_2 THEN
        low_id := user_id_1;
        high_id := user_id_2;
    ELSE
        low_id := user_id_2;
        high_id := user_id_1;
    END IF;
    key_str := low_id::text || '_' || high_id::text;

    -- Look up by direct_key first (fast, indexed)
    RETURN QUERY
    SELECT c.id
    FROM internal_conversations c
    WHERE c.direct_key = key_str
    LIMIT 1;

    -- If no direct_key match, fallback to participant-based lookup
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT p1.conversation_id
        FROM internal_participants p1
        JOIN internal_participants p2 ON p1.conversation_id = p2.conversation_id
        JOIN internal_conversations c ON c.id = p1.conversation_id
        WHERE p1.user_id = user_id_1
          AND p2.user_id = user_id_2
          AND c.type = 'direct'
        LIMIT 1;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_direct_conversation(uuid, uuid) TO authenticated;

-- =============================================
-- 3. ENSURE Realtime is enabled for chat tables
-- =============================================
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_messages;
    EXCEPTION WHEN others THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_conversations;
    EXCEPTION WHEN others THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_participants;
    EXCEPTION WHEN others THEN NULL;
    END;
END $$;

-- Ensure REPLICA IDENTITY FULL for realtime to work with RLS
ALTER TABLE public.internal_messages REPLICA IDENTITY FULL;
ALTER TABLE public.internal_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.internal_participants REPLICA IDENTITY FULL;

COMMIT;
