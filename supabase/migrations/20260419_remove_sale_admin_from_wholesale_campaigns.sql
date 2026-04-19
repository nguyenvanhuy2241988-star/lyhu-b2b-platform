-- Remove Sale Admin access from wholesale banners
DROP POLICY IF EXISTS "Sale Admins full access to wholesale_banners" ON public.wholesale_banners;

-- Update wholesale promotions policies to be Admin ONLY
DROP POLICY IF EXISTS "Admin full access wholesale_promotions" ON public.wholesale_promotions;
CREATE POLICY "Admin full access wholesale_promotions" ON public.wholesale_promotions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admin full access wholesale_promotion_conditions" ON public.wholesale_promotion_conditions;
CREATE POLICY "Admin full access wholesale_promotion_conditions" ON public.wholesale_promotion_conditions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admin full access wholesale_promotion_actions" ON public.wholesale_promotion_actions;
CREATE POLICY "Admin full access wholesale_promotion_actions" ON public.wholesale_promotion_actions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Make Flash Sales Admin Only
DROP POLICY IF EXISTS "Cho phép t?t c? thao tác Flash Sales cho Admin" ON public.wholesale_flash_sales;
CREATE POLICY "Cho phép t?t c? thao tác Flash Sales cho Admin" ON public.wholesale_flash_sales FOR ALL USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Cho phép t?t c? thao tác Flash Sale Items cho Admin" ON public.wholesale_flash_sale_items;
CREATE POLICY "Cho phép t?t c? thao tác Flash Sale Items cho Admin" ON public.wholesale_flash_sale_items FOR ALL USING (auth.jwt() ->> 'role' = 'admin') WITH CHECK (auth.jwt() ->> 'role' = 'admin');
