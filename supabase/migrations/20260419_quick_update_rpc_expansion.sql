-- UPDATE QUICK UPDATE PRODUCTS RPC
-- Run this in Supabase SQL Editor to support the new bulk fields

CREATE OR REPLACE FUNCTION fn_quick_update_products(
    p_product_ids uuid[],
    p_field text,
    p_value text,
    p_warehouse_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    v_pid uuid;
    v_count int := 0;
    v_wh_id uuid;
    v_user_id uuid;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();

    -- Resolve Warehouse ID
    IF p_warehouse_id IS NOT NULL THEN
        v_wh_id := p_warehouse_id;
    ELSE
        SELECT id INTO v_wh_id FROM warehouses WHERE code = 'MAIN-HN' LIMIT 1;
        IF v_wh_id IS NULL THEN
            -- Fallback to any active warehouse
             SELECT id INTO v_wh_id FROM warehouses WHERE status = 'active' LIMIT 1;
        END IF;
    END IF;

    -- CASE: STOCK UPDATE
    IF p_field = 'stock' THEN
        IF v_wh_id IS NULL THEN
             RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy kho hàng (MAIN-HN)');
        END IF;

        FOREACH v_pid IN ARRAY p_product_ids
        LOOP
            PERFORM fn_adjust_stock(
                v_wh_id,
                v_pid,
                p_value::int,
                v_user_id,
                'Cập nhật nhanh từ Admin'
            );
            v_count := v_count + 1;
        END LOOP;

    -- CASE: PRICE UPDATE
    ELSIF p_field = 'price' THEN
        UPDATE products
        SET price = p_value::numeric,
            updated_at = now()
        WHERE id = ANY(p_product_ids);
        GET DIAGNOSTICS v_count = ROW_COUNT;

    -- CASE: BRAND UPDATE
    ELSIF p_field = 'brand' THEN
        UPDATE products
        SET brand = p_value,
            updated_at = now()
        WHERE id = ANY(p_product_ids);
        GET DIAGNOSTICS v_count = ROW_COUNT;

    -- CASE: ITEMS PER CARTON UPDATE
    ELSIF p_field = 'items_per_carton' THEN
        UPDATE products
        SET items_per_carton = (CASE WHEN p_value = '' THEN NULL ELSE p_value::numeric END),
            updated_at = now()
        WHERE id = ANY(p_product_ids);
        GET DIAGNOSTICS v_count = ROW_COUNT;

    -- CASE: WEIGHT UPDATE
    ELSIF p_field = 'weight' THEN
        UPDATE products
        SET weight = p_value,
            updated_at = now()
        WHERE id = ANY(p_product_ids);
        GET DIAGNOSTICS v_count = ROW_COUNT;

    -- CASE: PACKAGING SPEC UPDATE
    ELSIF p_field = 'packaging_spec' THEN
        UPDATE products
        SET packaging_spec = p_value,
            updated_at = now()
        WHERE id = ANY(p_product_ids);
        GET DIAGNOSTICS v_count = ROW_COUNT;

    -- CASE: INVALID FIELD
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Trường cập nhật không hợp lệ');
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Đã cập nhật ' || v_count || ' sản phẩm');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
