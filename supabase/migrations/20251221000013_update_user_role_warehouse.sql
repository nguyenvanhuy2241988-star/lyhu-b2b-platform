-- Helper script to switch a user's role to 'warehouse'
-- Replace 'ADD_YOUR_EMAIL_HERE' with your actual email

UPDATE public.profiles
SET role = 'warehouse'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'warehouse@lyhu.vn'; -- <--- CHANGE THIS EMAIL
