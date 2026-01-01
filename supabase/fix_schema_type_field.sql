-- =====================================================
-- BƯỚC 1.2: FIX SCHEMA - TYPE FIELD
-- Date: 2025-12-23
-- Purpose: Fix NULL types and prepare for code changes
-- =====================================================

-- BACKUP INFO:
-- Total: 15 tasks
-- - 4 tasks with type='task'
-- - 2 tasks with type='lead'
-- - 9 tasks with type=NULL ← NEED TO FIX

-- =====================================================
-- STEP 1: Fix NULL types in existing data
-- =====================================================

-- Set default type='task' for NULL types
UPDATE telesales_tasks
SET type = 'task'
WHERE type IS NULL;

-- Verify fix
SELECT 
    type,
    COUNT(*) as count
FROM telesales_tasks
GROUP BY type
ORDER BY type;

-- Expected result:
-- type  | count
-- ------+-------
-- lead  |   2
-- task  |  13   (4 existing + 9 fixed)

-- =====================================================
-- STEP 2: Verify column exists and is correct type
-- =====================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'telesales_tasks'
AND column_name = 'type';

-- Expected: 
-- column_name: type
-- data_type: text
-- is_nullable: YES

-- =====================================================
-- STEP 3: Check if old column 'task_type' exists
-- =====================================================

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'telesales_tasks'
AND column_name = 'task_type';

-- If this returns a row, we have BOTH columns (problem!)
-- If empty, good - only 'type' column exists

-- =====================================================
-- VERIFICATION CHECKLIST
-- =====================================================
-- [ ] Run Step 1: UPDATE completed
-- [ ] Run Step 2: Confirm 13 tasks, 2 leads
-- [ ] Run Step 3: Column is 'type' (not 'task_type')
-- [ ] Total = 15 tasks confirmed

-- =====================================================
-- NOTES
-- =====================================================
-- After this SQL fix, we'll update the code:
-- 1. Change all `task_type` to `type` in TypeScript
-- 2. Re-enable type field in createTaskSupabase
-- 3. Re-enable type field in updateTaskSupabase
