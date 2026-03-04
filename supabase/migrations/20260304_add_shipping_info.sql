-- =============================================
-- Migration: Add shipping & packing info to orders
-- Date: 2026-03-04 (FIXED v3)
-- =============================================

-- 1. Add shipping & packing columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packed_by uuid REFERENCES profiles(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packed_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_boxes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_boxes int DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_weight_kg numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee numeric DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_note text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- 2. Drop ALL old get_orders_v3 overloads
DROP FUNCTION IF EXISTS public.get_orders_v3(text, uuid);
DROP FUNCTION IF EXISTS public.get_orders_v3(uuid, uuid, text, timestamptz, timestamptz, int);

-- 3. Recreate get_orders_v3 with correct 6-param signature + shipping fields
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
    vat_rate numeric,
    order_discount_percent numeric,
    creator_name text,
    -- Shipping fields
    shipping_carrier text,
    tracking_code text,
    packed_by uuid,
    packed_at timestamptz,
    shipping_boxes jsonb,
    total_boxes int,
    total_weight_kg numeric,
    shipping_fee numeric,
    shipping_note text,
    approved_by uuid,
    approved_at timestamptz,
    packed_by_name text,
    approved_by_name text
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
        COALESCE(o.vat_rate, 0) as vat_rate,
        COALESCE(o.order_discount_percent, 0) as order_discount_percent,
        creator.full_name as creator_name,
        -- Shipping fields
        o.shipping_carrier,
        o.tracking_code,
        o.packed_by,
        o.packed_at,
        o.shipping_boxes,
        o.total_boxes,
        o.total_weight_kg,
        o.shipping_fee,
        o.shipping_note,
        o.approved_by,
        o.approved_at,
        COALESCE(packer.full_name, '') as packed_by_name,
        COALESCE(approver.full_name, '') as approved_by_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN profiles creator ON o.telesales_user_id = creator.id
    LEFT JOIN profiles packer ON o.packed_by = packer.id
    LEFT JOIN profiles approver ON o.approved_by = approver.id
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

-- 4. Create RPC to update shipping info 
CREATE OR REPLACE FUNCTION update_order_shipping(
    p_order_id uuid,
    p_shipping_carrier text DEFAULT NULL,
    p_tracking_code text DEFAULT NULL,
    p_packed_by uuid DEFAULT NULL,
    p_shipping_boxes jsonb DEFAULT NULL,
    p_total_boxes int DEFAULT NULL,
    p_total_weight_kg numeric DEFAULT NULL,
    p_shipping_fee numeric DEFAULT NULL,
    p_shipping_note text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE orders SET
        shipping_carrier = COALESCE(p_shipping_carrier, shipping_carrier),
        tracking_code = COALESCE(p_tracking_code, tracking_code),
        packed_by = COALESCE(p_packed_by, packed_by),
        packed_at = CASE WHEN p_packed_by IS NOT NULL AND packed_at IS NULL THEN NOW() ELSE packed_at END,
        shipping_boxes = COALESCE(p_shipping_boxes, shipping_boxes),
        total_boxes = COALESCE(p_total_boxes, total_boxes),
        total_weight_kg = COALESCE(p_total_weight_kg, total_weight_kg),
        shipping_fee = COALESCE(p_shipping_fee, shipping_fee),
        shipping_note = COALESCE(p_shipping_note, shipping_note)
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
