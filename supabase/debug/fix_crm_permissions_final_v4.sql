-- FIX CRM PERMISSIONS (FINAL V4 - NUCLEAR OPTION)
-- Chạy script này để sửa triệt để lỗi "Admin không lưu được"

-- 1. Reset RLS
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin All" ON crm_deals;
DROP POLICY IF EXISTS "Staff Own" ON crm_deals;
DROP POLICY IF EXISTS "Admin Update" ON crm_deals;
DROP POLICY IF EXISTS "Enable Insert" ON crm_deals;
DROP POLICY IF EXISTS "Admin View All" ON crm_deals;
DROP POLICY IF EXISTS "Staff View Own" ON crm_deals;
DROP POLICY IF EXISTS "AdminUpdateAll" ON crm_deals;
DROP POLICY IF EXISTS "StaffUpdateOwn" ON crm_deals;

-- 2. Function Helper (Check Role)
CREATE OR REPLACE FUNCTION public.get_my_claim_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 3. POLICIES QUYỀN LỰC CAO NHẤT

-- A. ADMIN & SALE_ADMIN: QUYỀN TUYỆT ĐỐI (Làm gì cũng được)
CREATE POLICY "Super Admin Access" ON crm_deals
    FOR ALL
    USING (
        get_my_claim_role() IN ('admin', 'sale_admin')
    )
    WITH CHECK (
        get_my_claim_role() IN ('admin', 'sale_admin')
    );

-- B. STAFF (Telesales/Sales): Chỉ thấy & Sửa của mình
CREATE POLICY "Staff Access Own" ON crm_deals
    FOR ALL
    USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());

-- C. INSERT: Ai cũng tạo được (mặc định owner là mình)
CREATE POLICY "Allow Insert" ON crm_deals
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);


-- 4. Verify
SELECT * FROM pg_policies WHERE tablename = 'crm_deals';
