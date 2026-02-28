-- ============================================================
-- FIX: Task visibility bug
-- Nguyên nhân: RLS policy thiếu điều kiện user_id
-- Kết quả: User không thấy task do mình tạo nếu owner_id NULL
-- ============================================================

-- 1. Đồng bộ dữ liệu cũ: gán owner_id = user_id cho các task thiếu owner_id
UPDATE telesales_tasks SET owner_id = user_id WHERE owner_id IS NULL AND user_id IS NOT NULL;

-- 2. Drop tất cả RLS policies hiện tại
DROP POLICY IF EXISTS "Users can view their own tasks or assigned tasks" ON telesales_tasks;
DROP POLICY IF EXISTS "Users can view their own, assigned, or led tasks" ON telesales_tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON telesales_tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON telesales_tasks;
DROP POLICY IF EXISTS "Users can update their own tasks or assigned tasks" ON telesales_tasks;
DROP POLICY IF EXISTS "Users can update their own, assigned, or led tasks" ON telesales_tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON telesales_tasks;

-- 3. Tạo lại với đầy đủ user_id
CREATE POLICY "Users can view tasks"
ON telesales_tasks FOR SELECT
USING (
    auth.uid() = user_id
    OR auth.uid() = owner_id
    OR auth.uid() = assigned_to
    OR auth.uid() = ANY(assignee_ids)
    OR auth.uid() = leader_id
);

CREATE POLICY "Users can create tasks"
ON telesales_tasks FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = owner_id
    OR auth.uid() = assigned_to
    OR auth.uid() = ANY(assignee_ids)
    OR auth.uid() = leader_id
);

CREATE POLICY "Users can update tasks"
ON telesales_tasks FOR UPDATE
USING (
    auth.uid() = user_id
    OR auth.uid() = owner_id
    OR auth.uid() = assigned_to
    OR auth.uid() = ANY(assignee_ids)
    OR auth.uid() = leader_id
);

CREATE POLICY "Users can delete tasks"
ON telesales_tasks FOR DELETE
USING (
    auth.uid() = user_id
    OR auth.uid() = owner_id
);
