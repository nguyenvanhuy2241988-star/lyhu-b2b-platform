-- Helper script to switch a user's role to 'marketing'
-- Replace 'ADD_YOUR_EMAIL_HERE' with your actual email

UPDATE public.profiles
SET role = 'marketing'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'marketing@lyhu.vn'; -- <--- CHANGE THIS EMAIL
