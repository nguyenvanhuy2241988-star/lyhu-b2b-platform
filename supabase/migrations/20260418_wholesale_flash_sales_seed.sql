-- Tạo dữ liệu mẫu cho Flash Sale
DO $$
DECLARE
    v_flash_sale_id uuid;
    v_product_id uuid;
    v_product_price numeric;
BEGIN
    -- Xoá dữ liệu cũ (nếu có) để tránh lặp
    DELETE FROM public.wholesale_flash_sales WHERE name = 'Deal Sốc Nửa Đêm';
    
    -- Tạo mới chiến dịch Flash Sale
    INSERT INTO public.wholesale_flash_sales (
        name, start_time, end_time, is_active
    ) VALUES (
        'Deal Sốc Nửa Đêm',
        now(),
        now() + interval '5 hours',
        true
    ) RETURNING id INTO v_flash_sale_id;

    -- Lấy ngẫu nhiên 4 sản phẩm
    FOR v_product_id, v_product_price IN 
        SELECT id, price FROM public.products WHERE is_active = true ORDER BY random() LIMIT 4
    LOOP
        -- Giảm giá 30% cho Flash Sale
        INSERT INTO public.wholesale_flash_sale_items (
            flash_sale_id, product_id, discount_price, quantity_limit, quantity_sold
        ) VALUES (
            v_flash_sale_id, 
            v_product_id, 
            COALESCE(v_product_price, 50000) * 0.7, 
            floor(random() * 50 + 50)::int, 
            floor(random() * 40 + 10)::int
        );
    END LOOP;
END $$;
