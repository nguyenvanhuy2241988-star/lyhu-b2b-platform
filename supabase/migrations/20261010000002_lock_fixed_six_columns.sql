-- Migration: Lock 6 Fixed Standard Columns for All Users
-- Columns: Hộp thư đến (0), Hôm nay (10), Tuần này (20), Tháng này (30), Quá hạn (40), Hoàn thành (50)
-- Date: 2026-10-10

-- 1. Allow 'date_this_month' in column_type check constraint
ALTER TABLE task_user_columns DROP CONSTRAINT IF EXISTS task_user_columns_column_type_check;
ALTER TABLE task_user_columns ADD CONSTRAINT task_user_columns_column_type_check 
CHECK (column_type IN ('system_inbox', 'system_done', 'date_overdue', 'date_today', 'date_tomorrow', 'date_this_week', 'date_this_month', 'custom'));

-- 2. Update default columns function to create the 6 standard columns
CREATE OR REPLACE FUNCTION public.create_default_task_columns(p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.task_user_columns (user_id, label, column_type, position) VALUES
        (p_user_id, 'Hộp thư đến',   'system_inbox',    0),
        (p_user_id, 'Hôm nay',       'date_today',     10),
        (p_user_id, 'Tuần này',      'date_this_week', 20),
        (p_user_id, 'Tháng này',     'date_this_month',30),
        (p_user_id, 'Quá hạn',       'date_overdue',   40),
        (p_user_id, 'Hoàn thành',    'system_done',    50)
    ON CONFLICT (user_id, column_type) WHERE column_type != 'custom'
    DO UPDATE SET 
        label = EXCLUDED.label, 
        position = EXCLUDED.position,
        is_visible = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update get_column_tasks RPC
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
        -- Inbox: show tasks with NULL due_date OR due_date beyond the current month (and beyond 7 days)
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
            OR t.due_date::date > GREATEST(
                (CURRENT_DATE + INTERVAL '7 days')::date,
                (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
            )
        )
        ORDER BY t."order" ASC NULLS LAST, t.created_at DESC
        LIMIT p_limit OFFSET p_offset;
    ELSE
        -- Done + other placement columns: show ALL tasks placed here
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

-- 4. Ensure all existing users get the 6 standard columns
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id FROM auth.users LOOP
        PERFORM public.create_default_task_columns(u.id);
    END LOOP;
END $$;

DO $$
DECLARE
    p RECORD;
BEGIN
    FOR p IN SELECT id FROM public.profiles LOOP
        PERFORM public.create_default_task_columns(p.id);
    END LOOP;
END $$;

-- 5. Migrate task placements from custom or deprecated columns to system_inbox
UPDATE task_column_placements tcp
SET column_id = inbox_col.id
FROM task_user_columns inbox_col, task_user_columns current_col
WHERE tcp.user_id = inbox_col.user_id
AND inbox_col.column_type = 'system_inbox'
AND tcp.column_id = current_col.id
AND current_col.column_type NOT IN ('system_inbox', 'system_done');

-- 6. Safely remove deprecated custom and date_tomorrow columns
DELETE FROM task_user_columns WHERE column_type IN ('custom', 'date_tomorrow');

-- 7. Standardize positions and labels for all 6 columns
UPDATE task_user_columns SET label = 'Hộp thư đến', position = 0, is_visible = true WHERE column_type = 'system_inbox';
UPDATE task_user_columns SET label = 'Hôm nay', position = 10, is_visible = true WHERE column_type = 'date_today';
UPDATE task_user_columns SET label = 'Tuần này', position = 20, is_visible = true WHERE column_type = 'date_this_week';
UPDATE task_user_columns SET label = 'Tháng này', position = 30, is_visible = true WHERE column_type = 'date_this_month';
UPDATE task_user_columns SET label = 'Quá hạn', position = 40, is_visible = true WHERE column_type = 'date_overdue';
UPDATE task_user_columns SET label = 'Hoàn thành', position = 50, is_visible = true WHERE column_type = 'system_done';

-- 8. Auto-heal placements: active tasks to inbox, completed tasks to done
UPDATE task_column_placements tcp
SET column_id = done_col.id
FROM telesales_tasks t, task_user_columns done_col
WHERE tcp.task_id = t.id
AND t.status = 'done'
AND tcp.user_id = done_col.user_id
AND done_col.column_type = 'system_done';

UPDATE task_column_placements tcp
SET column_id = inbox_col.id
FROM telesales_tasks t, task_user_columns inbox_col
WHERE tcp.task_id = t.id
AND t.status != 'done'
AND tcp.user_id = inbox_col.user_id
AND inbox_col.column_type = 'system_inbox'
AND tcp.column_id != inbox_col.id;
