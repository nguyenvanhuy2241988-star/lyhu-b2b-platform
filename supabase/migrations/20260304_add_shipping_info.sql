-- =============================================
-- Migration: Add shipping & packing info to orders
-- Date: 2026-03-04
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

-- 2. Update the get_orders_v3 RPC to include new fields
CREATE OR REPLACE FUNCTION get_orders_v3(
    p_role text DEFAULT NULL,
    p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    readable_id bigint,
    customer_name text,
    receiver_phone text,
    receiver_address text,
    total_amount numeric,
    status text,
    source text,
    created_at timestamptz,
    telesales_user_id uuid,
    customer_id uuid,
    lead_id uuid,
    items jsonb,
    notes text,
    payment_method text,
    vat numeric,
    flagged boolean,
    fraud_status text,
    ctv_id uuid,
    ctv_commission numeric,
    fulfillment_mode text,
    ctv_paid_at timestamptz,
    creator_name text,
    -- NEW shipping fields
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
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.readable_id,
        o.customer_name,
        o.receiver_phone,
        o.receiver_address,
        o.total_amount,
        o.status,
        o.source,
        o.created_at,
        o.telesales_user_id,
        o.customer_id,
        o.lead_id,
        o.items,
        o.notes,
        o.payment_method,
        o.vat,
        o.flagged,
        o.fraud_status,
        o.ctv_id,
        o.ctv_commission,
        o.fulfillment_mode,
        o.ctv_paid_at,
        COALESCE(p.full_name, '') as creator_name,
        -- NEW shipping fields
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
    LEFT JOIN profiles p ON o.telesales_user_id = p.id
    LEFT JOIN profiles packer ON o.packed_by = packer.id
    LEFT JOIN profiles approver ON o.approved_by = approver.id
    WHERE
        CASE
            WHEN p_role = 'admin' OR p_role = 'sale_admin' OR p_role = 'accountant' THEN true
            WHEN p_role = 'warehouse' THEN true
            WHEN p_user_id IS NOT NULL THEN o.telesales_user_id = p_user_id OR o.ctv_id = p_user_id
            ELSE true
        END
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create RPC to update shipping info 
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

-- 4. Update the update_order_status RPC to record approver
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id uuid,
    p_status text,
    p_approved_by uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE orders SET
        status = p_status,
        approved_by = CASE
            WHEN p_status = 'processing' AND p_approved_by IS NOT NULL THEN p_approved_by
            ELSE approved_by
        END,
        approved_at = CASE
            WHEN p_status = 'processing' AND p_approved_by IS NOT NULL AND approved_at IS NULL THEN NOW()
            ELSE approved_at
        END
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
