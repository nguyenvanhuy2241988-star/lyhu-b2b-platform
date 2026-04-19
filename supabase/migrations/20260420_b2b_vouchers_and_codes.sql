-- Migration: 20260420_b2b_vouchers_and_codes

-- BẢNG QUẢN LÝ MÃ KHÁCH HÀNG / B2B ACCESS CODES
CREATE TABLE IF NOT EXISTS public.b2b_customer_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    telesales_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Khoá tài khoản khách với mã này, null nếu mã chưa ai nhận.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS B2B Customer Codes
ALTER TABLE public.b2b_customer_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép Admin toàn quyền b2b_customer_codes" 
ON public.b2b_customer_codes FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Telesales có thể xem và tạo mã của mình" 
ON public.b2b_customer_codes FOR ALL TO authenticated 
USING (telesales_id = auth.uid());

CREATE POLICY "Khách hàng có thể đọc mã bằng chuỗi code" 
ON public.b2b_customer_codes FOR SELECT TO public 
USING (is_active = TRUE);

-- BẢNG PHIẾU GIẢM GIÁ
CREATE TABLE IF NOT EXISTS public.wholesale_vouchers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('fixed_amount', 'percent', 'freeship')),
    discount_value NUMERIC NOT NULL DEFAULT 0,
    min_order_value NUMERIC NOT NULL DEFAULT 0,
    customer_code_id UUID REFERENCES public.b2b_customer_codes(id) ON DELETE SET NULL, -- Voucher độc quyền nếu khác null
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Vouchers
ALTER TABLE public.wholesale_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép Admin toàn quyền wholesale_vouchers" 
ON public.wholesale_vouchers FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Public read active vouchers" 
ON public.wholesale_vouchers FOR SELECT TO public 
USING (is_active = TRUE);

-- SEED 2 VOUCHER CŨ HIỆN TẠI ĐỂ CHO APP CHẠY Không BỊ MẤT
INSERT INTO public.wholesale_vouchers (code, name, description, discount_type, discount_value, min_order_value, is_active)
VALUES
('VOUCHER_50K', 'Giảm 50K', 'Đơn tối thiểu đ500k', 'fixed_amount', 50000, 500000, true),
('FREESHIP', 'Freeship Extra', 'Tối đa 100K chi phí VC', 'freeship', 100000, 0, true)
ON CONFLICT (code) DO NOTHING;
