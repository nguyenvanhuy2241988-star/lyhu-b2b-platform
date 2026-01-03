-- CHECK RPC VERSION AND LOCKS
-- 1. Kiểm tra nội dung hàm hiện tại để xem có phải V5 không
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'get_or_create_direct_conversation';

-- 2. Kiểm tra xem có query nào đang bị treo không
SELECT pid, state, query, wait_event_type, wait_event, query_start
FROM pg_stat_activity 
WHERE state = 'active'
  AND query LIKE '%get_or_create_direct_conversation%'
  AND pid <> pg_backend_pid();

-- 3. Kiểm tra xem user có quyền execute không
SELECT has_function_privilege('authenticated', 'get_or_create_direct_conversation(uuid)', 'execute');
