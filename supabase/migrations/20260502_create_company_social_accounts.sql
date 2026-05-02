-- Bảng Quản lý tài khoản mạng xã hội công ty
CREATE TABLE IF NOT EXISTS company_social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    account_name TEXT NOT NULL,
    login_id TEXT NOT NULL,
    password TEXT,
    backup_password TEXT,
    recovery_info TEXT,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bật RLS
ALTER TABLE company_social_accounts ENABLE ROW LEVEL SECURITY;

-- Chỉ Admin mới được quyền xem và chỉnh sửa
CREATE POLICY "Admins can do everything on company_social_accounts"
ON company_social_accounts
FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);
