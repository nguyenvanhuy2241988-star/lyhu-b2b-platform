-- Function to get unread counts for all conversations a user is in (Updated with Participant Details)
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
        ) as participants
    FROM internal_conversations c
    JOIN internal_participants p ON c.id = p.conversation_id
    WHERE p.user_id = p_user_id
    ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;
