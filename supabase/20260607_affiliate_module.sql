-- Bảng Hồ sơ Affiliate (CTV, KOL, KOC)
CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    affiliate_code TEXT NOT NULL UNIQUE,
    commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00, -- Ví dụ: 10%
    payment_info JSONB, -- Lưu thông tin ngân hàng (Tên NH, STK, Chủ TK)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Kích hoạt RLS
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

-- Cập nhật bảng orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliate_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_status TEXT DEFAULT 'pending' CHECK (affiliate_status IN ('pending', 'approved', 'paid', 'cancelled'));

-- Bảng Theo dõi Clicks
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    url_clicked TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kích hoạt RLS
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Bảng Lịch sử Thanh toán Hoa hồng (Payouts)
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    transaction_ref TEXT, -- Mã giao dịch ngân hàng
    admin_note TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kích hoạt RLS
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- PHÂN QUYỀN RLS (Row Level Security)
-- =========================================================================

-- Admin có toàn quyền trên affiliate_profiles
CREATE POLICY "Admin can do all on affiliate_profiles"
ON public.affiliate_profiles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Affiliate có thể xem và cập nhật hồ sơ của chính họ
CREATE POLICY "Users can view own affiliate profile"
ON public.affiliate_profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own affiliate profile payment info"
ON public.affiliate_profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Tương tự cho bảng clicks
CREATE POLICY "Admin can view all clicks"
ON public.affiliate_clicks
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Affiliate can view own clicks"
ON public.affiliate_clicks
FOR SELECT TO authenticated
USING (
  affiliate_id IN (SELECT id FROM affiliate_profiles WHERE user_id = auth.uid())
);

-- Mọi người đều có thể insert click (Public) - Vì khách hàng vãng lai click vào link
CREATE POLICY "Anyone can insert click"
ON public.affiliate_clicks
FOR INSERT TO public, anon, authenticated
WITH CHECK (true);

-- Cho bảng Payouts
CREATE POLICY "Admin can do all on payouts"
ON public.affiliate_payouts
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Affiliate can view own payouts"
ON public.affiliate_payouts
FOR SELECT TO authenticated
USING (
  affiliate_id IN (SELECT id FROM affiliate_profiles WHERE user_id = auth.uid())
);
