-- Bảng cấu hình hoa hồng riêng cho từng CTV trên từng sản phẩm
CREATE TABLE IF NOT EXISTS public.affiliate_custom_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    commission_rate DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(affiliate_id, product_id)
);

-- Kích hoạt RLS
ALTER TABLE public.affiliate_custom_rates ENABLE ROW LEVEL SECURITY;

-- Admin có toàn quyền trên affiliate_custom_rates
CREATE POLICY "Admin can do all on affiliate_custom_rates"
ON public.affiliate_custom_rates
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Affiliate có thể xem thông tin cấu hình riêng của họ
CREATE POLICY "Users can view own affiliate custom rates"
ON public.affiliate_custom_rates
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM affiliate_profiles
    WHERE affiliate_profiles.id = affiliate_custom_rates.affiliate_id AND affiliate_profiles.user_id = auth.uid()
  )
);
