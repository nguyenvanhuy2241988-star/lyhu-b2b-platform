-- Migration: Fix Calendar RPC Columns
-- Date: 2026-01-13
-- Description: Fixes column names in get_scheduled_tasks (name->title, adds join to customers)

CREATE OR REPLACE FUNCTION get_scheduled_tasks(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    customer_name TEXT,
    next_action_at TIMESTAMPTZ,
    status TEXT,
    stage TEXT,
    priority TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title as name, -- Alias title to name for frontend compatibility
        c.name as customer_name, -- Get name from joined customers table
        d.next_action_at,
        d.status,
        d.stage,
        d.priority
    FROM crm_deals d
    LEFT JOIN customers c ON d.customer_id = c.id
    WHERE d.next_action_at IS NOT NULL
    AND d.next_action_at BETWEEN p_start_date AND p_end_date
    AND (p_user_id IS NULL OR d.owner_user_id = p_user_id)
    ORDER BY d.next_action_at ASC;
END;
$$;
