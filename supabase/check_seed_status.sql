-- =====================================================
-- DIAGNOSTIC: Check if seed data was created
-- =====================================================

-- 1. Check total tasks
SELECT COUNT(*) as total_tasks FROM telesales_tasks;

-- 2. Check demo tasks specifically
SELECT COUNT(*) as demo_tasks FROM telesales_tasks WHERE note LIKE '%DEMO%';

-- 3. Check your current user
SELECT 
    auth.uid() as current_user_id,
    p.email as current_email,
    p.role as current_role
FROM profiles p
WHERE p.id = auth.uid();

-- 4. Check tasks for current user
SELECT 
    COUNT(*) as my_tasks
FROM telesales_tasks
WHERE user_id = auth.uid() OR assigned_to = auth.uid();

-- 5. See sample tasks (if any)
SELECT 
    id,
    title,
    status,
    priority,
    user_id,
    assigned_to,
    customer_name
FROM telesales_tasks
WHERE note LIKE '%DEMO%'
LIMIT 5;

-- 6. Check if you have telesales users
SELECT 
    id,
    email,
    role
FROM profiles
WHERE role = 'telesales'
LIMIT 5;
