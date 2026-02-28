-- ============================================================
-- REDESIGN: Task Column System on Database
-- Replace localStorage columns with per-user DB columns
-- Add per-user task placements for column assignment
-- ============================================================

-- 1. Create task_user_columns table
CREATE TABLE IF NOT EXISTS task_user_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    column_type TEXT NOT NULL DEFAULT 'custom' 
        CHECK (column_type IN ('system_inbox', 'system_done', 'date_overdue', 'date_today', 'date_tomorrow', 'date_this_week', 'custom')),
    position INT NOT NULL DEFAULT 0,
    color TEXT,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Only one of each system/date column per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_system_columns 
ON task_user_columns(user_id, column_type) 
WHERE column_type != 'custom';

CREATE INDEX IF NOT EXISTS idx_columns_user ON task_user_columns(user_id);

-- 2. Create task_column_placements table
CREATE TABLE IF NOT EXISTS task_column_placements (
    task_id UUID NOT NULL REFERENCES telesales_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES task_user_columns(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_placements_user_column ON task_column_placements(user_id, column_id);
CREATE INDEX IF NOT EXISTS idx_placements_task ON task_column_placements(task_id);

-- 3. RLS
ALTER TABLE task_user_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_column_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own columns" ON task_user_columns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own placements" ON task_column_placements FOR ALL USING (auth.uid() = user_id);

-- 4. Function: Create default columns for a user
CREATE OR REPLACE FUNCTION create_default_task_columns(p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO task_user_columns (user_id, label, column_type, position) VALUES
        (p_user_id, 'Quá hạn',       'date_overdue',    0),
        (p_user_id, 'Hộp thư đến',   'system_inbox',   10),
        (p_user_id, 'Hôm nay',       'date_today',     20),
        (p_user_id, 'Ngày mai',      'date_tomorrow',  30),
        (p_user_id, 'Tuần này',      'date_this_week', 40),
        (p_user_id, 'Đã xong',       'system_done',    50)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger: auto-create columns when new profile is created
CREATE OR REPLACE FUNCTION trigger_create_default_columns()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_task_columns(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_default_columns ON profiles;
CREATE TRIGGER trg_create_default_columns
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_create_default_columns();

-- 6. RPC: Get tasks for a specific column (via placements)
-- IMPORTANT: For inbox/custom columns, exclude tasks with due_date in date column range
-- (those tasks are shown in date columns like Hôm nay, Ngày mai, etc.)
CREATE OR REPLACE FUNCTION get_column_tasks(
    p_column_id UUID,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS SETOF telesales_tasks AS $$
DECLARE
    v_column_type TEXT;
BEGIN
    -- Get column type
    SELECT column_type INTO v_column_type FROM task_user_columns WHERE id = p_column_id;

    IF v_column_type = 'system_done' THEN
        -- Done column: show ALL tasks placed here (regardless of due_date)
        RETURN QUERY
        SELECT t.*
        FROM telesales_tasks t
        JOIN task_column_placements p ON p.task_id = t.id
        WHERE p.user_id = auth.uid()
        AND p.column_id = p_column_id
        ORDER BY t."order" ASC NULLS LAST, t.created_at DESC
        LIMIT p_limit OFFSET p_offset;
    ELSE
        -- Inbox/Custom: EXCLUDE tasks whose due_date falls within date column ranges
        -- (past → 7 days from now). These tasks already appear in date columns.
        RETURN QUERY
        SELECT t.*
        FROM telesales_tasks t
        JOIN task_column_placements p ON p.task_id = t.id
        WHERE p.user_id = auth.uid()
        AND p.column_id = p_column_id
        AND (
            t.due_date IS NULL
            OR t.due_date::date > (CURRENT_DATE + INTERVAL '7 days')::date
        )
        ORDER BY t."order" ASC NULLS LAST, t.created_at DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Get task count for a column
CREATE OR REPLACE FUNCTION get_column_task_count(p_column_id UUID)
RETURNS INT AS $$
DECLARE
    result INT;
BEGIN
    SELECT COUNT(*)::INT INTO result
    FROM task_column_placements
    WHERE user_id = auth.uid() AND column_id = p_column_id;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: Move a task to a column (upsert placement)
CREATE OR REPLACE FUNCTION move_task_to_column(
    p_task_id UUID,
    p_column_id UUID
)
RETURNS void AS $$
BEGIN
    INSERT INTO task_column_placements (task_id, user_id, column_id)
    VALUES (p_task_id, auth.uid(), p_column_id)
    ON CONFLICT (task_id, user_id)
    DO UPDATE SET column_id = p_column_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: Create placements for all assignees (put in their inbox)
CREATE OR REPLACE FUNCTION create_task_placements(
    p_task_id UUID,
    p_user_ids UUID[]
)
RETURNS void AS $$
DECLARE
    uid UUID;
    inbox_col_id UUID;
BEGIN
    FOREACH uid IN ARRAY p_user_ids LOOP
        -- Ensure user has default columns
        PERFORM create_default_task_columns(uid);
        
        -- Find user's inbox column
        SELECT id INTO inbox_col_id
        FROM task_user_columns
        WHERE user_id = uid AND column_type = 'system_inbox'
        LIMIT 1;
        
        IF inbox_col_id IS NOT NULL THEN
            INSERT INTO task_column_placements (task_id, user_id, column_id)
            VALUES (p_task_id, uid, inbox_col_id)
            ON CONFLICT (task_id, user_id) DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DATA MIGRATION
-- ============================================================

-- 10. Create default columns for ALL existing users
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT id FROM profiles LOOP
        PERFORM create_default_task_columns(r.id);
    END LOOP;
END $$;

-- 11. Create placements for existing tasks
-- Each relevant user gets the task in their inbox (or done if task.status = 'done')

-- 11a. Placements for task owner (user_id)
INSERT INTO task_column_placements (task_id, user_id, column_id)
SELECT t.id, t.user_id, c.id
FROM telesales_tasks t
JOIN task_user_columns c ON c.user_id = t.user_id
WHERE t.user_id IS NOT NULL
AND c.column_type = CASE WHEN t.status = 'done' THEN 'system_done' ELSE 'system_inbox' END
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 11b. Placements for owner_id (if different from user_id)
INSERT INTO task_column_placements (task_id, user_id, column_id)
SELECT t.id, t.owner_id, c.id
FROM telesales_tasks t
JOIN task_user_columns c ON c.user_id = t.owner_id
WHERE t.owner_id IS NOT NULL AND t.owner_id != COALESCE(t.user_id, '00000000-0000-0000-0000-000000000000')
AND c.column_type = CASE WHEN t.status = 'done' THEN 'system_done' ELSE 'system_inbox' END
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 11c. Placements for assigned_to
INSERT INTO task_column_placements (task_id, user_id, column_id)
SELECT t.id, t.assigned_to, c.id
FROM telesales_tasks t
JOIN task_user_columns c ON c.user_id = t.assigned_to
WHERE t.assigned_to IS NOT NULL
AND c.column_type = CASE WHEN t.status = 'done' THEN 'system_done' ELSE 'system_inbox' END
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 11d. Placements for leader_id
INSERT INTO task_column_placements (task_id, user_id, column_id)
SELECT t.id, t.leader_id, c.id
FROM telesales_tasks t
JOIN task_user_columns c ON c.user_id = t.leader_id
WHERE t.leader_id IS NOT NULL
AND c.column_type = CASE WHEN t.status = 'done' THEN 'system_done' ELSE 'system_inbox' END
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 11e. Placements for assignee_ids array members
INSERT INTO task_column_placements (task_id, user_id, column_id)
SELECT t.id, a.uid, c.id
FROM telesales_tasks t
CROSS JOIN LATERAL unnest(t.assignee_ids) AS a(uid)
JOIN task_user_columns c ON c.user_id = a.uid
WHERE t.assignee_ids IS NOT NULL AND array_length(t.assignee_ids, 1) > 0
AND c.column_type = CASE WHEN t.status = 'done' THEN 'system_done' ELSE 'system_inbox' END
ON CONFLICT (task_id, user_id) DO NOTHING;

-- Enable Realtime on new tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'task_column_placements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.task_column_placements;
    END IF;
END $$;
