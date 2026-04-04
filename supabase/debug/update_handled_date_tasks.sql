-- 1. Thêm cột handled_date vào bảng telesales_tasks
ALTER TABLE telesales_tasks ADD COLUMN IF NOT EXISTS handled_date DATE;

-- 2. Cập nhật RPC get_unified_tasks để trả về thêm handled_date
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
    note TEXT,
    due_date TIMESTAMPTZ,
    status TEXT,
    priority TEXT,
    is_overdue BOOLEAN,
    assignee_ids UUID[],
    leader_id UUID,
    handled_date DATE,
    attachments JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        -- 1. From Deals
        SELECT 
            d.id AS id,
            'deal'::TEXT AS source_type,
            d.title AS title,
            c.name AS customer_name,
            c.phone AS phone,
            NULL::TEXT AS note,
            d.next_action_at AS due_date,
            d.status AS status,
            d.priority AS priority,
            (d.next_action_at < NOW() AND d.status NOT IN ('won', 'lost')) AS is_overdue,
            NULL::UUID[] AS assignee_ids,
            NULL::UUID AS leader_id,
            d.handled_date AS handled_date,
            NULL::JSONB AS attachments
        FROM crm_deals d
        LEFT JOIN customers c ON d.customer_id = c.id
        WHERE d.next_action_at IS NOT NULL
        AND d.next_action_at BETWEEN p_start_date AND p_end_date
        AND (p_user_id IS NULL OR d.owner_user_id = p_user_id)

        UNION ALL

        -- 2. From Manual Tasks
        SELECT 
            t.id AS id,
            'task'::TEXT AS source_type,
            t.title AS title,
            t.customer_name AS customer_name,
            t.phone AS phone,
            t.note AS note,
            t.due_date AS due_date,
            t.status AS status,
            t.priority AS priority,
            (t.due_date IS NOT NULL AND t.due_date < NOW() AND t.status != 'done') AS is_overdue,
            t.assignee_ids AS assignee_ids,
            t.leader_id AS leader_id,
            t.handled_date AS handled_date,
            t.attachments AS attachments
        FROM telesales_tasks t
        WHERE t.due_date IS NOT NULL AND t.due_date BETWEEN p_start_date AND p_end_date
        AND (
            p_user_id IS NULL 
            OR t.owner_id = p_user_id
            OR t.user_id = p_user_id
            OR t.assigned_to = p_user_id
            OR t.leader_id = p_user_id
            OR (t.assignee_ids IS NOT NULL AND p_user_id = ANY(t.assignee_ids))
        )
        AND NOT EXISTS (
            SELECT 1 FROM task_column_placements tcp
            JOIN task_user_columns tuc ON tuc.id = tcp.column_id
            WHERE tcp.task_id = t.id 
            AND tcp.user_id = p_user_id
            AND tuc.column_type = 'custom'
        )
    ) AS sub
    ORDER BY sub.due_date ASC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_unified_tasks TO authenticated;
