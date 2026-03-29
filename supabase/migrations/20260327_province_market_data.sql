-- ═══════════════════════════════════════════════════════════════
-- PROVINCE MARKET DATA: Tổng quan thị trường & Phủ sóng NPP
-- Bảng tra cứu thông tin thị trường theo tỉnh/thành
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS province_market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL CHECK (region IN ('Bắc', 'Trung', 'Nam')),
  population INT DEFAULT 0,          -- Dân số (nghìn người)
  total_routes INT DEFAULT 0,        -- Số tuyến bán hàng
  estimated_outlets INT DEFAULT 0,   -- Điểm bán dự trù
  has_npp BOOLEAN DEFAULT false,     -- Đã có NPP chưa
  npp_name TEXT,                     -- Tên NPP (nếu có)
  npp_brands TEXT[] DEFAULT '{}',    -- Nhãn hiệu NPP đang phân phối
  npp_status TEXT DEFAULT 'inactive' CHECK (npp_status IN ('active', 'pending', 'inactive')),
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_province_market_region ON province_market_data(region);
CREATE INDEX IF NOT EXISTS idx_province_market_has_npp ON province_market_data(has_npp);

-- RLS
ALTER TABLE province_market_data ENABLE ROW LEVEL SECURITY;

-- Admin/Sale Admin: full access
CREATE POLICY "province_market_admin_select" ON province_market_data
  FOR SELECT USING (true);

CREATE POLICY "province_market_admin_insert" ON province_market_data
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
  );

CREATE POLICY "province_market_admin_update" ON province_market_data
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
  );

CREATE POLICY "province_market_admin_delete" ON province_market_data
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sale_admin'))
  );

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA: 63 Tỉnh/Thành phố Việt Nam
-- Dân số ước tính (nghìn người) - số liệu tham khảo 2024
-- Admin sẽ cập nhật chi tiết: routes, outlets, NPP
-- ═══════════════════════════════════════════════════════════════

INSERT INTO province_market_data (province, region, population) VALUES
-- MIỀN BẮC (25 tỉnh/thành)
('Hà Nội', 'Bắc', 8500),
('Hải Phòng', 'Bắc', 2100),
('Quảng Ninh', 'Bắc', 1350),
('Bắc Ninh', 'Bắc', 1450),
('Hải Dương', 'Bắc', 1950),
('Hưng Yên', 'Bắc', 1280),
('Vĩnh Phúc', 'Bắc', 1200),
('Bắc Giang', 'Bắc', 1900),
('Thái Nguyên', 'Bắc', 1350),
('Phú Thọ', 'Bắc', 1500),
('Lạng Sơn', 'Bắc', 800),
('Cao Bằng', 'Bắc', 540),
('Bắc Kạn', 'Bắc', 320),
('Tuyên Quang', 'Bắc', 810),
('Yên Bái', 'Bắc', 840),
('Lào Cai', 'Bắc', 750),
('Hà Giang', 'Bắc', 900),
('Thái Bình', 'Bắc', 1870),
('Nam Định', 'Bắc', 1900),
('Ninh Bình', 'Bắc', 1000),
('Hà Nam', 'Bắc', 870),
('Hoà Bình', 'Bắc', 870),
('Sơn La', 'Bắc', 1280),
('Điện Biên', 'Bắc', 620),
('Lai Châu', 'Bắc', 480),

-- MIỀN TRUNG (19 tỉnh/thành)
('Thanh Hoá', 'Trung', 3700),
('Nghệ An', 'Trung', 3400),
('Hà Tĩnh', 'Trung', 1300),
('Quảng Bình', 'Trung', 910),
('Quảng Trị', 'Trung', 650),
('Thừa Thiên Huế', 'Trung', 1200),
('Đà Nẵng', 'Trung', 1200),
('Quảng Nam', 'Trung', 1530),
('Quảng Ngãi', 'Trung', 1310),
('Bình Định', 'Trung', 1560),
('Phú Yên', 'Trung', 950),
('Khánh Hoà', 'Trung', 1280),
('Ninh Thuận', 'Trung', 620),
('Bình Thuận', 'Trung', 1300),
('Gia Lai', 'Trung', 1560),
('Kon Tum', 'Trung', 580),
('Đắk Lắk', 'Trung', 2050),
('Đắk Nông', 'Trung', 680),
('Lâm Đồng', 'Trung', 1350),

-- MIỀN NAM (19 tỉnh/thành)
('TP. Hồ Chí Minh', 'Nam', 9500),
('Bình Dương', 'Nam', 2700),
('Đồng Nai', 'Nam', 3250),
('Bà Rịa - Vũng Tàu', 'Nam', 1200),
('Long An', 'Nam', 1750),
('Tây Ninh', 'Nam', 1200),
('Bình Phước', 'Nam', 1050),
('Tiền Giang', 'Nam', 1800),
('Bến Tre', 'Nam', 1300),
('Vĩnh Long', 'Nam', 1060),
('Trà Vinh', 'Nam', 1060),
('Đồng Tháp', 'Nam', 1700),
('An Giang', 'Nam', 1950),
('Kiên Giang', 'Nam', 1850),
('Cần Thơ', 'Nam', 1280),
('Hậu Giang', 'Nam', 800),
('Sóc Trăng', 'Nam', 1350),
('Bạc Liêu', 'Nam', 920),
('Cà Mau', 'Nam', 1250)
ON CONFLICT (province) DO NOTHING;

-- Verify
SELECT region, count(*) as provinces, sum(population) as total_population
FROM province_market_data
GROUP BY region
ORDER BY region;
