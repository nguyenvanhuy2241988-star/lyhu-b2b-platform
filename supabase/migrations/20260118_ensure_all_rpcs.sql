-- ENSURE ALL RPCs EXIST (Rescue Script)
-- Defines: get_orders_v2, create_order_v2, update_order_v2, has_prior_orders, create_financial_transaction_v2
-- Run this to fix "404 Not Found" errors.

BEGIN;

-- CLEANUP: Drop potential ambiguous overrides
DROP FUNCTION IF EXISTS public.get_orders_v2(uuid, text, date, date); 
DROP FUNCTION IF EXISTS public.get_orders_v2(uuid, text, date, date, uuid);

-------------------------------------------------------------------------------
-- 1. GET ORDERS V2 (Reading)
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_orders_v2(
    p_user_id uuid DEFAULT NULL,
    p_role text DEFAULT NULL,
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_id uuid DEFAULT NULL -- Added p_id support for fetching single order
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    _current_uid uuid;
    _current_role text;
    _result jsonb;
BEGIN
    _current_uid := auth.uid();

    -- 1. Determine Role
    IF p_role IS NOT NULL THEN
        _current_role := p_role;
    ELSE
        -- Explicit qualification to avoid ambiguity with output columns
        SELECT profiles.role INTO _current_role 
        FROM public.profiles 
        WHERE profiles.id = _current_uid;
    END IF;

    -- 2. Query Orders
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', o.id,
            'readable_id', o.readable_id,
            'customer_id', o.customer_id,
            'customer_name', o.customer_name,
            'customer', (
                SELECT jsonb_build_object(
                    'phone', c.phone,
                    'address', c.address
                )
                FROM public.customers c 
                WHERE c.id = o.customer_id
            ),
            'telesales_user_id', o.telesales_user_id,
            'status', o.status,
            'total_amount', o.total_amount,
            'created_at', o.created_at,
            'source', o.source,
            'receiver_phone', (SELECT phone FROM public.customers c WHERE c.id = o.customer_id), 
            'receiver_address', (SELECT address FROM public.customers c WHERE c.id = o.customer_id),
            'items', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', oi.id,
                        'product_id', oi.product_id,
                        'product', (
                            SELECT jsonb_build_object(
                                'id', p.id,
                                'name', p.name,
                                'sku', p.sku
                            ) 
                            FROM public.products p 
                            WHERE p.id = oi.product_id
                        ),
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'discount', oi.discount,
                        'discount_type', oi.discount_type,
                        'is_gift', oi.is_gift
                    )
                )
                FROM public.order_items oi
                WHERE oi.order_id = o.id
            )
        )
    ) INTO _result
    FROM public.orders o
    WHERE 
        -- Role-based Filtering
        CASE 
            WHEN _current_role IN ('admin', 'accountant', 'sale_admin', 'warehouse') THEN TRUE
            WHEN _current_role = 'telesales' THEN o.telesales_user_id = _current_uid
            ELSE FALSE
        END
        AND (p_user_id IS NULL OR o.telesales_user_id = p_user_id)
        AND (p_start_date IS NULL OR o.created_at::date >= p_start_date)
        AND (p_end_date IS NULL OR o.created_at::date <= p_end_date)
        AND (p_id IS NULL OR o.id = p_id); -- Filter by ID if provided

    RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;

-------------------------------------------------------------------------------
-- 2. CREATE ORDER V2 (Creating)
-------------------------------------------------------------------------------
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
    _new_order_row orders%ROWTYPE;
BEGIN
    INSERT INTO orders (
        lead_id, customer_id, customer_name, telesales_user_id,
        status, total_amount, source, vat, note, payment_method
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

    IF jsonb_array_length(p_items) > 0 THEN
        INSERT INTO order_items (
            order_id, product_id, quantity, price, discount, discount_type, is_gift
        )
        SELECT 
            _order_id, (item->>'product_id')::uuid, (item->>'quantity')::int,
            (item->>'price')::numeric, COALESCE((item->>'discount')::numeric, 0),
            COALESCE(item->>'discount_type', 'amount'), COALESCE((item->>'is_gift')::boolean, false)
        FROM jsonb_array_elements(p_items) AS item;
    END IF;

    RETURN to_jsonb(_new_order_row);
END;
$$;

-------------------------------------------------------------------------------
-- 3. UPDATE ORDER V2 (Editing)
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_order_v2(
    p_order_id uuid,
    p_update_data jsonb,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    _updated_order orders%ROWTYPE;
BEGIN
    UPDATE orders
    SET 
        total_amount = COALESCE((p_update_data->>'total_amount')::numeric, total_amount),
        vat = COALESCE((p_update_data->>'vat')::numeric, vat),
        note = COALESCE(p_update_data->>'note', note),
        payment_method = COALESCE(p_update_data->>'payment_method', payment_method),
        customer_name = COALESCE(p_update_data->>'customer_name', customer_name),
        customer_id = COALESCE((p_update_data->>'customer_id')::uuid, customer_id),
        status = COALESCE(p_update_data->>'status', status)
    WHERE id = p_order_id
    RETURNING * INTO _updated_order;

    IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

    IF p_items IS NOT NULL AND jsonb_array_length(p_items) >= 0 THEN
        DELETE FROM order_items WHERE order_id = p_order_id;
        IF jsonb_array_length(p_items) > 0 THEN
            INSERT INTO order_items (
                order_id, product_id, quantity, price, discount, discount_type, is_gift
            )
            SELECT 
                p_order_id, (item->>'product_id')::uuid, (item->>'quantity')::int,
                (item->>'price')::numeric, COALESCE((item->>'discount')::numeric, 0),
                COALESCE(item->>'discount_type', 'amount'), COALESCE((item->>'is_gift')::boolean, false)
            FROM jsonb_array_elements(p_items) AS item;
        END IF;
    END IF;

    RETURN to_jsonb(_updated_order);
END;
$$;

-------------------------------------------------------------------------------
-- 4. HAS PRIOR ORDERS (Bonus Check)
-------------------------------------------------------------------------------
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
        SELECT 1 FROM orders 
        WHERE customer_id = p_customer_id
        AND (p_exclude_order_id IS NULL OR id != p_exclude_order_id)
    ) INTO _exists;
    RETURN _exists;
END;
$$;

-------------------------------------------------------------------------------
-- 5. CREATE FINANCIAL TRANSACTION (Bonus Insert)
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_financial_transaction_v2(
    p_user_id uuid,
    p_type text,
    p_category text,
    p_amount numeric,
    p_status text,
    p_reference_id uuid DEFAULT NULL,
    p_note text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
    INSERT INTO financial_transactions (
        user_id, type, category, amount, status, reference_id, note, metadata
    ) VALUES (
        p_user_id, p_type, p_category, p_amount, p_status, p_reference_id, p_note, p_metadata
    );
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating transaction: %', SQLERRM;
    RETURN false;
END;
$$;

-- GRANT EXECUTE PERMISSIONS
GRANT EXECUTE ON FUNCTION public.get_orders_v2 TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_order_v2 TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_order_v2 TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.has_prior_orders TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_financial_transaction_v2 TO authenticated, anon, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
