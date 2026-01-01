-- PANIC SCRIPT: REMOVE EVERYTHING (For Debugging Hanging)
-- Chạy cái này để xóa sạch mọi logic server-side đang bám vào crm_deals

-- 1. Xóa Triggers (Nguyên nhân hàng đầu gây loop/deadlock)
DROP TRIGGER IF EXISTS trg_update_crm_deal_expected_value ON crm_deals;
DROP TRIGGER IF EXISTS on_crm_deal_updated ON crm_deals;
DROP TRIGGER IF EXISTS trg_crm_deals_updated_at ON crm_deals;

-- 2. Tắt RLS (Nguyên nhân thứ 2)
ALTER TABLE crm_deals DISABLE ROW LEVEL SECURITY;

-- 3. Xóa sạch Policies cũ (Để chắc chắn không còn gì sót lại khi bật lại)
DROP POLICY IF EXISTS "Admin All" ON crm_deals;
DROP POLICY IF EXISTS "Staff Own" ON crm_deals;
DROP POLICY IF EXISTS "Enable Insert" ON crm_deals;
DROP POLICY IF EXISTS "Admin View All" ON crm_deals;
DROP POLICY IF EXISTS "Staff View Own" ON crm_deals;
DROP POLICY IF EXISTS "Super Admin Access" ON crm_deals;
DROP POLICY IF EXISTS "Staff Access Own" ON crm_deals;
DROP POLICY IF EXISTS "Allow Insert" ON crm_deals;

-- 4. Verify
SELECT 'CLEANED_UP' as status;
