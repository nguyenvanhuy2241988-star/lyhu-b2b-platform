-- =============================================
-- Module: Hệ thống Chuỗi bán lẻ FMCG Toàn quốc
-- Created: 2026-04-10
-- Updated: 2026-04-11 (categories table, entered_outlets)
-- =============================================

-- ═══════════════════════════════════════════════
-- 1. Bảng loại hình chuỗi (dynamic categories)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS retail_chain_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    icon_name TEXT DEFAULT 'Store',
    color TEXT DEFAULT 'text-slate-600',
    bg TEXT DEFAULT 'bg-slate-50 border-slate-200',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for categories
ALTER TABLE retail_chain_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "retail_chain_categories_read" ON retail_chain_categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "retail_chain_categories_admin_insert" ON retail_chain_categories
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "retail_chain_categories_admin_update" ON retail_chain_categories
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "retail_chain_categories_admin_delete" ON retail_chain_categories
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed categories
INSERT INTO retail_chain_categories (key, label, icon_name, color, bg, sort_order) VALUES
('hypermarket', 'Đại siêu thị', 'Building2', 'text-blue-600', 'bg-blue-50 border-blue-200', 1),
('supermarket', 'Siêu thị', 'ShoppingBag', 'text-emerald-600', 'bg-emerald-50 border-emerald-200', 2),
('minimart', 'Cửa hàng tiện lợi', 'Store', 'text-orange-600', 'bg-orange-50 border-orange-200', 3),
('local', 'Chuỗi địa phương', 'Landmark', 'text-indigo-600', 'bg-indigo-50 border-indigo-200', 4),
('specialty', 'Đặc biệt / Cao cấp', 'Leaf', 'text-teal-600', 'bg-teal-50 border-teal-200', 5);

-- ═══════════════════════════════════════════════
-- 2. Bảng chuỗi bán lẻ
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS retail_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    category TEXT NOT NULL DEFAULT 'supermarket',
    status TEXT NOT NULL DEFAULT 'not_entered',
    -- status: 'entered' (đã vào), 'approaching' (đang tiếp cận), 'not_entered' (chưa vào)
    total_outlets INTEGER DEFAULT 0,
    entered_outlets INTEGER DEFAULT 0,
    -- entered_outlets: số điểm bán công ty đã vào được trong chuỗi
    regions TEXT[] DEFAULT '{}',
    provinces TEXT[] DEFAULT '{}',
    website TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_retail_chains_category ON retail_chains(category);
CREATE INDEX IF NOT EXISTS idx_retail_chains_status ON retail_chains(status);

-- 4. RLS
ALTER TABLE retail_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "retail_chains_read" ON retail_chains
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "retail_chains_admin_insert" ON retail_chains
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "retail_chains_admin_update" ON retail_chains
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "retail_chains_admin_delete" ON retail_chains
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ═══════════════════════════════════════════════
-- 5. Seed data: Chuỗi bán lẻ FMCG tại Việt Nam (Q1/2026)
-- ═══════════════════════════════════════════════
INSERT INTO retail_chains (name, category, status, total_outlets, entered_outlets, regions, provinces, website, notes) VALUES
-- ĐẠI SIÊU THỊ
('AEON Mall & AEON Supermarket', 'hypermarket', 'not_entered', 68, 0, ARRAY['north','south'], ARRAY['Hà Nội','Hải Phòng','Bắc Ninh','TP.HCM','Bình Dương','Long An','Thanh Hóa'], 'https://aeon.com.vn', '8 AEON Mall + 15 TTTM + 45 siêu thị vừa/nhỏ. Tập đoàn Nhật Bản'),
('Lotte Mart', 'hypermarket', 'not_entered', 15, 0, ARRAY['north','central','south'], ARRAY['Hà Nội','Đà Nẵng','TP.HCM','Đồng Nai','Khánh Hòa'], 'https://lottemart.com.vn', 'Chuỗi đại siêu thị Hàn Quốc'),
('MM Mega Market', 'hypermarket', 'not_entered', 21, 0, ARRAY['north','central','south'], ARRAY['Hà Nội','Hải Phòng','Đà Nẵng','TP.HCM','Cần Thơ','Nghệ An'], 'https://mmvietnam.com', 'Trước đây là Metro. Thuộc TCC Group (Thái Lan). Mở MM Supercenter Đà Nẵng 11/2025'),
('GO! / Big C', 'hypermarket', 'not_entered', 44, 0, ARRAY['north','central','south'], ARRAY['Hà Nội','Hải Phòng','Đà Nẵng','TP.HCM','Cần Thơ','Huế','Nha Trang'], 'https://www.bigc.vn', 'Thuộc Central Retail (Thái Lan). Hệ thống ~330 điểm bán tổng'),
('Emart (THACO)', 'hypermarket', 'not_entered', 3, 0, ARRAY['south'], ARRAY['TP.HCM','Bình Dương'], 'https://emart.com.vn', 'Thương hiệu Hàn Quốc, do THACO vận hành. Mục tiêu 10-20 siêu thị đến 2027'),

