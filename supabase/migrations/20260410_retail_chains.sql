-- =============================================
-- Module: Hệ thống Chuỗi Siêu thị Toàn quốc
-- Created: 2026-04-10
-- =============================================

-- 1. Bảng chuỗi bán lẻ
CREATE TABLE IF NOT EXISTS retail_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    category TEXT NOT NULL DEFAULT 'supermarket',
    -- category: 'hypermarket', 'supermarket', 'minimart', 'pharmacy', 'cosmetics', 'specialty'
    status TEXT NOT NULL DEFAULT 'not_entered',
    -- status: 'entered' (đã vào), 'approaching' (đang tiếp cận), 'not_entered' (chưa vào)
    total_outlets INTEGER DEFAULT 0,
    regions TEXT[] DEFAULT '{}',
    -- regions: array of 'north', 'central', 'south'
    provinces TEXT[] DEFAULT '{}',
    -- provinces: danh sách tỉnh/thành phố có mặt
    website TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_retail_chains_category ON retail_chains(category);
CREATE INDEX IF NOT EXISTS idx_retail_chains_status ON retail_chains(status);

-- 3. RLS
ALTER TABLE retail_chains ENABLE ROW LEVEL SECURITY;

-- Tất cả authenticated users đều đọc được
CREATE POLICY "retail_chains_read" ON retail_chains
    FOR SELECT TO authenticated USING (true);

-- Chỉ admin mới được thêm/sửa/xóa
CREATE POLICY "retail_chains_admin_insert" ON retail_chains
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "retail_chains_admin_update" ON retail_chains
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "retail_chains_admin_delete" ON retail_chains
    FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Seed data: Các chuỗi siêu thị phổ biến tại Việt Nam
INSERT INTO retail_chains (name, category, status, total_outlets, regions, provinces, website, notes) VALUES
-- ĐẠI SIÊU THỊ
('AEON Mall', 'hypermarket', 'not_entered', 7, ARRAY['north','south'], ARRAY['Hà Nội','Hải Phòng','Bắc Ninh','TP.HCM','Bình Dương','Long An','Hà Đông'], 'https://aeon.com.vn', 'Chuỗi đại siêu thị Nhật Bản'),
('Lotte Mart', 'hypermarket', 'not_entered', 15, ARRAY['north','central','south'], ARRAY['Hà Nội','Đà Nẵng','TP.HCM','Bình Dương','Đồng Nai'], 'https://lottemart.com.vn', 'Chuỗi đại siêu thị Hàn Quốc'),
('MM Mega Market', 'hypermarket', 'not_entered', 21, ARRAY['north','central','south'], ARRAY['Hà Nội','Hải Phòng','Đà Nẵng','TP.HCM','Cần Thơ','Nghệ An'], 'https://mmvietnam.com', 'Trước đây là Metro, thuộc TCC Group (Thái Lan)'),
('GO! / Big C', 'hypermarket', 'not_entered', 40, ARRAY['north','central','south'], ARRAY['Hà Nội','Hải Phòng','Đà Nẵng','TP.HCM','Cần Thơ','Huế','Nha Trang'], 'https://www.bigc.vn', 'Thuộc Central Retail (Thái Lan)'),
('Emart', 'hypermarket', 'not_entered', 5, ARRAY['south'], ARRAY['TP.HCM','Bình Dương'], 'https://emart.com.vn', 'Chuỗi đại siêu thị Hàn Quốc, thuộc THACO'),

-- SIÊU THỊ
('WinMart (Masan)', 'supermarket', 'not_entered', 130, ARRAY['north','central','south'], ARRAY['Hà Nội','TP.HCM','Đà Nẵng','Hải Phòng','Cần Thơ','Nghệ An','Thanh Hóa'], 'https://winmart.vn', 'Siêu thị lớn nhất Việt Nam, thuộc Masan'),
('Co.opmart', 'supermarket', 'not_entered', 120, ARRAY['central','south'], ARRAY['TP.HCM','Bình Dương','Đồng Nai','Cần Thơ','Đà Nẵng','Huế','Vũng Tàu'], 'https://www.co-opmart.com.vn', 'Thuộc Saigon Co.op'),
('Co.opXtra', 'supermarket', 'not_entered', 5, ARRAY['south'], ARRAY['TP.HCM'], 'https://www.co-opmart.com.vn', 'Đại siêu thị thuộc Saigon Co.op'),
('Tops Market', 'supermarket', 'not_entered', 8, ARRAY['south'], ARRAY['TP.HCM'], 'https://www.tops.com.vn', 'Thuộc Central Retail (Thái Lan)'),
('Satra Foods', 'supermarket', 'not_entered', 20, ARRAY['south'], ARRAY['TP.HCM'], NULL, 'Thuộc Tổng Công ty Thương mại Sài Gòn'),
('Lotte Food (Lotte Mart mini)', 'supermarket', 'not_entered', 10, ARRAY['south'], ARRAY['TP.HCM','Bình Dương'], NULL, 'Phiên bản nhỏ của Lotte'),

