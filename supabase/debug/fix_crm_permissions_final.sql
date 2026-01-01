-- FIX CRM PERMISSIONS & RLS (FINAL V2 - FIXED RECURSION)
-- Chạy script này trong Supabase SQL Editor

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
ALTER TABLE crm_columns ENABLE ROW LEVEL SECURITY;

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

-- Create new policies
CREATE POLICY "Admin/SaleAdmin view all deals" ON crm_deals
    FOR ALL
    USING (
        get_my_claim_role() IN ('admin', 'sale_admin')
    );

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

CREATE POLICY "Staff view own customers" ON customers
    FOR ALL
    USING (owner_user_id = auth.uid());


-- 6. CRM COLUMNS POLICIES
DROP POLICY IF EXISTS "Everyone can view columns" ON crm_columns;
DROP POLICY IF EXISTS "Admin can manage columns" ON crm_columns;

CREATE POLICY "Everyone can view columns" ON crm_columns
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage columns" ON crm_columns
    FOR ALL USING (
        get_my_claim_role() = 'admin'
    );

-- 7. Grant permissions if needed
GRANT EXECUTE ON FUNCTION public.get_my_claim_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_claim_role TO anon;