-- SIÊU THỊ
('WinMart (Masan)', 'supermarket', 'not_entered', 130, 0, ARRAY['north','central','south'], ARRAY['Hà Nội','TP.HCM','Đà Nẵng','Hải Phòng','Cần Thơ','Nghệ An','Thanh Hóa'], 'https://winmart.vn', 'Siêu thị lớn nhất VN. Thuộc WinCommerce/Masan. Tổng hệ thống 4.737 điểm bán'),
('Co.opmart (Saigon Co.op)', 'supermarket', 'not_entered', 130, 0, ARRAY['north','central','south'], ARRAY['TP.HCM','Bình Dương','Đồng Nai','Cần Thơ','Đà Nẵng','Huế','Vũng Tàu','Hà Nội'], 'https://www.co-opmart.com.vn', 'Hệ thống Saigon Co.op: 800+ điểm bán tổng'),
('Co.opXtra', 'supermarket', 'not_entered', 4, 0, ARRAY['south'], ARRAY['TP.HCM'], 'https://www.co-opmart.com.vn', 'Đại siêu thị thuộc Saigon Co.op'),
('Tops Market', 'supermarket', 'not_entered', 10, 0, ARRAY['south'], ARRAY['TP.HCM'], 'https://www.tops.com.vn', 'Thuộc Central Retail (Thái Lan). Nằm trong hệ thống 330 điểm bán'),
('Satramart / Satrafoods', 'supermarket', 'not_entered', 184, 0, ARRAY['south'], ARRAY['TP.HCM'], NULL, '4 siêu thị Satramart + ~180 cửa hàng Satrafoods. Thuộc Tổng Công ty TMSSG'),

-- CỬA HÀNG TIỆN LỢI / MINIMART
('WinMart+ / WiN (Masan)', 'minimart', 'not_entered', 4737, 0, ARRAY['north','central','south'], ARRAY['Hà Nội','TP.HCM','Đà Nẵng','Hải Phòng','Cần Thơ','Nghệ An','Bình Dương','Thanh Hóa'], 'https://winmart.vn', 'Chuỗi minimart lớn nhất VN. Mở 764 cửa hàng năm 2025. Mục tiêu +1000-1500 năm 2026'),
('Bách Hóa Xanh (MWG)', 'minimart', 'not_entered', 2758, 0, ARRAY['north','central','south'], ARRAY['TP.HCM','Bình Dương','Đồng Nai','Long An','Cần Thơ','Đà Nẵng','Khánh Hòa','Hà Nội'], 'https://www.bachhoaxanh.com', 'Thuộc Thế Giới Di Động. Mở 789 cửa hàng năm 2025, Bắc tiến từ T10/2025'),
('Circle K', 'minimart', 'not_entered', 500, 0, ARRAY['north','central','south'], ARRAY['Hà Nội','TP.HCM','Đà Nẵng','Cần Thơ','Bình Dương'], 'https://www.circlek.com.vn', 'Chuỗi tiện lợi Mỹ. Vào VN từ 2008, dẫn đầu chuỗi tiện lợi quốc tế'),
('GS25', 'minimart', 'not_entered', 400, 0, ARRAY['north','south'], ARRAY['Hà Nội','TP.HCM','Bình Dương'], 'https://gs25.com.vn', 'Chuỗi tiện lợi Hàn Quốc, thuộc Sơn Kim Group. Đạt 400 cửa hàng T11/2025'),
('Co.op Food (Saigon Co.op)', 'minimart', 'not_entered', 550, 0, ARRAY['central','south'], ARRAY['TP.HCM','Bình Dương','Đồng Nai','Cần Thơ','Long An'], NULL, 'Minimart thuộc Saigon Co.op. Nằm trong hệ thống 800+ điểm bán'),
('Ministop', 'minimart', 'not_entered', 190, 0, ARRAY['south'], ARRAY['TP.HCM','Bình Dương','Đồng Nai'], 'https://ministop.vn', 'Chuỗi tiện lợi Nhật Bản, thuộc Sojitz'),
('FamilyMart', 'minimart', 'not_entered', 160, 0, ARRAY['south'], ARRAY['TP.HCM','Bình Dương'], 'https://www.familymart.vn', 'Chuỗi tiện lợi Nhật Bản'),
('7-Eleven', 'minimart', 'not_entered', 130, 0, ARRAY['north','south'], ARRAY['TP.HCM','Hà Nội'], 'https://7-eleven.vn', 'Chuỗi tiện lợi Nhật Bản. Bắt đầu mở rộng ra Bắc năm 2025'),

