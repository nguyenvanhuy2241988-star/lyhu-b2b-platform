-- 1. Check RLS Status (For checking manually if needed, but we will force disable)
ALTER TABLE public.zalo_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.zalo_sync_accounts DISABLE ROW LEVEL SECURITY;

-- 2. Grant Explicit Select Permissions to EVERYONE (Anon + Authenticated)
GRANT SELECT ON public.zalo_messages TO anon;
GRANT SELECT ON public.zalo_messages TO authenticated;
GRANT SELECT ON public.zalo_messages TO service_role;

GRANT SELECT ON public.zalo_sync_accounts TO anon;
GRANT SELECT ON public.zalo_sync_accounts TO authenticated;
GRANT SELECT ON public.zalo_sync_accounts TO service_role;

-- 3. Just in case, create a policy that allows everything (if RLS is accidentally on)
DROP POLICY IF EXISTS "Allow ALL SELECT" ON public.zalo_messages;
CREATE POLICY "Allow ALL SELECT" ON public.zalo_messages FOR SELECT USING (true);
