-- DIAGNOSTIC: Run this in SQL Editor to see why Telesales might be failing
-- 1. Check your own ID and Email first
SELECT id, email, role FROM profiles WHERE email IN ('admin@lyhu.vn', 'telesales@lyhu.vn');

-- 2. Check which conversations you are in
SELECT p.user_id, pr.email, c.id as conv_id, c.name, c.type
FROM internal_participants p
JOIN internal_conversations c ON p.conversation_id = c.id
JOIN profiles pr ON p.user_id = pr.id
WHERE pr.email IN ('admin@lyhu.vn', 'telesales@lyhu.vn')
ORDER BY c.name;

-- 3. Check message counts per conversation
SELECT conversation_id, count(*) as msg_count, max(created_at) as last_msg
FROM internal_messages
GROUP BY conversation_id;

-- 4. Check Realtime Publication status
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 5. Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'internal_%';

-- 6. Check mark_read function
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'mark_conversation_read';
