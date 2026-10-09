-- Migration: Fix task visibility in placement columns and remove stale unassigned placements
-- Date: 2026-10-10

-- 1. Clean up stale/orphaned placements where user is neither owner, creator, leader, nor assignee
DELETE FROM task_column_placements tcp
WHERE NOT EXISTS (
    SELECT 1 FROM telesales_tasks t
    WHERE t.id = tcp.task_id
    AND (
        t.user_id = tcp.user_id
        OR t.owner_id = tcp.user_id
        OR t.assigned_to = tcp.user_id
        OR t.leader_id = tcp.user_id
        OR (t.assignee_ids IS NOT NULL AND tcp.user_id = ANY(t.assignee_ids))
    )
);

-- 2. Update get_column_tasks to strictly check assignment/ownership
CREATE OR REPLACE FUNCTION get_column_tasks(
    p_column_id UUID,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS SETOF telesales_tasks AS $$
DECLARE
    v_column_type TEXT;
BEGIN
    SELECT column_type INTO v_column_type FROM task_user_columns WHERE id = p_column_id;

    IF v_column_type = 'system_inbox' THEN
        -- Inbox: EXCLUDE tasks with due_date in date column ranges (within 7 days)
        RETURN QUERY
        SELECT t.*
        FROM telesales_tasks t
        JOIN task_column_placements p ON p.task_id = t.id
        WHERE p.user_id = auth.uid()
        AND p.column_id = p_column_id
        AND (
            t.user_id = auth.uid()
            OR t.owner_id = auth.uid()
            OR t.assigned_to = auth.uid()
            OR t.leader_id = auth.uid()
            OR (t.assignee_ids IS NOT NULL AND auth.uid() = ANY(t.assignee_ids))
        )
        AND (
            t.due_date IS NULL
            OR t.due_date::date > (CURRENT_DATE + INTERVAL '7 days')::date
        )
        ORDER BY t."order" ASC NULLS LAST, t.created_at DESC
        LIMIT p_limit OFFSET p_offset;
    ELSE
        -- Done + Custom: show ALL tasks placed here (no date filter)
        RETURN QUERY
        SELECT t.*
        FROM telesales_tasks t
        JOIN task_column_placements p ON p.task_id = t.id
        WHERE p.user_id = auth.uid()
        AND p.column_id = p_column_id
        AND (
            t.user_id = auth.uid()
            OR t.owner_id = auth.uid()
            OR t.assigned_to = auth.uid()
            OR t.leader_id = auth.uid()
            OR (t.assignee_ids IS NOT NULL AND auth.uid() = ANY(t.assignee_ids))
        )
        ORDER BY t."order" ASC NULLS LAST, t.created_at DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
