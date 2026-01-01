-- CRM RLS Policies - Phiên bản đơn giản (cho testing)
-- Chạy trong Supabase SQL Editor

-- =====================================================
-- 1. DROP OLD POLICIES  
-- =====================================================

DROP POLICY IF EXISTS customers_all_policy ON customers;
DROP POLICY IF EXISTS crm_deals_all_policy ON crm_deals;
DROP POLICY IF EXISTS customers_select_policy ON customers;
DROP POLICY IF EXISTS customers_insert_policy ON customers;
DROP POLICY IF EXISTS customers_update_policy ON customers;
DROP POLICY IF EXISTS customers_delete_policy ON customers;
DROP POLICY IF EXISTS crm_deals_select_policy ON crm_deals;
DROP POLICY IF EXISTS crm_deals_insert_policy ON crm_deals;
DROP POLICY IF EXISTS crm_deals_update_policy ON crm_deals;
DROP POLICY IF EXISTS crm_deals_delete_policy ON crm_deals;

-- =====================================================
-- 2. TẠM THỜI: CHO PHÉP TẤT CẢ (ĐỂ TEST)
-- =====================================================

-- Customers: cho phép tất cả thao tác
CREATE POLICY customers_allow_all ON customers
    FOR ALL USING (true) WITH CHECK (true);

-- CRM Deals: cho phép tất cả thao tác  
CREATE POLICY crm_deals_allow_all ON crm_deals
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 3. VERIFY
-- =====================================================

SELECT 'RLS Policies (permissive) created successfully!' as message;

-- Liệt kê policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('customers', 'crm_deals');
