-- Add order-level discount percent column to orders table
-- and update RPCs to handle it

-- 1. Add column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_discount_percent numeric DEFAULT 0;

-- 2. Update create_order_v2 to include order_discount_percent
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
        payment_method,
        order_discount_percent
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
        COALESCE(p_order->>'payment_method', 'COD'),
        COALESCE((p_order->>'order_discount_percent')::numeric, 0)
    )
    RETURNING * INTO _new_order_row;

    _order_id := _new_order_row.id;
    _readable_id := _new_order_row.readable_id;

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

    RETURN to_jsonb(_new_order_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_v2 TO anon;
GRANT EXECUTE ON FUNCTION public.create_order_v2 TO service_role;

NOTIFY pgrst, 'reload schema';

-- Also update get_orders_v3 to include order_discount_percent
DROP FUNCTION IF EXISTS public.get_orders_v3(uuid, uuid, text, timestamptz, timestamptz, int);

CREATE OR REPLACE FUNCTION public.get_orders_v3(
    p_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_role text DEFAULT NULL,
    p_start_date timestamptz DEFAULT NULL,
    p_end_date timestamptz DEFAULT NULL,
    p_limit int DEFAULT 100
)
RETURNS TABLE (
    order_id uuid,
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
    items jsonb,
    payment_method text,
    note text,
    vat numeric,
    order_discount_percent numeric,
    creator_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    _current_uid uuid;
    _current_role text;
BEGIN
    _current_uid := auth.uid();
    
    IF p_role IS NULL THEN
        SELECT role INTO _current_role FROM public.profiles WHERE id = _current_uid;
    ELSE
        _current_role := p_role;
    END IF;

    IF _current_role IS NULL THEN _current_role := 'customer'; END IF;
    _current_role := LOWER(_current_role);

    RETURN QUERY
    SELECT 
        o.id as order_id,
        o.readable_id,
        o.status,
        o.total_amount,
        o.created_at,
        o.source,
        o.telesales_user_id,
        o.customer_id,
        o.lead_id,
        o.customer_name,
        jsonb_build_object(
            'phone', c.phone,
            'address', c.address
        ) as customer,
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(oi) || jsonb_build_object(
                        'product', jsonb_build_object(
                            'name', p.name, 
                            'sku', p.sku, 
                            'unit', p.unit
                        )
                    )
                )
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = o.id
            ), 
            '[]'::jsonb
        ) as items,
        o.payment_method,
        o.note,
        o.vat,
        COALESCE(o.order_discount_percent, 0) as order_discount_percent,
        creator.full_name as creator_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN profiles creator ON o.telesales_user_id = creator.id
    WHERE 
        (
            _current_role IN ('admin', 'accountant', 'sale_admin', 'warehouse', 'director', 'manager')
            OR
            (
                _current_role IN ('telesales', 'sales', 'ctv', 'ecommerce', 'marketing')
                AND 
                o.telesales_user_id = _current_uid
            )
        )
        AND (p_id IS NULL OR o.id = p_id)
        AND (p_user_id IS NULL OR o.telesales_user_id = p_user_id)
        AND (p_start_date IS NULL OR o.created_at >= p_start_date)
        AND (p_end_date IS NULL OR o.created_at <= p_end_date)
    ORDER BY o.created_at DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_orders_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_orders_v3 TO anon;
GRANT EXECUTE ON FUNCTION public.get_orders_v3 TO service_role;
