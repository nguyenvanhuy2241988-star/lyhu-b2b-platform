
-- 5. KIỂM KÊ / ĐIỀU CHỈNH (Stock Adjustment)
-- Dùng để sửa lại tồn kho cho đúng thực tế (Kiểm kê)
CREATE OR REPLACE FUNCTION fn_adjust_stock(
    p_warehouse_id uuid,
    p_product_id uuid,
    p_new_quantity int,
    p_user_id uuid,
    p_note text DEFAULT 'Kiểm kê kho'
) RETURNS jsonb AS $$
DECLARE
    v_old_quantity int;
    v_diff int;
    v_type text;
BEGIN
    -- Get current quantity
    SELECT quantity_on_hand INTO v_old_quantity
    FROM inventory_levels
    WHERE warehouse_id = p_warehouse_id AND product_id = p_product_id;

    IF v_old_quantity IS NULL THEN
        v_old_quantity := 0;
        -- Insert new record if not exists
        INSERT INTO inventory_levels (warehouse_id, product_id, quantity_on_hand, quantity_committed)
        VALUES (p_warehouse_id, p_product_id, p_new_quantity, 0);
    ELSE
        -- Update existing
        UPDATE inventory_levels
        SET quantity_on_hand = p_new_quantity,
            updated_at = now()
        WHERE warehouse_id = p_warehouse_id AND product_id = p_product_id;
    END IF;

    -- Calculate difference
    v_diff := p_new_quantity - v_old_quantity;

    IF v_diff = 0 THEN
        RETURN jsonb_build_object('success', true, 'message', 'Không có thay đổi');
    END IF;

    -- Determine transaction type based on sign
    IF v_diff > 0 THEN
        v_type := 'adjustment_in'; -- Surplus
    ELSE
        v_type := 'adjustment_out'; -- Loss
    END IF;

    -- Log transaction
    PERFORM fn_log_inventory_transaction(
        p_warehouse_id, p_product_id, v_type, v_diff, 
        'audit', null, p_note || ' (Thay đổi từ ' || v_old_quantity || ' -> ' || p_new_quantity || ')', p_user_id
    );

    RETURN jsonb_build_object('success', true, 'message', 'Đã cập nhật tồn kho');
END;
$$ LANGUAGE plpgsql;

SELECT 'Adjustment Function created successfully' as message;
