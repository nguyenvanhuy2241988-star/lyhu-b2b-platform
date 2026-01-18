-- RPC: Update Order (Bypass Permissions)
-- Allows updating order details and replacing items atomically.
-- Runs as Security Definer.

CREATE OR REPLACE FUNCTION public.update_order_v2(
    p_order_id uuid,
    p_update_data jsonb, -- { total_amount, vat, note, payment_method, customer_name, customer_id }
    p_items jsonb -- Array of new items
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    _updated_order orders%ROWTYPE;
BEGIN
    -- 1. Update Order Table
    UPDATE orders
    SET 
        total_amount = COALESCE((p_update_data->>'total_amount')::numeric, total_amount),
        vat = COALESCE((p_update_data->>'vat')::numeric, vat),
        note = COALESCE(p_update_data->>'note', note),
        payment_method = COALESCE(p_update_data->>'payment_method', payment_method),
        customer_name = COALESCE(p_update_data->>'customer_name', customer_name),
        customer_id = COALESCE((p_update_data->>'customer_id')::uuid, customer_id),
        status = COALESCE(p_update_data->>'status', status) -- Allow status update if passed
    WHERE id = p_order_id
    RETURNING * INTO _updated_order;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- 2. Replace Order Items (Delete all old, Insert new)
    -- Only if p_items is provided and not null
    IF p_items IS NOT NULL AND jsonb_array_length(p_items) >= 0 THEN
        DELETE FROM order_items WHERE order_id = p_order_id;
        
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
                p_order_id,
                (item->>'product_id')::uuid,
                (item->>'quantity')::int,
                (item->>'price')::numeric,
                COALESCE((item->>'discount')::numeric, 0),
                COALESCE(item->>'discount_type', 'amount'),
                COALESCE((item->>'is_gift')::boolean, false)
            FROM jsonb_array_elements(p_items) AS item;
        END IF;
    END IF;

    RETURN to_jsonb(_updated_order);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_v2 TO service_role;

NOTIFY pgrst, 'reload schema';
