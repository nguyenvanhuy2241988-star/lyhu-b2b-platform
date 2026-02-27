-- ==========================================
-- TÍNH NĂNG TÙY CHỈNH CỘT KANBAN ỨNG VIÊN
-- ==========================================

-- 1. Tạo bảng lưu trữ cấu hình Cột (Trạng thái)
CREATE TABLE IF NOT EXISTS public.recruitment_board_columns (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    label TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'bg-slate-50 text-slate-700',
    order_index INTEGER NOT NULL DEFAULT 0,
    is_system BOOLEAN NOT NULL DEFAULT false, -- Đánh dấu cột hệ thống không được xóa (VD: Mới ứng tuyển, Từ chối)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật RLS (Row Level Security)
ALTER TABLE public.recruitment_board_columns ENABLE ROW LEVEL SECURITY;

-- Policy cho phép mọi người (authenticated) đọc cột
CREATE POLICY "Cho phép xem danh sách cột Kanban" 
ON public.recruitment_board_columns 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy cho phép HR/Admin sửa, thêm, xóa
CREATE POLICY "Cho phép HR sửa cột Kanban" 
ON public.recruitment_board_columns 
FOR ALL 
TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) IN ('admin', 'manager', 'recruiter', 'recruiter_manager')
);

-- 2. Đổ dữ liệu mặc định (Seed data) cho 6 cột cứng cũ
-- Điều này đảm bảo khi web load lên, dữ liệu cũ vẫn khớp hoàn hảo.
INSERT INTO public.recruitment_board_columns (id, label, color, order_index, is_system)
VALUES 
    ('new', 'Mới ứng tuyển', 'bg-blue-50 text-blue-700', 1, true), -- System column (Không thể xóa)
    ('screening', 'Sàng lọc', 'bg-purple-50 text-purple-700', 2, false),
    ('interview', 'Phỏng vấn', 'bg-orange-50 text-orange-700', 3, false),
    ('offer', 'Offer', 'bg-yellow-50 text-yellow-700', 4, false),
    ('hired', 'Đã tuyển', 'bg-green-50 text-green-700', 5, false),
    ('rejected', 'Từ chối', 'bg-red-50 text-red-700', 6, true)  -- System column (Không thể xóa)
ON CONFLICT (id) DO NOTHING;

-- 3. Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_modified_column_recruitment_board()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_recruitment_board_columns_mod ON public.recruitment_board_columns;
CREATE TRIGGER trg_recruitment_board_columns_mod
BEFORE UPDATE ON public.recruitment_board_columns
FOR EACH ROW
EXECUTE FUNCTION update_modified_column_recruitment_board();

-- Chú ý: Cột "status" ở bảng recruitment_candidates vẫn là kiểu text (Varchar) nên ta không cần sửa Schema của nó, 
-- nó sẽ tự lấy ID UUID dạng chuỗi để lưu (Ví dụ: lưu 'new' thay vì mã UUID dài đối với các cột được seed thủ công như trên, 
-- hoặc lưu UUID chuẩn do gen_random_uuid tạo ra đối với các cột mới HR tự thêm).
