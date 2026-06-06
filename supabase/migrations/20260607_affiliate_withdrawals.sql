-- Thêm các trường thông tin thanh toán vào affiliate_profiles
ALTER TABLE affiliate_profiles 
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_name text,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS total_withdrawn numeric DEFAULT 0;

-- Tạo bảng affiliate_withdrawals (Yêu cầu rút tiền)
CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id uuid REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL CHECK (amount > 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    bank_info jsonb NOT NULL, -- Lưu lại bản nháp thông tin ngân hàng lúc tạo lệnh
    note text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật RLS
ALTER TABLE affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

-- Policy cho Affiliate: Chỉ được xem lệnh của chính mình
CREATE POLICY "Affiliates can view their own withdrawals" 
ON affiliate_withdrawals FOR SELECT 
USING (
    affiliate_id IN (
        SELECT id FROM affiliate_profiles WHERE user_id = auth.uid()
    )
);

-- Policy cho Affiliate: Được tạo lệnh rút tiền cho chính mình
CREATE POLICY "Affiliates can insert their own withdrawals" 
ON affiliate_withdrawals FOR INSERT 
WITH CHECK (
    affiliate_id IN (
        SELECT id FROM affiliate_profiles WHERE user_id = auth.uid()
    )
);

-- Policy cho Admin/Sale Admin: Xem tất cả
CREATE POLICY "Admins can view all withdrawals" 
ON affiliate_withdrawals FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'manager', 'sale_admin')
    )
);

-- Policy cho Admin/Sale Admin: Cập nhật tất cả (Duyệt/Từ chối)
CREATE POLICY "Admins can update all withdrawals" 
ON affiliate_withdrawals FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'manager', 'sale_admin')
    )
);

-- Cấp quyền cho authenticated và service_role
GRANT ALL ON affiliate_withdrawals TO authenticated;
GRANT ALL ON affiliate_withdrawals TO service_role;
