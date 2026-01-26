-- Migration: Phase 3 - Points System & Admin Config
-- Purpose: Support dynamic game settings, wallets, and reward store.

-- 1. Update Games Table with Config Column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entertainment_games' AND column_name = 'config') THEN
        ALTER TABLE public.entertainment_games ADD COLUMN config jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Update defaults for existing games
UPDATE public.entertainment_games 
SET config = '{"points_easy": 50, "points_medium": 100, "points_hard": 200, "daily_limit": 10}'::jsonb
WHERE code LIKE 'caro_%' OR code LIKE 'lyhu_bird_%';

-- 2. Reward Store Items (Admin Managed)
CREATE TABLE IF NOT EXISTS public.reward_store_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    cost integer NOT NULL DEFAULT 0,
    stock integer NOT NULL DEFAULT 0,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. User Wallets (Points Balance)
CREATE TABLE IF NOT EXISTS public.user_wallets (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    balance integer DEFAULT 0,
    total_earned integer DEFAULT 0,
    last_updated timestamptz DEFAULT now()
);

-- 4. Point Transactions (History)
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount integer NOT NULL, -- Positive for earn, Negative for spend
    type text NOT NULL, -- 'GAME_WIN', 'REDEEM', 'ADMIN_ADJUST', 'DAILY_GIFT'
    description text,
    reference_id text, -- e.g., game_code or reward_item_id
    created_at timestamptz DEFAULT now()
);

-- 5. Redemption Requests (When user buys item)
CREATE TABLE IF NOT EXISTS public.redemption_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id uuid REFERENCES public.reward_store_items(id),
    cost integer NOT NULL,
    status text DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'
    admin_note text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. RLS Policies
ALTER TABLE public.reward_store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_requests ENABLE ROW LEVEL SECURITY;

-- Reward Items: Public Read, Admin Write (Simulated by Auth check for now, allow all Auth to Read)
CREATE POLICY "Everyone view rewards" ON public.reward_store_items FOR SELECT USING (true);

-- User Wallets: Users view their own, Admin views all
CREATE POLICY "Users view own wallet" ON public.user_wallets 
    FOR SELECT USING (auth.uid() = user_id);

-- Transactions: Users view their own
CREATE POLICY "Users view own transactions" ON public.point_transactions 
    FOR SELECT USING (auth.uid() = user_id);
    
-- Redemptions: Users view/insert own
CREATE POLICY "Users view own requests" ON public.redemption_requests 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create requests" ON public.redemption_requests 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Functions & Triggers

-- Function to handle Reward Redemption (Atomic Transaction)
CREATE OR REPLACE FUNCTION public.redeem_reward(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cost integer;
    v_balance integer;
    v_user_id uuid;
    v_stock integer;
BEGIN
    v_user_id := auth.uid();
    
    -- Check item
    SELECT cost, stock INTO v_cost, v_stock FROM public.reward_store_items WHERE id = p_item_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;
    IF v_stock <= 0 THEN RAISE EXCEPTION 'Out of stock'; END IF;
    
    -- Check balance
    SELECT balance INTO v_balance FROM public.user_wallets WHERE user_id = v_user_id;
    IF v_balance IS NULL THEN v_balance := 0; END IF; -- Should have wallet via trigger, but safety check
    
    IF v_balance < v_cost THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
    
    -- Deduct Balance
    UPDATE public.user_wallets SET balance = balance - v_cost WHERE user_id = v_user_id;
    
    -- Record Transaction
    INSERT INTO public.point_transactions (user_id, amount, type, description, reference_id)
    VALUES (v_user_id, -v_cost, 'REDEEM', 'Redeemed item', p_item_id::text);
    
    -- Decrease Stock (Optimistic)
    UPDATE public.reward_store_items SET stock = stock - 1 WHERE id = p_item_id;
    
    -- Create Request
    INSERT INTO public.redemption_requests (user_id, item_id, cost, status)
    VALUES (v_user_id, p_item_id, v_cost, 'PENDING');
    
    RETURN '{"success": true}'::jsonb;
END;
$$;

-- Function to Initialize Wallet on User Creation (Optional, using trigger is better)
-- For now, we assume wallet is created on first access or lazily. 
-- Let's create a trigger for new users to be safe.
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id, balance, total_earned)
  VALUES (new.id, 0, 0)
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;

-- Trigger on auth.users (Standard Supabase pattern)
-- Note: Trigger creation on auth.users usually requires superuser/dashboard, might fail in SQL Editor if restricted.
-- Skipping automated trigger for auth.users to avoid permission error. App logic should ensure wallet exists (lazy create).
