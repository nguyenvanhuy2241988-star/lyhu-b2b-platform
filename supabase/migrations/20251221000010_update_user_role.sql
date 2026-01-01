-- Change role for a specific user.
-- Replace 'ADD_YOUR_EMAIL_HERE' with the email of the user you want to be a Recruiter.

UPDATE public.profiles
SET role = 'recruiter'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'recruiter@lyhu.vn'; -- <--- CHANGE THIS EMAIL
