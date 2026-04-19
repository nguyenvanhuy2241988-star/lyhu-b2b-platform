-- Tái thiết lập RLS Policy cho Flash Sale và Flash Sale Items do lỗi Delete/Insert
DROP POLICY IF EXISTS "Cho phép tất cả thao tác Flash Sales cho Admin" ON public.wholesale_flash_sales;
DROP POLICY IF EXISTS "Cho php t?t c? thao tc Flash Sales cho Admin" ON public.wholesale_flash_sales;
DROP POLICY IF EXISTS "Admin full access flash_sales" ON public.wholesale_flash_sales;

CREATE POLICY "Admin full access flash_sales" ON public.wholesale_flash_sales FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Cho phép tất cả thao tác Flash Sale Items cho Admin" ON public.wholesale_flash_sale_items;
DROP POLICY IF EXISTS "Cho php t?t c? thao tc Flash Sale Items cho Admin" ON public.wholesale_flash_sale_items;
DROP POLICY IF EXISTS "Admin full access flash_sale_items" ON public.wholesale_flash_sale_items;

CREATE POLICY "Admin full access flash_sale_items" ON public.wholesale_flash_sale_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
