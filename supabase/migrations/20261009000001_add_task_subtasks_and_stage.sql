-- Migration: Add subtasks, stage to telesales_tasks
ALTER TABLE IF EXISTS public.telesales_tasks
ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'in_progress';

COMMENT ON COLUMN public.telesales_tasks.subtasks IS 'Checklist / subtasks array: [{id, title, completed}]';
COMMENT ON COLUMN public.telesales_tasks.stage IS 'Workflow stage: not_started, in_progress, waiting, completed';
