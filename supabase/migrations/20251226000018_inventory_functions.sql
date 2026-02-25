-- INVENTORY RPC FUNCTIONS (Logic xử lý kho)
-- Run this in Supabase SQL Editor

-- Helper to log transactions
CREATE OR REPLACE FUNCTION fn_log_inventory_transaction(
    p_warehouse_id uuid,
    p_product_id uuid,
    p_type text,
    p_quantity int,
    p_ref_type text,
    p_ref_id uuid,
    p_note text,
    p_user_id uuid
) RETURNS void AS $$
BEGIN
    INSERT INTO inventory_transactions (
        warehouse_id, product_id, type, quantity, 
        reference_type, reference_id, note, performed_by
    ) VALUES (
        p_warehouse_id, p_product_id, p_type, p_quantity, 
        p_ref_type, p_ref_id, p_note, p_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- 1. GIỮ HÀNG (Reserve Stock)
-- Dùng khi Sale/Khách tạo đơn hàng
CREATE OR REPLACE FUNCTION fn_reserve_stock(
    p_warehouse_id uuid,
    p_product_id uuid,
    p_quantity int,
    p_ref_id uuid, -- Order ID
    p_user_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_available int;
BEGIN
    -- Check availability
    SELECT quantity_available INTO v_available
    FROM inventory_levels
    WHERE warehouse_id = p_warehouse_id AND product_id = p_product_id
    FOR UPDATE; -- Lock row to prevent race condition

    IF v_available IS NULL THEN
        -- Auto-create record if not exists (Assume 0 stock)
        INSERT INTO inventory_levels (warehouse_id, product_id, quantity_on_hand, quantity_committed)
        VALUES (p_warehouse_id, p_product_id, 0, 0);
        v_available := 0;
    END IF;

    IF v_available < p_quantity THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không đủ hàng tồn kho khả dụng', 'available', v_available);
    END IF;

    -- Update inventory
    UPDATE inventory_levels
    SET quantity_committed = quantity_committed + p_quantity,
        updated_at = now()
    WHERE warehouse_id = p_warehouse_id AND product_id = p_product_id;

    -- Log transaction
    PERFORM fn_log_inventory_transaction(
        p_warehouse_id, p_product_id, 'reserve', p_quantity, 
        'order', p_ref_id, 'Giữ hàng cho đơn', p_user_id
    );

    RETURN jsonb_build_object('success', true, 'message', 'Đã giữ hàng thành công');
END;
$$ LANGUAGE plpgsql;

-- 2. NHẢ HÀNG (Release Stock)
-- Dùng khi Hủy đơn hàng hoặc Sửa giảm số lượng
CREATE OR REPLACE FUNCTION fn_release_stock(
    p_warehouse_id uuid,
    p_product_id uuid,
    p_quantity int,
    p_ref_id uuid,
    p_user_id uuid
) RETURNS jsonb AS $$
BEGIN
    UPDATE inventory_levels
    SET quantity_committed = GREATEST(0, quantity_committed - p_quantity),
        updated_at = now()
    WHERE warehouse_id = p_warehouse_id AND product_id = p_product_id;

    PERFORM fn_log_inventory_transaction(
        p_warehouse_id, p_product_id, 'release', p_quantity, 
        'order', p_ref_id, 'Hủy giữ hàng', p_user_id
    );

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- 3. XUẤT KHO (Ship Stock)
-- Dùng khi Đơn hàng hoàn tất/Giao hàng
CREATE OR REPLACE FUNCTION fn_ship_stock(
    p_warehouse_id uuid,
    p_product_id uuid,
    p_quantity int,
    p_ref_id uuid,
    p_user_id uuid
) RETURNS jsonb AS $$
BEGIN
    -- Reduce both On Hand and Committed
    -- Assumption: The stock was ALREADY Reserved. If not, we should just reduce On Hand?
    -- Logic: Standard flow is Reserve -> Ship. So we reduce Committed too.
    UPDATE inventory_levels
    SET quantity_on_hand = GREATEST(0, quantity_on_hand - p_quantity),
        quantity_committed = GREATEST(0, quantity_committed - p_quantity),
        updated_at = now()
    WHERE warehouse_id = p_warehouse_id AND product_id = p_product_id;

    PERFORM fn_log_inventory_transaction(
        p_warehouse_id, p_product_id, 'outbound', p_quantity, 
        'order', p_ref_id, 'Xuất kho giao hàng', p_user_id
    );

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- 4. NHẬP HÀNG (Add Stock)
-- Dùng cho Admin nhập kho
CREATE OR REPLACE FUNCTION fn_add_stock(
    p_warehouse_id uuid,
    p_product_id uuid,
    p_quantity int,
    p_user_id uuid,
    p_note text DEFAULT 'Nhập hàng mới'
) RETURNS jsonb AS $$
BEGIN
    INSERT INTO inventory_levels (warehouse_id, product_id, quantity_on_hand, quantity_committed)
    VALUES (p_warehouse_id, p_product_id, p_quantity, 0)
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET 
        quantity_on_hand = inventory_levels.quantity_on_hand + p_quantity,
        updated_at = now();

    PERFORM fn_log_inventory_transaction(
        p_warehouse_id, p_product_id, 'inbound', p_quantity, 
        'manual_adjust', null, p_note, p_user_id
    );

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

SELECT 'Inventory RPC Functions created successfully' as message;
