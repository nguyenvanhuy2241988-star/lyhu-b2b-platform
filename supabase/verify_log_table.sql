-- =====================================================
-- BƯỚC 1.3: VERIFY LOG TABLE
-- Date: 2025-12-23
-- Purpose: Check if telesales_task_logs exists and is ready
-- =====================================================

-- STEP 1: Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'telesales_task_logs'
) as table_exists;

-- Expected: true

-- STEP 2: Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'telesales_task_logs'
ORDER BY ordinal_position;

-- Expected columns:
-- - id (uuid)
-- - task_id (uuid)
-- - user_id (uuid)
-- - log (text or jsonb)
-- - created_at (timestamp)

-- STEP 3: Count existing logs
SELECT COUNT(*) as total_logs FROM telesales_task_logs;

-- STEP 4: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'telesales_task_logs';

-- Expected: At least SELECT and INSERT policies for authenticated users

-- =====================================================
-- IF TABLE DOESN'T EXIST, CREATE IT:
-- =====================================================
-- Uncomment and run this if table_exists = false:

/*
CREATE TABLE IF NOT EXISTS telesales_task_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES telesales_tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    log TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE telesales_task_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view logs for tasks they own or are assigned to
CREATE POLICY "Users can view own task logs"
    ON telesales_task_logs FOR SELECT
    USING (
        user_id = auth.uid() OR
        task_id IN (
            SELECT id FROM telesales_tasks 
            WHERE user_id = auth.uid() OR assigned_to = auth.uid()
        )
    );

-- Policy: Users can insert logs for tasks they own or are assigned to
CREATE POLICY "Users can insert task logs"
    ON telesales_task_logs FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        task_id IN (
            SELECT id FROM telesales_tasks 
            WHERE user_id = auth.uid() OR assigned_to = auth.uid()
        )
    );
*/

-- =====================================================
-- VERIFICATION CHECKLIST
-- =====================================================
-- [ ] Table exists = true
-- [ ] Has correct columns
-- [ ] RLS policies exist
-- [ ] Can proceed to re-enable addLogSupabase function
