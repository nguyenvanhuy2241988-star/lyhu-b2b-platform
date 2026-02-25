-- RPC: Create Order (Bypass Permissions)
-- This function runs as Security Definer (Admin) to allow inserting orders
-- with 'telesales_user_id' without triggering public.users permission errors.

CREATE OR REPLACE FUNCTION public.create_order_v2(
    p_order jsonb,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    _order_id uuid;
    _readable_id bigint;
    _new_order_row orders%ROWTYPE;
BEGIN
    -- 1. Insert into orders
    INSERT INTO orders (
        lead_id,
        customer_id,
        customer_name,
        telesales_user_id,
        status,
        total_amount,
        source,
        vat,
        note,
        payment_method
    )
    VALUES (
        (p_order->>'lead_id')::uuid,
        (p_order->>'customer_id')::uuid,
        p_order->>'customer_name',
        (p_order->>'telesales_user_id')::uuid,
        COALESCE(p_order->>'status', 'pending'),
        COALESCE((p_order->>'total_amount')::numeric, 0),
        COALESCE(p_order->>'source', 'CUSTOMER'),
        COALESCE((p_order->>'vat')::numeric, 0),
        p_order->>'note',
        COALESCE(p_order->>'payment_method', 'COD')
    )
    RETURNING * INTO _new_order_row;

    _order_id := _new_order_row.id;
    _readable_id := _new_order_row.readable_id;

    -- 2. Insert into order_items
    IF jsonb_array_length(p_items) > 0 THEN
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            price,
            discount,
            discount_type,
            is_gift
        )
        SELECT 
            _order_id,
            (item->>'product_id')::uuid,
            (item->>'quantity')::int,
            (item->>'price')::numeric,
            COALESCE((item->>'discount')::numeric, 0),
            COALESCE(item->>'discount_type', 'amount'),
            COALESCE((item->>'is_gift')::boolean, false)
        FROM jsonb_array_elements(p_items) AS item;
    END IF;

    -- 3. Return the created order as JSON
    -- We match the structure expected by the frontend (camelCase or snake_case depending on usage)
    -- The frontend uses `orderRes.json()` which usually returns snake_case from Supabase.
    RETURN to_jsonb(_new_order_row);
END;
$$;

-- Grant Execute
GRANT EXECUTE ON FUNCTION public.create_order_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_v2 TO anon;
GRANT EXECUTE ON FUNCTION public.create_order_v2 TO service_role;

-- Reload schema
NOTIFY pgrst, 'reload schema';
