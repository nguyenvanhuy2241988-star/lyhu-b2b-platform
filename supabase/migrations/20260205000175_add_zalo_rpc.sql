-- Function to fetch messages bypassing RLS
CREATE OR REPLACE FUNCTION public.get_zalo_messages(p_account_id UUID)
RETURNS TABLE (
    id UUID,
    msg_id TEXT,
    content TEXT,
    sender_name TEXT,
    sender_id TEXT,
    direction TEXT,
    "timestamp" TIMESTAMPTZ, -- Quoted to avoid keyword conflict
    attachments JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner permissions
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
        zm."timestamp",
        zm.attachments
    FROM public.zalo_messages zm
    WHERE (p_account_id IS NULL OR zm.account_id = p_account_id)
    ORDER BY zm."timestamp" DESC
    LIMIT 100;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_zalo_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_zalo_messages TO service_role;
GRANT EXECUTE ON FUNCTION public.get_zalo_messages TO anon;
