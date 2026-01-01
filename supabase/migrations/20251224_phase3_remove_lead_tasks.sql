-- Phase 3: Clean up lead tasks
-- Migration: Option C - Delete lead tasks (redundant with Leads Queue)

BEGIN;

-- Delete all tasks with type='lead'
DELETE FROM telesales_tasks 
WHERE type = 'lead';

COMMIT;

-- Verification query (run after migration):
-- SELECT type, COUNT(*) FROM telesales_tasks GROUP BY type;
-- Expected: Only 'task' type should remain
