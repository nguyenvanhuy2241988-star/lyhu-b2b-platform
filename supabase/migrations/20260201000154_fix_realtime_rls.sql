begin;

-- 1. Ensure Replica Identity is Full (Critical for RLS on Updates)
-- This ensures the 'old' row is available for RLS checks during updates
ALTER TABLE telesales_tasks REPLICA IDENTITY FULL;

-- 2. Drop potential conflicting/old policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON telesales_tasks;
DROP POLICY IF EXISTS "Users can view their own, assigned, or led tasks" ON telesales_tasks;

-- 3. Re-create a SINGLE, robust Select Policy
CREATE POLICY "Users can view their own, assigned, or led tasks"
ON telesales_tasks FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = owner_id
  OR auth.uid() = assigned_to 
  OR auth.uid() = leader_id
  -- Use @> operator for Array containment which is more efficient/standard for uuid[]
  OR assignee_ids @> ARRAY[auth.uid()]
);

commit;
