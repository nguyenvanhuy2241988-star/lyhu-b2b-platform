-- ═══════════════════════════════════════════════════════════════
-- PROVINCE ROUTES: Chi tiết tuyến bán hàng theo tỉnh
-- Admin quản lý, Telesales/Sales xem để tư vấn khách hàng
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS province_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province TEXT NOT NULL REFERENCES province_market_data(province) ON DELETE CASCADE,
  route_name TEXT NOT NULL,              -- Tên tuyến (VD: "Tuyến Đống Đa - Thanh Xuân")
  districts TEXT,                        -- Quận/huyện tuyến đi qua
  estimated_outlets INT DEFAULT 0,       -- Số điểm bán dự trù trên tuyến
  frequency TEXT DEFAULT 'weekly',       -- weekly / biweekly / monthly
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_province_routes_province ON province_routes(province);

-- RLS
ALTER TABLE province_routes ENABLE ROW LEVEL SECURITY;

-- Tất cả role đều xem được
CREATE POLICY "province_routes_select" ON province_routes
  FOR SELECT USING (true);

-- Chỉ Admin/Sale Admin thêm/sửa/xóa
CREATE POLICY "province_routes_insert" ON province_routes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
  );

CREATE POLICY "province_routes_update" ON province_routes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
  );

CREATE POLICY "province_routes_delete" ON province_routes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
  );

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: Tự động cập nhật total_routes + estimated_outlets
-- trong province_market_data khi thêm/sửa/xóa tuyến
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION sync_province_route_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_province TEXT;
BEGIN
  -- Xác định province cần cập nhật
  v_province := COALESCE(NEW.province, OLD.province);

  UPDATE province_market_data
  SET
    total_routes = (SELECT COUNT(*) FROM province_routes WHERE province = v_province),
    estimated_outlets = (SELECT COALESCE(SUM(estimated_outlets), 0) FROM province_routes WHERE province = v_province),
    updated_at = now()
  WHERE province = v_province;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_route_counts ON province_routes;
CREATE TRIGGER trg_sync_route_counts
  AFTER INSERT OR UPDATE OR DELETE ON province_routes
  FOR EACH ROW
  EXECUTE FUNCTION sync_province_route_counts();

-- Verify
SELECT 'province_routes table created with auto-sync trigger' as status;
