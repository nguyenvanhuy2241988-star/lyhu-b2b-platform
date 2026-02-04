-- Drop valid function to clean up
DROP FUNCTION IF EXISTS public.get_zalo_messages(UUID);

-- Re-create with clear column aliases
CREATE OR REPLACE FUNCTION public.get_zalo_messages(p_account_id UUID)
RETURNS TABLE (
    id UUID,
    msg_id TEXT,
    content TEXT,
    sender_name TEXT,
    sender_id TEXT,
    direction TEXT,
    msg_timestamp TIMESTAMPTZ, -- Renamed to avoid keyword issues
    attachments JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Best practice for security definer
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        zm.id,
        zm.msg_id,
        zm.content,
        zm.sender_name,
        zm.sender_id,
        zm.direction,
        zm.timestamp as msg_timestamp,
        zm.attachments
    FROM public.zalo_messages zm
    WHERE zm.account_id = p_account_id
    ORDER BY zm.timestamp DESC
    LIMIT 100;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_zalo_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_zalo_messages TO service_role;
GRANT EXECUTE ON FUNCTION public.get_zalo_messages TO anon;
