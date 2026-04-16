-- =====================================================
-- KỊCH BẢN MEDIA (Dành riêng cho Marketing & Admin)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.media_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,                                -- Tiêu đề kịch bản
    content TEXT,                                       -- Nội dung Kịch bản (HTML / Rich Text format 2 cột)
    script_type TEXT DEFAULT 'tiktok',                  -- tiktok / facebook_reels / youtube_shorts / promo_video / concept
    status TEXT DEFAULT 'draft',                        -- draft / approved / shooting / completed / cancelled
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Media phụ trách (tuỳ chọn)
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,  
    project_id UUID REFERENCES media_projects(id) ON DELETE SET NULL, -- Thuộc dự án nào (nếu cần link)
    estimated_duration_sec INT DEFAULT 30,              -- Thời lượng dự kiến (giây)
    notes TEXT,                                         -- Ghi chú thêm
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_media_scripts_status ON public.media_scripts(status);
CREATE INDEX IF NOT EXISTS idx_media_scripts_created_by ON public.media_scripts(created_by);
CREATE INDEX IF NOT EXISTS idx_media_scripts_project ON public.media_scripts(project_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.media_scripts ENABLE ROW LEVEL SECURITY;

-- Dành cho dev (Mở toàn quyền) hoặc Marketing/Admin (do logic UI đã phân luồng Role bảo vệ sẵn)
-- Ở đây tạo policy permissive chung, Role access đã được phân tại Middleware/UI Route:
DROP POLICY IF EXISTS "media_scripts_all_access" ON public.media_scripts;
CREATE POLICY "media_scripts_all_access" ON public.media_scripts FOR ALL USING (true) WITH CHECK (true);

SELECT 'Table media_scripts created successfully!' as status;
