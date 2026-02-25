-- FIX PRODUCT SCHEMA V3 (FINAL)
-- Run this in Supabase SQL Editor

-- 1. ENSURE ALL COLUMNS EXIST
-- We add every single column required by the App, ignoring if they exist.
ALTER TABLE products ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand text DEFAULT 'LHU';
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'Cái';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;

-- 2. CLEANUP & SEED
-- Insert Sample Products (avoiding constraint errors via ON CONFLICT)
INSERT INTO products (name, sku, price, is_active, brand, unit)
VALUES 
('Bia Hà Nội (Thùng)', 'BHN-01', 250000, true, 'UHI', 'Thùng'),
('Bia Sài Gòn (Thùng)', 'BSG-01', 240000, true, 'UHI', 'Thùng'),
('Nước ngọt Coca (Két)', 'COCA-01', 180000, true, 'BOYO', 'Két'),
('Mì tôm Hảo Hảo (Thùng)', 'HH-01', 110000, true, 'CVT', 'Thùng'),
('Dầu ăn Cái Lân 1L', 'DA-01', 35000, true, 'LYHU', 'Chai')
ON CONFLICT (sku) DO NOTHING;

-- 3. SEED STOCK
-- Ensure Warehouse Exists
INSERT INTO warehouses (name, code, address, status)
VALUES ('Kho Tổng Hà Nội', 'MAIN-HN', 'Hà Nội', 'active')
ON CONFLICT (code) DO NOTHING;

-- Fill Stock
INSERT INTO inventory_levels (warehouse_id, product_id, quantity_on_hand, quantity_committed)
SELECT 
  (SELECT id FROM warehouses WHERE code = 'MAIN-HN' LIMIT 1),
  id,
  100,
  0
FROM products
WHERE is_active = true
ON CONFLICT (warehouse_id, product_id) 
DO UPDATE SET quantity_on_hand = 100, updated_at = now();

SELECT 'Schema V3 applied: Added price, sku, brand. Stock seeded.' as message;
