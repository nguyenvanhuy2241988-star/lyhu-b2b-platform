-- ═══════════════════════════════════════════════════════════════
-- SALES GT: Database Migration — Phase 1
-- Tạo bảng gt_outlets, gt_checkins, gt_routes cho hệ thống DMS
-- ═══════════════════════════════════════════════════════════════

-- 1. BẢNG ĐIỂM BÁN (Outlets/Stores)
CREATE TABLE IF NOT EXISTS gt_outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  ward TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  outlet_type TEXT DEFAULT 'tap_hoa',
  channel TEXT DEFAULT 'GT',
  visit_frequency TEXT DEFAULT 'F4',
  status TEXT DEFAULT 'active',
  assigned_to UUID REFERENCES auth.users(id),
  route_id UUID,
  photos JSONB DEFAULT '[]',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BẢNG CHECK-IN (Visit Log)
CREATE TABLE IF NOT EXISTS gt_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES gt_outlets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  check_in_lat DOUBLE PRECISION NOT NULL,
  check_in_lng DOUBLE PRECISION NOT NULL,
  distance_meters INT,
  display_photos JSONB DEFAULT '[]',
  shelf_photos JSONB DEFAULT '[]',
  inventory_notes TEXT,
  market_notes TEXT,
  order_created BOOLEAN DEFAULT false,
  order_id UUID,
  visit_result TEXT DEFAULT 'visited',
  check_in_at TIMESTAMPTZ DEFAULT now(),
  check_out_at TIMESTAMPTZ
);

-- 3. BẢNG TUYẾN BÁN HÀNG (Routes)
CREATE TABLE IF NOT EXISTS gt_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  day_of_week INT[] DEFAULT '{}',
  outlet_ids UUID[] DEFAULT '{}',
  frequency TEXT DEFAULT 'F4',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_gt_outlets_district ON gt_outlets(district);
CREATE INDEX IF NOT EXISTS idx_gt_outlets_assigned ON gt_outlets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_gt_outlets_status ON gt_outlets(status);
CREATE INDEX IF NOT EXISTS idx_gt_checkins_user ON gt_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_gt_checkins_date ON gt_checkins(check_in_at);
CREATE INDEX IF NOT EXISTS idx_gt_checkins_outlet ON gt_checkins(outlet_id);
CREATE INDEX IF NOT EXISTS idx_gt_routes_assigned ON gt_routes(assigned_to);

-- 5. RLS (Row Level Security)
ALTER TABLE gt_outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE gt_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE gt_routes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Sales GT chỉ thấy data được assign cho mình, admin/sale_admin thấy tất cả
CREATE POLICY "gt_outlets_select" ON gt_outlets FOR SELECT USING (
  assigned_to = auth.uid() OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
);
CREATE POLICY "gt_outlets_insert" ON gt_outlets FOR INSERT WITH CHECK (true);
CREATE POLICY "gt_outlets_update" ON gt_outlets FOR UPDATE USING (
  assigned_to = auth.uid() OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
);

CREATE POLICY "gt_checkins_select" ON gt_checkins FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
);
CREATE POLICY "gt_checkins_insert" ON gt_checkins FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "gt_routes_select" ON gt_routes FOR SELECT USING (
  assigned_to = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
);
CREATE POLICY "gt_routes_insert" ON gt_routes FOR INSERT WITH CHECK (true);
CREATE POLICY "gt_routes_update" ON gt_routes FOR UPDATE USING (
  assigned_to = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
);

-- Verify
SELECT 'gt_outlets' AS table_name, count(*) FROM gt_outlets
UNION ALL
SELECT 'gt_checkins', count(*) FROM gt_checkins
UNION ALL
SELECT 'gt_routes', count(*) FROM gt_routes;
