-- SET ADMIN ROLE
-- Run this in Supabase SQL Editor

-- 1. Update the admin user (replace email with your admin email)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'lyhu.vn@gmail.com';  -- Change this to your admin email

-- 2. Verify the change
SELECT id, email, role FROM profiles WHERE role = 'admin';

-- 3. Show all roles for reference
SELECT email, role FROM profiles ORDER BY role;
