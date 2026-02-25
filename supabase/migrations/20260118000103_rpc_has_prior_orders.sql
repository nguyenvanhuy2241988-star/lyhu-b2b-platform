-- RPC: Check if customer has prior orders (for Bonus calculation)
-- Runs as Security Definer to bypass RLS on orders table.

CREATE OR REPLACE FUNCTION public.has_prior_orders(
    p_customer_id uuid,
    p_exclude_order_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    _exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM orders 
        WHERE customer_id = p_customer_id
        AND (p_exclude_order_id IS NULL OR id != p_exclude_order_id)
    ) INTO _exists;
    
    RETURN _exists;
END;
$$;

-- Grant Execute
GRANT EXECUTE ON FUNCTION public.has_prior_orders TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_prior_orders TO anon;
GRANT EXECUTE ON FUNCTION public.has_prior_orders TO service_role;

NOTIFY pgrst, 'reload schema';
