-- Bật Realtime Broadcast Event Notifications cho các bảng dùng để theo dõi tính KPI Admin
-- Điều này cho phép Màn hình Admin nhận được cục ping chớp mắt không có độ trễ

-- 1. Cho bảng Cuộc gọi / Target
ALTER TABLE IF EXISTS public.telesales_daily_activities REPLICA IDENTITY FULL;

-- 2. Cho bảng Đóng góp Hóa Đơn Doanh Số (Hàng)
ALTER TABLE IF EXISTS public.orders REPLICA IDENTITY FULL;

-- Bứt Pub/sub Push
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Subscribe các bảng vào Realtime Publication (Thay thế bằng cách Add từng cái nếu version cũ)
ALTER PUBLICATION supabase_realtime ADD TABLE public.telesales_daily_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_kpi_settings;
