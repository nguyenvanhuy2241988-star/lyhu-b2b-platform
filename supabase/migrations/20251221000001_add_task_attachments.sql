-- Add attachments column to telesales_tasks
ALTER TABLE telesales_tasks
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
