-- Migration: Admin RLS for Entertainment
-- Purpose: Allow Admins to Manage Games, Rewards, and Redemptions.

-- 1. Helper Function to Check Admin Role (if not exists)
-- It's safer to use the query directly or existing function.
-- Assuming public.profiles has 'role' column based on roles.ts and previous migrations.

-- 2. Reward Items: Admin Full Access
CREATE POLICY "Admin manage rewards" ON public.reward_store_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Game Config: Admin Update
CREATE POLICY "Admin update game config" ON public.entertainment_games
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Redemptions: Admin Update (Status)
CREATE POLICY "Admin manage redemptions" ON public.redemption_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow Admin to View All Redemptions (Already covered? No, prior policy was "Users view own")
CREATE POLICY "Admin view all redemptions" ON public.redemption_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow Admin to View All Wallets (Previously existed? "Admin views all" comment was in schema, 
-- but code was: FOR SELECT USING (auth.uid() = user_id); 
-- CHECK LINE 70 of phase3_points_schema.sql. It missed the OR admin part!)

DROP POLICY IF EXISTS "Users view own wallet" ON public.user_wallets;
CREATE POLICY "Users view own wallet" ON public.user_wallets 
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow Admin to adjust wallets (Update)
CREATE POLICY "Admin update wallets" ON public.user_wallets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