-- ĐẶC BIỆT / ORGANIC / CAO CẤP
('Organica', 'specialty', 'not_entered', 10, 0, ARRAY['south'], ARRAY['TP.HCM'], 'https://organica.vn', 'Thực phẩm hữu cơ'),
('Annam Gourmet', 'specialty', 'not_entered', 8, 0, ARRAY['south'], ARRAY['TP.HCM'], 'https://annam-gourmet.com', 'Thực phẩm cao cấp nhập khẩu'),
('Rio (Central Retail)', 'specialty', 'not_entered', 4, 0, ARRAY['south'], ARRAY['TP.HCM'], NULL, 'Chuỗi specialty thuộc Central Retail'),
('Finelife (Saigon Co.op)', 'specialty', 'not_entered', 5, 0, ARRAY['south'], ARRAY['TP.HCM'], 'https://finelife.vn', 'Siêu thị cao cấp thuộc Saigon Co.op'),
('Homefarm', 'specialty', 'not_entered', 15, 0, ARRAY['north','south'], ARRAY['Hà Nội','TP.HCM'], NULL, 'Chuỗi thực phẩm nhập khẩu cao cấp'),

-- CHUỖI ĐỊA PHƯƠNG / KHU VỰC
('BRGMart (BRG Group)', 'local', 'not_entered', 80, 0, ARRAY['north'], ARRAY['Hà Nội','Hải Phòng','Hải Dương','Quảng Ninh','Hưng Yên'], 'https://brggroup.vn', 'Hợp nhất từ Intimex + Fivimart + HaproMart. Liên doanh BRG-Sumitomo'),
('FujiMart (BRG-Sumitomo)', 'local', 'not_entered', 12, 0, ARRAY['north'], ARRAY['Hà Nội'], 'https://fujimart.vn', 'Liên doanh BRG-Sumitomo (Nhật). Tiêu chí Fresh Everyday'),
('T-Mart', 'local', 'not_entered', 30, 0, ARRAY['north'], ARRAY['Hà Nội'], 'https://tmart.vn', 'Chuỗi siêu thị mini nội địa. Tập trung Hà Nội'),
('Lan Chi Mart', 'local', 'not_entered', 25, 0, ARRAY['north'], ARRAY['Hà Nội','Bắc Ninh','Hưng Yên'], 'https://lanchi.vn', 'Siêu thị ngoại thành. Thuộc hệ thống Central Retail'),
('Kingfoodmart (Seedcom)', 'local', 'not_entered', 100, 0, ARRAY['south'], ARRAY['TP.HCM','Bình Dương'], NULL, 'Siêu thị thực phẩm mini. Thuộc Seedcom. 100+ cửa hàng tại TP.HCM'),
('San Hà Foodstore', 'local', 'not_entered', 40, 0, ARRAY['south'], ARRAY['TP.HCM','Long An','Đồng Nai','Kiên Giang'], 'https://sanha.vn', 'Chuỗi thực phẩm từ trang trại đến bàn ăn'),
('Nova Market (NovaGroup)', 'local', 'not_entered', 10, 0, ARRAY['south'], ARRAY['TP.HCM','Bình Thuận'], NULL, 'Siêu thị thực phẩm thuộc NovaGroup'),
('Vissan Food Store', 'local', 'not_entered', 50, 0, ARRAY['south'], ARRAY['TP.HCM','Bình Dương','Đồng Nai'], 'https://vissan.com.vn', 'Chuỗi cửa hàng thực phẩm chế biến');
