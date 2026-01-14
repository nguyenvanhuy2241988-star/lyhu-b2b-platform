-- Force update get_unified_tasks RPC to ensure owner visibility works
-- Date: 2026-01-15

CREATE OR REPLACE FUNCTION get_unified_tasks(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    source_type TEXT, -- 'deal' | 'task'
    title TEXT,
    customer_name TEXT,
    phone TEXT, 
    due_date TIMESTAMPTZ,
    status TEXT,
    priority TEXT,
    is_overdue BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- 1. From Deals (Scheduled Actions)
    SELECT 
        d.id,
        'deal'::TEXT as source_type,
        d.title,
        c.name as customer_name,
        c.phone, 
        d.next_action_at as due_date,
        d.status,
        d.priority,
        (d.next_action_at < NOW() AND d.status NOT IN ('won', 'lost')) as is_overdue
    FROM crm_deals d
    LEFT JOIN customers c ON d.customer_id = c.id
    WHERE d.next_action_at IS NOT NULL
    AND d.next_action_at BETWEEN p_start_date AND p_end_date
    AND (p_user_id IS NULL OR d.owner_user_id = p_user_id)

    UNION ALL

    -- 2. From Manual Tasks (Broadened Permissions)
    SELECT 
        t.id,
        'task'::TEXT as source_type,
        t.title,
        t.customer_name,
        t.phone, 
        t.due_date,
        t.status,
        t.priority,
        (t.due_date < NOW() AND t.status != 'done') as is_overdue
    FROM telesales_tasks t
    WHERE t.due_date IS NOT NULL
    AND t.due_date BETWEEN p_start_date AND p_end_date
    AND (
        p_user_id IS NULL 
        OR t.owner_id = p_user_id -- Primary Creator
        OR t.user_id = p_user_id -- Legacy Creator
        OR t.assigned_to = p_user_id -- Legacy Assignee
        OR t.leader_id = p_user_id -- Leader
        OR EXISTS ( -- Check Array Assignees
            SELECT 1 
            FROM unnest(t.assignee_ids) as aid 
            WHERE aid::text = p_user_id::text
        )
    )
    
    ORDER BY due_date ASC;
END;
$$;
