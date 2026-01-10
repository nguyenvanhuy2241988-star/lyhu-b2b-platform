-- Migration: Add Calendar Tasks RPC
-- Date: 2026-01-13
-- Description: Adds RPC to fetch scheduled tasks for the Calendar view

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
        d.name,
        d.customer_name,
        d.next_action_at,
        d.status,
        d.stage,
        d.priority
    FROM crm_deals d
    WHERE d.next_action_at IS NOT NULL
    AND d.next_action_at BETWEEN p_start_date AND p_end_date
    AND (p_user_id IS NULL OR d.owner_user_id = p_user_id)
    ORDER BY d.next_action_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_scheduled_tasks TO authenticated;
