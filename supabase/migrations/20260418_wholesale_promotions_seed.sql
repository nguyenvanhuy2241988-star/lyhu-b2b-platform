-- Seed data cho Wholesale Promotions

DO $$ 
DECLARE
    new_promo_id UUID;
BEGIN
    -- Chỉ chèn nếu chưa có promotion nào 
    IF NOT EXISTS (SELECT 1 FROM public.wholesale_promotions LIMIT 1) THEN
        
        -- Tạo chương trình Khuyến mãi tháng
        INSERT INTO public.wholesale_promotions (id, name, description, start_date, end_date, is_active, priority)
        VALUES (
            uuid_generate_v4(),
            'Combo Siêu Thị: Giảm 15% khi đủ 4 thùng',
            'Khách sắm đủ 4 sản phẩm bất kỳ sẽ được chiết khấu 15% trên toàn bộ giỏ hàng',
            NOW(),
            NOW() + INTERVAL '30 days',
            true,
            10
        ) RETURNING id INTO new_promo_id;

        -- Thêm điều kiện: Tổng số lượng trong giỏ >= 4
        INSERT INTO public.wholesale_promotion_conditions (promotion_id, condition_type, required_value)
        VALUES (
            new_promo_id,
            'min_cart_qty',
            4
        );

        -- Thêm phần thưởng: Chiết khấu 15%
        INSERT INTO public.wholesale_promotion_actions (promotion_id, action_type, reward_value)
        VALUES (
            new_promo_id,
            'discount_percent',
            15
        );
        
    END IF;
END $$;
