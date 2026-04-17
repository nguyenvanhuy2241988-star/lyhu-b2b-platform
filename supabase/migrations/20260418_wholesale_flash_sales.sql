-- Tạo bảng Quản lý Flash Sale Bán Sỉ
CREATE TABLE IF NOT EXISTS public.wholesale_flash_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tạo bảng Lưu trữ Sản phẩm trong Flash Sale
CREATE TABLE IF NOT EXISTS public.wholesale_flash_sale_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flash_sale_id uuid REFERENCES public.wholesale_flash_sales(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    discount_price numeric NOT NULL, -- Giá sỉ sau khi Flash Sale
    quantity_limit int DEFAULT 100,  -- Tổng số lượng được phép bán ở giá flash sale
    quantity_sold int DEFAULT 0,     -- Đã bán
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wholesale_flash_sales_active ON public.wholesale_flash_sales(is_active);
CREATE INDEX IF NOT EXISTS idx_wholesale_flash_sale_items_fsid ON public.wholesale_flash_sale_items(flash_sale_id);

-- RLS
ALTER TABLE public.wholesale_flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_flash_sale_items ENABLE ROW LEVEL SECURITY;

-- Ai cũng có thể đọc (để hiển thị frontend)
CREATE POLICY "Cho phép đọc Flash Sales"
ON public.wholesale_flash_sales FOR SELECT USING (true);

CREATE POLICY "Cho phép đọc Flash Sale Items"
ON public.wholesale_flash_sale_items FOR SELECT USING (true);

-- Cho phép Admin và Marketing sửa
CREATE POLICY "Cho phép tất cả thao tác Flash Sales cho Admin"
ON public.wholesale_flash_sales FOR ALL 
USING (auth.jwt() ->> 'role' IN ('admin', 'marketing', 'ecommerce'))
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'marketing', 'ecommerce'));

CREATE POLICY "Cho phép tất cả thao tác Flash Sale Items cho Admin"
ON public.wholesale_flash_sale_items FOR ALL 
USING (auth.jwt() ->> 'role' IN ('admin', 'marketing', 'ecommerce'))
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'marketing', 'ecommerce'));
