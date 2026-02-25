-- Migration to support multiple assignees and a team leader for tasks
ALTER TABLE telesales_tasks
ADD COLUMN IF NOT EXISTS assignee_ids uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS leader_id uuid;

-- Drop existing policies to recreate them with new conditions
DROP POLICY IF EXISTS "Users can view their own tasks or assigned tasks" ON telesales_tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON telesales_tasks;
DROP POLICY IF EXISTS "Users can update their own tasks or assigned tasks" ON telesales_tasks;

-- New Policies
DROP POLICY IF EXISTS "Users can view their own, assigned, or led tasks" ON telesales_tasks;
CREATE POLICY "Users can view their own, assigned, or led tasks"
ON telesales_tasks FOR SELECT
USING (
    auth.uid() = owner_id 
    OR auth.uid() = assigned_to 
    OR auth.uid() = ANY(assignee_ids)
    OR auth.uid() = leader_id
);

DROP POLICY IF EXISTS "Users can create tasks" ON telesales_tasks;
CREATE POLICY "Users can create tasks"
ON telesales_tasks FOR INSERT
WITH CHECK (
    auth.uid() = owner_id 
    OR auth.uid() = assigned_to
    OR auth.uid() = ANY(assignee_ids)
    OR auth.uid() = leader_id
);

DROP POLICY IF EXISTS "Users can update their own, assigned, or led tasks" ON telesales_tasks;
CREATE POLICY "Users can update their own, assigned, or led tasks"
ON telesales_tasks FOR UPDATE
USING (
    auth.uid() = owner_id 
    OR auth.uid() = assigned_to
    OR auth.uid() = ANY(assignee_ids)
    OR auth.uid() = leader_id
);
