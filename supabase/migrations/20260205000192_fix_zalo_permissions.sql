-- Ensure authenticated users have full access to Zalo tables
GRANT ALL ON TABLE public.zalo_sync_accounts TO authenticated;
GRANT ALL ON TABLE public.zalo_messages TO authenticated;
GRANT ALL ON TABLE public.zalo_sync_accounts TO service_role;
GRANT ALL ON TABLE public.zalo_messages TO service_role;

-- Ensure RLS policies are permissive enough
DROP POLICY IF EXISTS "Allow authenticated full access accounts" ON public.zalo_sync_accounts;
CREATE POLICY "Allow authenticated full access accounts" ON public.zalo_sync_accounts
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated full access messages" ON public.zalo_messages;
CREATE POLICY "Allow authenticated full access messages" ON public.zalo_messages
    FOR ALL USING (auth.role() = 'authenticated');
