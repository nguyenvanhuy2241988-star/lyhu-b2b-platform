-- TEST: DISABLE RLS TEMPORARILY
-- Mục đích: Kiểm tra xem có phải RLS chặn Realtime không
-- Code Javascript đã có filter (where owner_id = ...) nên tạm thời an toàn để test

ALTER TABLE crm_deals DISABLE ROW LEVEL SECURITY;

-- Sau khi chạy script này:
-- 1. Admin thử kéo thả deal
-- 2. Sales Admin / Telesales xem có nhảy không
-- -> Nếu ĐƯỢC: Lỗi do Policy (Tôi sẽ viết lại Policy khác)
-- -> Nếu KHÔNG được: Lỗi do Supabase Realtime (Không liên quan quyền)
