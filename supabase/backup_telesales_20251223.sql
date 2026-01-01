-- =====================================================
-- BƯỚC 1.1: BACKUP DATABASE
-- Date: 2025-12-23
-- Purpose: Safety backup before schema changes
-- =====================================================

-- Step 1: Count total tasks (for verification)
SELECT 
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN type = 'task' THEN 1 END) as count_tasks,
    COUNT(CASE WHEN type = 'lead' THEN 1 END) as count_leads,
    COUNT(CASE WHEN type IS NULL THEN 1 END) as count_null_type,
    MIN(created_at) as oldest_task,
    MAX(created_at) as newest_task
FROM telesales_tasks;

-- Step 2: Export full data (copy results to save)
SELECT 
    id,
    user_id,
    assigned_to,
    title,
    customer_name,
    phone,
    status,
    priority,
    type,
    due_date,
    completed_at,
    note,
    attachments,
    lead_id,
    related_type,
    related_id,
    owner_id,
    order_index,
    created_at,
    updated_at
FROM telesales_tasks
ORDER BY created_at DESC;

-- Step 3: Check for task_type column (old column name)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'telesales_tasks' 
AND column_name IN ('type', 'task_type');

-- Step 4: Backup telesales_task_logs (if exists)
SELECT 
    COUNT(*) as total_logs,
    MIN(created_at) as oldest_log,
    MAX(created_at) as newest_log
FROM telesales_task_logs;

SELECT * FROM telesales_task_logs ORDER BY created_at DESC LIMIT 100;

-- =====================================================
-- VERIFICATION CHECKLIST
-- =====================================================
-- [ ] Đã copy kết quả Step 1 (total count)
-- [ ] Đã copy hoặc download kết quả Step 2 (all tasks)
-- [ ] Đã check Step 3 (column name = 'type' or 'task_type')
-- [ ] Đã copy kết quả Step 4 (logs backup)
-- [ ] Lưu file backup vào: C:\Users\Huy\Downloads\telesales_backup_20251223.txt

-- =====================================================
-- NOTES FOR ROLLBACK (if needed)
-- =====================================================
-- If something goes wrong, restore data from backup using:
-- 1. Copy backup data
-- 2. DELETE FROM telesales_tasks; (CAREFUL!)
-- 3. INSERT INTO telesales_tasks (columns...) VALUES (...);
