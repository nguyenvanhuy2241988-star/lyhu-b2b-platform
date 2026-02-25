-- Migration: Fix get_direct_conversation RPC and Permissions
-- Created at: 2026-01-04 04:30

-- 1. Ensure tables have correct counts and indexes (optimization)
CREATE INDEX IF NOT EXISTS idx_internal_participants_user_id ON public.internal_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_participants_conv_id ON public.internal_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_internal_conversations_type ON public.internal_conversations(type);

-- 2. Create or Replace the RPC function with SECURITY DEFINER to bypass RLS issues during discovery
CREATE OR REPLACE FUNCTION get_direct_conversation(
    user_id_1 UUID,
    user_id_2 UUID
)
RETURNS TABLE (
    id UUID,
    type VARCHAR,
    name VARCHAR,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT c.id, c.type, c.name, c.created_at
    FROM internal_conversations c
    WHERE c.id IN (
        SELECT cp1.conversation_id
        FROM internal_participants cp1
        WHERE cp1.user_id = user_id_1
        
        INTERSECT
        
        SELECT cp2.conversation_id
        FROM internal_participants cp2
        WHERE cp2.user_id = user_id_2
    )
    AND c.type = 'direct'
    AND (
        SELECT COUNT(*)
        FROM internal_participants cp
        WHERE cp.conversation_id = c.id
    ) = 2
    LIMIT 1;
END;
$$;

-- 3. Grant access
GRANT EXECUTE ON FUNCTION get_direct_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_direct_conversation(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_direct_conversation(UUID, UUID) TO service_role;

COMMENT ON FUNCTION get_direct_conversation IS 'Finds a direct conversation between two users reliably.';
