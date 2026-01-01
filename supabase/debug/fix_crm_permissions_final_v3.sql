-- FIX CRM PERMISSIONS (FINAL V3)
-- Chạy script này trong Supabase SQL Editor
-- Phiên bản này đã loại bỏ bảng crm_columns (lưu ở LocalStorage) và fix lỗi Recursion

-- 1. Helper Function để tránh Infinite Recursion (Lỗi 500)
-- Function này chạy với quyền tối cao (SECURITY DEFINER) để check role
CREATE OR REPLACE FUNCTION public.get_my_claim_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2. Configure Tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- Bỏ qua crm_columns vì dùng localStorage

-- 3. PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- Ai cũng xem được profile chính mình
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Admin xem được tất cả (Dùng function để tránh recursion)
CREATE POLICY "Admin can view all profiles" ON profiles
    FOR SELECT USING (
        get_my_claim_role() = 'admin'
    );

-- 4. CRM DEALS POLICIES
DROP POLICY IF EXISTS "Admin/SaleAdmin view all deals" ON crm_deals;
DROP POLICY IF EXISTS "Staff view own deals" ON crm_deals;
DROP POLICY IF EXISTS crm_deals_allow_all ON crm_deals; -- Cleanup old

-- Admin & Sale Admin: Xem tất cả
CREATE POLICY "Admin/SaleAdmin view all deals" ON crm_deals
    FOR ALL
    USING (
        get_my_claim_role() IN ('admin', 'sale_admin')
    );

-- Telesales/Sales: Chỉ xem/sửa deal của mình
CREATE POLICY "Staff view own deals" ON crm_deals
    FOR ALL
    USING (owner_user_id = auth.uid());


-- 5. CUSTOMERS POLICIES
DROP POLICY IF EXISTS "Admin/SaleAdmin view all customers" ON customers;
DROP POLICY IF EXISTS "Staff view own customers" ON customers;
DROP POLICY IF EXISTS customers_allow_all ON customers; -- Cleanup old

CREATE POLICY "Admin/SaleAdmin view all customers" ON customers
    FOR ALL
    USING (
        get_my_claim_role() IN ('admin', 'sale_admin')
    );

-- Staff: Xem khách hàng của mình HOẶC khách hàng chung (null owner)
CREATE POLICY "Staff view own and shared customers" ON customers
    FOR ALL
    USING (
        owner_user_id = auth.uid() 
        OR owner_user_id IS NULL
    );

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_my_claim_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_claim_role TO anon;
