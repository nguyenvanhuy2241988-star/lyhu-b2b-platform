-- Fix RLS: Allow users to read their own profile definitively
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- OPTIONAL: Allow check role without infinite recursion (if needed via function)
-- But for simple select, the above is enough.

-- Grant select permission just in case
GRANT SELECT ON public.profiles TO authenticated;
