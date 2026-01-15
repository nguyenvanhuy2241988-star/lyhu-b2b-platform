-- g:\LYHU\Projects\LYHU-app\supabase\migrations\20260115080000_fix_unified_rpc_and_profiles.sql

-- 1. Fix Profiles RLS and Grant Permissions
-- This ensures Telesales users can see their teammates' names.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
TO authenticated 
USING ( true );

GRANT SELECT ON profiles TO authenticated;

-- 2. Update the RPC to include missing fields for participants information
-- This is critical for show assignee and leader on the Kanban cards.
DROP FUNCTION IF EXISTS get_unified_tasks(TIMESTAMPTZ, TIMESTAMPTZ, UUID);

CREATE OR REPLACE FUNCTION get_unified_tasks(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    source_type TEXT, 
    title TEXT,
    customer_name TEXT,
    phone TEXT, 
    due_date TIMESTAMPTZ,
    status TEXT,
    priority TEXT,
    is_overdue BOOLEAN,
    assignee_ids UUID[],
    leader_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- 1. From Deals
    SELECT 
        d.id,
        'deal'::TEXT,
        d.title,
        c.name,
        c.phone, 
        d.next_action_at,
        d.status,
        d.priority,
        (d.next_action_at < NOW() AND d.status NOT IN ('won', 'lost')),
        NULL::UUID[],
        NULL::UUID
    FROM crm_deals d
    LEFT JOIN customers c ON d.customer_id = c.id
    WHERE d.next_action_at IS NOT NULL
    AND d.next_action_at BETWEEN p_start_date AND p_end_date
    AND (p_user_id IS NULL OR d.owner_user_id = p_user_id)

    UNION ALL

    -- 2. From Manual Tasks
    SELECT 
        t.id,
        'task'::TEXT,
        t.title,
        t.customer_name,
        t.phone, 
        t.due_date,
        t.status,
        t.priority,
        (t.due_date < NOW() AND t.status != 'done'),
        t.assignee_ids,
        t.leader_id
    FROM telesales_tasks t
    WHERE t.due_date IS NOT NULL
    AND t.due_date BETWEEN p_start_date AND p_end_date
    AND (
        p_user_id IS NULL 
        OR t.owner_id = p_user_id
        OR t.user_id = p_user_id
        OR t.assigned_to = p_user_id
        OR t.leader_id = p_user_id
        OR EXISTS (
            SELECT 1 
            FROM unnest(t.assignee_ids) as aid 
            WHERE aid::text = p_user_id::text
        )
    )
    
    ORDER BY due_date ASC;
END;
$$;
