-- Migration: Unified Tasks & Realtime Leaderboard (Fix: DROP first to allow return type change)
-- Date: 2026-01-13
-- Description: RPCs for merging Deal actions with Tasks.
-- Fixes: Adds PHONE number and broadens Task permissions. Includes DROP to fix 42P13 error.

-- 1. DROP old function first (required when changing return type)
DROP FUNCTION IF EXISTS get_unified_tasks(TIMESTAMPTZ, TIMESTAMPTZ, UUID);

-- 2. Unified Tasks Function (Deals + Manual Tasks)
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
        OR t.user_id = p_user_id -- Creator
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

-- 2. Realtime Leaderboard Function (Unchanged)
CREATE OR REPLACE FUNCTION get_realtime_leaderboard(
    p_month INT,
    p_year INT
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    total_revenue NUMERIC,
    total_deals BIGINT,
    rank INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            d.owner_user_id,
            COALESCE(SUM(d.expected_value), 0) as revenue,
            COUNT(d.id) as deal_count
        FROM crm_deals d
        WHERE d.status = 'won'
        AND EXTRACT(MONTH FROM d.updated_at) = p_month
        AND EXTRACT(YEAR FROM d.updated_at) = p_year
        GROUP BY d.owner_user_id
    )
    SELECT 
        p.id as user_id,
        COALESCE(p.full_name, p.email, 'Unknown') as full_name,
        p.avatar_url,
        COALESCE(s.revenue, 0) as total_revenue,
        COALESCE(s.deal_count, 0) as total_deals,
        RANK() OVER (ORDER BY COALESCE(s.revenue, 0) DESC)::INT as rank
    FROM profiles p
    LEFT JOIN stats s ON p.id = s.owner_user_id
    WHERE p.role IN ('telesales', 'sales', 'sale_admin')
    ORDER BY total_revenue DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_unified_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION get_realtime_leaderboard TO authenticated;
