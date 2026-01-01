-- FIX RECURSION & PERFORMANCE (V5)
-- Thay vì query bảng profiles (gây loop), ta dùng metadata trong JWT (nếu có)
-- Hoặc đơn giản hóa Policy: Admin được làm tất cả, nhưng check bằng hàm SECURITY DEFINER xịn hơn.

-- 1. Hàm check role KHÔNG dùng RLS của profiles
CREATE OR REPLACE FUNCTION public.get_my_claim_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER -- Chạy với quyền superuser (bỏ qua RLS của profiles)
SET search_path = public
STABLE
AS $$
  -- Truy vấn trực tiếp, bỏ qua RLS vì hàm là SECURITY DEFINER
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2. Tắt RLS của profiles để debug (nếu cần thiết, nhưng hàm trên đã bypass rồi)
-- Tuy nhiên, để chắc chắn không bị lock, ta optimize policy crm_deals tiếp.

-- 3. Reset Policies CRM lần nữa (cho chắc)
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admin Access" ON crm_deals;
DROP POLICY IF EXISTS "Staff Access Own" ON crm_deals;
DROP POLICY IF EXISTS "Allow Insert" ON crm_deals;

-- 4. Policy Tối Ưu
-- Admin: Xem/Sửa tất cả
CREATE POLICY "Admin All" ON crm_deals
    FOR ALL
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'sale_admin')
    );

-- Staff: Xem/Sửa của mình
CREATE POLICY "Staff Own" ON crm_deals
    FOR ALL
    USING (owner_user_id = auth.uid());

-- Insert
CREATE POLICY "Insert All" ON crm_deals
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
    
-- Verify
SELECT * FROM pg_policies WHERE tablename = 'crm_deals';
