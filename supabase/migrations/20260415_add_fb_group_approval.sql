-- Thêm cột đánh dấu Nhóm Yêu cầu Duyệt Bài
ALTER TABLE public.telesales_fb_groups 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

-- Cập nhật mô tả (comment) cho dễ hiểu
COMMENT ON COLUMN public.telesales_fb_groups.requires_approval IS 'Đánh dấu nếu Nhóm này Bắt buộc Censor phải duyệt bài (không được hiện liền)';
