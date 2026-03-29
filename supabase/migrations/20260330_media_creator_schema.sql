-- ═══════════════════════════════════════════════════════════════
-- MEDIA CREATOR ROLE: Schema cho nhân viên Chụp ảnh / Quay dựng
-- Bảng: media_briefs, media_projects, media_assets, media_equipment
-- ═══════════════════════════════════════════════════════════════

-- =====================================================
-- 1. MEDIA BRIEFS (Yêu cầu chụp/quay từ các phòng ban)
-- =====================================================
CREATE TABLE IF NOT EXISTS media_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                           -- Tiêu đề brief
  description TEXT,                              -- Mô tả chi tiết yêu cầu
  media_type TEXT DEFAULT 'photo',               -- photo / video / both
  priority TEXT DEFAULT 'normal',                -- urgent / high / normal / low
  status TEXT DEFAULT 'pending',                 -- pending / in_progress / completed / cancelled
  deadline TIMESTAMPTZ,                          -- Hạn hoàn thành
  requested_by UUID REFERENCES auth.users(id),   -- Người yêu cầu (marketing, sales...)
  requested_department TEXT,                     -- Phòng ban yêu cầu
  assigned_to UUID REFERENCES auth.users(id),    -- Nhân viên media phụ trách
  products TEXT[],                               -- Sản phẩm liên quan
  mood_references TEXT[],                        -- Links ảnh tham khảo mood/style
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. MEDIA PROJECTS (Dự án ảnh/video - Kanban)
-- =====================================================
CREATE TABLE IF NOT EXISTS media_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  brief_id UUID REFERENCES media_briefs(id),     -- Link brief gốc
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'planned',                 -- planned / shooting / editing / review / completed / cancelled
  media_type TEXT DEFAULT 'photo',               -- photo / video / both
  priority TEXT DEFAULT 'normal',
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  asset_count INT DEFAULT 0,                     -- Số ảnh/video đã upload
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. MEDIA ASSETS (Thư viện ảnh/video)
-- =====================================================
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,                        -- Supabase Storage URL
  file_type TEXT DEFAULT 'image',                -- image / video
  file_size BIGINT DEFAULT 0,                    -- bytes
  thumbnail_url TEXT,
  project_id UUID REFERENCES media_projects(id), -- Thuộc dự án nào
  category TEXT DEFAULT 'product',               -- product / lifestyle / event / social / other
  tags TEXT[],                                   -- Tag phân loại
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. MEDIA EQUIPMENT (Quản lý thiết bị)
-- =====================================================
CREATE TABLE IF NOT EXISTS media_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                            -- Tên thiết bị
  equipment_type TEXT DEFAULT 'camera',          -- camera / lens / light / tripod / backdrop / other
  brand TEXT,                                    -- Hãng
  model TEXT,                                    -- Model
  serial_number TEXT,                            -- Số serial
  condition TEXT DEFAULT 'good',                 -- excellent / good / fair / needs_repair
  status TEXT DEFAULT 'available',               -- available / in_use / maintenance / retired
  current_user_id UUID REFERENCES auth.users(id),-- Ai đang mượn
  purchase_date DATE,
  purchase_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_media_briefs_assigned ON media_briefs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_media_briefs_status ON media_briefs(status);
CREATE INDEX IF NOT EXISTS idx_media_briefs_requested_by ON media_briefs(requested_by);
CREATE INDEX IF NOT EXISTS idx_media_projects_assigned ON media_projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_media_projects_status ON media_projects(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_project ON media_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploaded_by ON media_assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets(category);
CREATE INDEX IF NOT EXISTS idx_media_equipment_status ON media_equipment(status);

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================
ALTER TABLE media_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_equipment ENABLE ROW LEVEL SECURITY;

-- Policies cho development (permissive)
CREATE POLICY "media_briefs_all" ON media_briefs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "media_projects_all" ON media_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "media_assets_all" ON media_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "media_equipment_all" ON media_equipment FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 7. TRIGGER: Tự đếm asset_count trong media_projects
-- =====================================================
CREATE OR REPLACE FUNCTION sync_media_project_asset_count()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);
  IF v_project_id IS NOT NULL THEN
    UPDATE media_projects
    SET asset_count = (SELECT COUNT(*) FROM media_assets WHERE project_id = v_project_id),
        updated_at = now()
    WHERE id = v_project_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_media_asset_count ON media_assets;
CREATE TRIGGER trg_sync_media_asset_count
  AFTER INSERT OR DELETE ON media_assets
  FOR EACH ROW
  EXECUTE FUNCTION sync_media_project_asset_count();

-- =====================================================
-- Verify
-- =====================================================
SELECT 'Media Creator schema created successfully!' as status;
