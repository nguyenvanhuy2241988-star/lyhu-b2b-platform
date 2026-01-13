-- Fix Data: Populate missing due_date for tasks with status today/tomorrow/this_week
-- Date: 2026-01-13
-- Description: Fixes tasks that are invisible in Telesales view because they lack a due_date required by the RPC filter.

UPDATE telesales_tasks 
SET due_date = COALESCE(created_at, NOW())
WHERE due_date IS NULL AND status = 'today';

UPDATE telesales_tasks 
SET due_date = COALESCE(created_at, NOW()) + interval '1 day'
WHERE due_date IS NULL AND status = 'tomorrow';

UPDATE telesales_tasks 
SET due_date = COALESCE(created_at, NOW()) + interval '2 days'
WHERE due_date IS NULL AND status = 'this_week';
