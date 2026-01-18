-- FIX RPC AMBIGUITY
-- The previous RPC failed because the output parameter 'id' conflicted with 'id' in the WHERE clause.
-- We fix this by fully qualifying table columns and using #variable_conflict use_column.

CREATE OR REPLACE FUNCTION public.get_orders_v2(
    p_user_id uuid DEFAULT NULL,
    p_role text DEFAULT NULL,
    p_start_date timestamptz DEFAULT NULL,
    p_end_date timestamptz DEFAULT NULL,
    p_limit int DEFAULT 100
)
RETURNS TABLE (
    id uuid,
    readable_id int,
    status text,
    total_amount numeric,
    created_at timestamptz,
    source text,
    telesales_user_id uuid,
    customer_id uuid,
    lead_id uuid,
    customer_name text,
    customer jsonb,
    items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
#variable_conflict use_column
DECLARE
    _current_uid uuid;
    _current_role text;
BEGIN
    -- 1. Detect Current User
    _current_uid := auth.uid();
    
    -- 2. Detect Role (if not provided)
    IF p_role IS NULL THEN
        -- FIX: Fully qualify 'profiles.id' to avoid ambiguity with output 'id'
        SELECT role INTO _current_role 
        FROM public.profiles 
        WHERE profiles.id = _current_uid;
    ELSE
        _current_role := p_role;
    END IF;

    -- Default to 'customer' if no role found
    IF _current_role IS NULL THEN
        _current_role := 'customer';
    END IF;

    -- 3. Return Query
    RETURN QUERY
    SELECT 
        o.id,
        o.readable_id,
        o.status,
        o.total_amount,
        o.created_at,
        o.source,
        o.telesales_user_id,
        o.customer_id,
        o.lead_id,
        o.customer_name,
        -- Construct Customer Object
        jsonb_build_object(
            'phone', c.phone,
            'address', c.address
        ) as customer,
        -- Construct Items Array
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(oi) || jsonb_build_object(
                        'product', jsonb_build_object('name', p.name, 'sku', p.sku)
                    )
                )
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = o.id
            ), 
            '[]'::jsonb
        ) as items
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE 
        -- 1. PERMISSION CHECK
        (
            _current_role IN ('admin', 'accountant', 'sale_admin', 'warehouse')
            OR
            (_current_role = 'telesales' AND o.telesales_user_id = _current_uid)
        )
        -- 2. FILTERS
        AND (p_user_id IS NULL OR o.telesales_user_id = p_user_id)
        AND (p_start_date IS NULL OR o.created_at >= p_start_date)
        AND (p_end_date IS NULL OR o.created_at <= p_end_date)
    ORDER BY o.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Grant Execute
GRANT EXECUTE ON FUNCTION public.get_orders_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_orders_v2 TO anon;
GRANT EXECUTE ON FUNCTION public.get_orders_v2 TO service_role;

-- Force Schema Reload
NOTIFY pgrst, 'reload schema';
