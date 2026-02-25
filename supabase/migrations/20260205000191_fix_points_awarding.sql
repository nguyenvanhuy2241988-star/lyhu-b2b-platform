-- Migration: Fix Points Awarding Logic
-- Purpose: Create a secure RPC to allow users to receive points (since they cannot update their wallet directly via RLS).

CREATE OR REPLACE FUNCTION public.award_game_points(
    p_user_id uuid,
    p_amount int,
    p_type text,
    p_description text,
    p_ref_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Security Check: Only allow user to award points to themselves (for now, trust the client game logic)
    -- In a real anti-cheat system, this would be computed server-side or signed.
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Can only award points to self';
    END IF;

    -- Update Wallet (Upsert to handle new wallets)
    INSERT INTO public.user_wallets (user_id, balance, total_earned)
    VALUES (p_user_id, p_amount, GREATEST(p_amount, 0))
    ON CONFLICT (user_id) DO UPDATE
    SET balance = public.user_wallets.balance + p_amount,
        total_earned = CASE 
            WHEN p_amount > 0 THEN public.user_wallets.total_earned + p_amount 
            ELSE public.user_wallets.total_earned 
        END,
        last_updated = now();

    -- Log Transaction
    INSERT INTO public.point_transactions (user_id, amount, type, description, reference_id)
    VALUES (p_user_id, p_amount, p_type, p_description, p_ref_id);
END;
$$;
