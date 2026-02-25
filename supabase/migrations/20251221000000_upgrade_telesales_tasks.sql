-- Upgrade telesales_tasks table
ALTER TABLE telesales_tasks
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS due_date timestamptz,
ADD COLUMN IF NOT EXISTS note text,
ADD COLUMN IF NOT EXISTS related_type text,
ADD COLUMN IF NOT EXISTS related_id uuid,
ADD COLUMN IF NOT EXISTS owner_id uuid DEFAULT auth.uid(),
ADD COLUMN IF NOT EXISTS order_index int DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create telesales_task_logs table
CREATE TABLE IF NOT EXISTS telesales_task_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid REFERENCES telesales_tasks(id) ON DELETE CASCADE,
    log jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE telesales_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE telesales_task_logs ENABLE ROW LEVEL SECURITY;

-- Policies for telesales_tasks
drop policy if exists "Users can view their own tasks or assigned tasks" on telesales_tasks;
CREATE POLICY "Users can view their own tasks or assigned tasks"
ON telesales_tasks FOR SELECT
USING (auth.uid() = owner_id OR auth.uid() = assigned_to);

drop policy if exists "Users can create their own tasks" on telesales_tasks;
CREATE POLICY "Users can create their own tasks"
ON telesales_tasks FOR INSERT
WITH CHECK (auth.uid() = owner_id OR auth.uid() = assigned_to);

drop policy if exists "Users can update their own tasks or assigned tasks" on telesales_tasks;
CREATE POLICY "Users can update their own tasks or assigned tasks"
ON telesales_tasks FOR UPDATE
USING (auth.uid() = owner_id OR auth.uid() = assigned_to);

drop policy if exists "Users can delete their own tasks" on telesales_tasks;
CREATE POLICY "Users can delete their own tasks"
ON telesales_tasks FOR DELETE
USING (auth.uid() = owner_id);

-- Policies for telesales_task_logs
drop policy if exists "Users can view logs for their tasks" on telesales_task_logs;
CREATE POLICY "Users can view logs for their tasks"
ON telesales_task_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM telesales_tasks
        WHERE telesales_tasks.id = telesales_task_logs.task_id
        AND (telesales_tasks.owner_id = auth.uid() OR telesales_tasks.assigned_to = auth.uid())
    )
);

drop policy if exists "Users can create logs for their tasks" on telesales_task_logs;
CREATE POLICY "Users can create logs for their tasks"
ON telesales_task_logs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM telesales_tasks
        WHERE telesales_tasks.id = telesales_task_logs.task_id
        AND (telesales_tasks.owner_id = auth.uid() OR telesales_tasks.assigned_to = auth.uid())
    )
);
