-- Bổ sung cột group_type để phân biệt Nhóm Bán hàng vs Nhóm Việc Làm
ALTER TABLE public.telesales_fb_groups 
ADD COLUMN IF NOT EXISTS group_type TEXT NOT NULL DEFAULT 'sales';

-- Đánh index cho truy vấn nhanh
CREATE INDEX IF NOT EXISTS idx_fb_groups_group_type ON public.telesales_fb_groups(group_type);

COMMENT ON COLUMN public.telesales_fb_groups.group_type IS 'sales = Nhóm bán hàng, job = Nhóm tuyển dụng/việc làm';
