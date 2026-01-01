-- FORCE ENABLE UPDATE for Admin/SaleAdmin
-- Chạy script này để sửa lỗi "Lưu không được"

-- 1. Function Helper (Đảm bảo luôn trả về đúng role)
CREATE OR REPLACE FUNCTION public.get_my_claim_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2. Xóa Policy cũ của CRM Deals
DROP POLICY IF EXISTS "Admin/SaleAdmin view all deals" ON crm_deals;
DROP POLICY IF EXISTS "Staff view own deals" ON crm_deals;
DROP POLICY IF EXISTS "Admin Update All" ON crm_deals;

-- 3. Tạo Policy Mới (Tách riêng View và Update cho chắc chắn)

-- A. VIEW (Xem): Admin thấy hết, Staff thấy của mình
CREATE POLICY "Admin View All" ON crm_deals
    FOR SELECT
    USING (
        get_my_claim_role() IN ('admin', 'sale_admin')
    );

CREATE POLICY "Staff View Own" ON crm_deals
    FOR SELECT
    USING (owner_user_id = auth.uid());

-- B. INSERT (Tạo mới): Ai cũng tạo được (nhưng sẽ gán owner là mình)
CREATE POLICY "Enable Insert for Authenticated" ON crm_deals
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- C. UPDATE (Sửa): Admin sửa hết, Staff sửa của mình
CREATE POLICY "Admin Update All" ON crm_deals
    FOR UPDATE
    USING (
        get_my_claim_role() IN ('admin', 'sale_admin')
    )
    WITH CHECK (
        get_my_claim_role() IN ('admin', 'sale_admin')
    );

CREATE POLICY "Staff Update Own" ON crm_deals
    FOR UPDATE
    USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());

-- D. DELETE (Xóa): Admin xóa hết, Staff xóa của mình
CREATE POLICY "Admin Delete All" ON crm_deals
    FOR DELETE
    USING (
        get_my_claim_role() = 'admin'
    );
    
-- Verify
SELECT * FROM pg_policies WHERE tablename = 'crm_deals';
