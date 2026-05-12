-- BƯỚC 1: XÓA TRIỆT ĐỂ CÁC TÀI KHOẢN BỊ LỖI
-- (Chạy khối lệnh này TRƯỚC khi chạy file scripts/create_telesales.js)
DELETE FROM public.profiles WHERE email LIKE 'telesales%@lyhu.vn';
DELETE FROM auth.identities WHERE provider = 'email' AND identity_data->>'email' LIKE 'telesales%@lyhu.vn';
DELETE FROM auth.users WHERE email LIKE 'telesales%@lyhu.vn';



-- ==========================================
-- BƯỚC 2: KÍCH HOẠT VÀ GÁN QUYỀN
-- (Chỉ chạy khối lệnh này SAU KHI đã chạy xong file scripts/create_telesales.js)

-- Bỏ qua bước xác nhận email
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email LIKE 'telesales%@lyhu.vn' AND email_confirmed_at IS NULL;

-- Chắc chắn gán role telesales
UPDATE public.profiles
SET role = 'telesales'
WHERE email LIKE 'telesales%@lyhu.vn';