-- CỬA HÀNG TIỆN LỢI / MINIMART
('WinMart+ (Masan)', 'minimart', 'not_entered', 3200, ARRAY['north','central','south'], ARRAY['Hà Nội','TP.HCM','Đà Nẵng','Hải Phòng','Cần Thơ','Nghệ An','Bình Dương'], 'https://winmart.vn', 'Chuỗi minimart lớn nhất VN'),
('Bách Hóa Xanh', 'minimart', 'not_entered', 1700, ARRAY['central','south'], ARRAY['TP.HCM','Bình Dương','Đồng Nai','Long An','Cần Thơ','Đà Nẵng','Khánh Hòa'], 'https://www.bachhoaxanh.com', 'Thuộc Thế Giới Di Động'),
('GS25', 'minimart', 'not_entered', 250, ARRAY['north','south'], ARRAY['Hà Nội','TP.HCM','Bình Dương'], 'https://gs25.com.vn', 'Chuỗi tiện lợi Hàn Quốc, thuộc Sơn Kim Group'),
('Circle K', 'minimart', 'not_entered', 450, ARRAY['north','central','south'], ARRAY['Hà Nội','TP.HCM','Đà Nẵng','Cần Thơ','Bình Dương'], 'https://www.circlek.com.vn', 'Chuỗi tiện lợi Mỹ'),
('7-Eleven', 'minimart', 'not_entered', 80, ARRAY['south'], ARRAY['TP.HCM'], 'https://7-eleven.vn', 'Chuỗi tiện lợi Nhật Bản'),
('Ministop', 'minimart', 'not_entered', 150, ARRAY['south'], ARRAY['TP.HCM','Bình Dương'], 'https://ministop.vn', 'Chuỗi tiện lợi Nhật Bản, thuộc Sojitz'),
('FamilyMart', 'minimart', 'not_entered', 150, ARRAY['south'], ARRAY['TP.HCM','Bình Dương'], 'https://www.familymart.vn', 'Chuỗi tiện lợi Nhật Bản'),
('Co.op Food', 'minimart', 'not_entered', 500, ARRAY['central','south'], ARRAY['TP.HCM','Bình Dương','Đồng Nai','Cần Thơ'], NULL, 'Minimart thuộc Saigon Co.op'),
('Co.op Smile', 'minimart', 'not_entered', 100, ARRAY['south'], ARRAY['TP.HCM'], NULL, 'Tiện lợi Saigon Co.op'),

-- CHUỖI DƯỢC PHẨM
('Pharmacity', 'pharmacy', 'not_entered', 1100, ARRAY['north','central','south'], ARRAY['Hà Nội','TP.HCM','Đà Nẵng','Cần Thơ','Bình Dương'], 'https://www.pharmacity.vn', 'Chuỗi nhà thuốc lớn nhất VN'),
('Long Châu (FPT)', 'pharmacy', 'not_entered', 1800, ARRAY['north','central','south'], ARRAY['Hà Nội','TP.HCM','Đà Nẵng','Hải Phòng','Nghệ An','Cần Thơ'], 'https://nhathuoclongchau.com.vn', 'Thuộc FPT Retail'),
('An Khang', 'pharmacy', 'not_entered', 500, ARRAY['central','south'], ARRAY['TP.HCM','Bình Dương','Đồng Nai'], 'https://www.ankhang.vn', 'Thuộc Thế Giới Di Động'),
('Medicare', 'pharmacy', 'not_entered', 60, ARRAY['south'], ARRAY['TP.HCM'], NULL, NULL),

-- CHUỖI MỸ PHẨM
('Guardian', 'cosmetics', 'not_entered', 150, ARRAY['north','south'], ARRAY['Hà Nội','TP.HCM','Đà Nẵng'], 'https://www.guardian.com.vn', 'Thuộc Dairy Farm (Hồng Kông)'),
('Hasaki', 'cosmetics', 'not_entered', 130, ARRAY['north','central','south'], ARRAY['Hà Nội','TP.HCM','Đà Nẵng','Cần Thơ'], 'https://hasaki.vn', 'Chuỗi mỹ phẩm Việt Nam'),
('Watsons', 'cosmetics', 'not_entered', 60, ARRAY['north','south'], ARRAY['Hà Nội','TP.HCM'], 'https://www.watsons.vn', 'Thuộc AS Watson (Hồng Kông)'),

-- ĐẶC BIỆT / ORGANIC
('Organica', 'specialty', 'not_entered', 10, ARRAY['south'], ARRAY['TP.HCM'], 'https://organica.vn', 'Thực phẩm hữu cơ'),
('Annam Gourmet', 'specialty', 'not_entered', 8, ARRAY['south'], ARRAY['TP.HCM'], 'https://annam-gourmet.com', 'Thực phẩm cao cấp nhập khẩu'),
('Rio (Central Retail)', 'specialty', 'not_entered', 4, ARRAY['south'], ARRAY['TP.HCM'], NULL, 'Chuỗi specialty thuộc Central Retail');
