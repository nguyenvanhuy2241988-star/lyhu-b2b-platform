-- Cập nhật cấu trúc bảng media_equipment để hỗ trợ quản lý Biên Bản Bàn Giao
-- Bổ sung: Ảnh sản phẩm, Thông tin bảo hành, Hạn bảo hành, Giá trị tài sản

ALTER TABLE public.media_equipment
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS warranty_info text,
ADD COLUMN IF NOT EXISTS warranty_expiry date,
ADD COLUMN IF NOT EXISTS value_amount numeric DEFAULT 0;

-- Ghi chú: Nếu hệ thống bạn đang dùng Supabase, hãy copy toàn bộ file này
-- paste vào mục SQL Editor trên Dashboard của Supabase và bấm "Run" để chạy.
