-- FIX PRODUCT SCHEMA & SEED DATA (V2)
-- Run this in Supabase SQL Editor

-- 1. ADD MISSING COLUMNS
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand text DEFAULT 'LHU';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update existing rows to have SKU if they are null
UPDATE products SET sku = 'SKU-' || substr(id::text, 1, 8) WHERE sku IS NULL;

-- Make SKU unique only after ensuring no nulls (optional, skipping constraint for safety for now)
-- ALTER TABLE products ADD CONSTRAINT products_sku_key UNIQUE (sku);

-- 2. INSERT SAMPLE PRODUCTS
INSERT INTO products (name, sku, price, is_active, brand, unit)
VALUES 
('Bia Hà Nội (Thùng)', 'BHN-01', 250000, true, 'UHI', 'Thùng'),
('Bia Sài Gòn (Thùng)', 'BSG-01', 240000, true, 'UHI', 'Thùng'),
('Nước ngọt Coca (Két)', 'COCA-01', 180000, true, 'BOYO', 'Két'),
('Mì tôm Hảo Hảo (Thùng)', 'HH-01', 110000, true, 'CVT', 'Thùng'),
('Dầu ăn Cái Lân 1L', 'DA-01', 35000, true, 'LYHU', 'Chai')
ON CONFLICT (id) DO NOTHING; 
-- Note: conflict on ID is unlikely for new inserts, but good practice. 
-- Schema doesn't enforce unique name/sku yet so duplicates might appear if run multiple times.
-- To prevent cleanup manual duplicates, we can check existence:

DELETE FROM products WHERE sku IN ('BHN-01', 'BSG-01', 'COCA-01', 'HH-01', 'DA-01');
INSERT INTO products (name, sku, price, is_active, brand, unit)
VALUES 
('Bia Hà Nội (Thùng)', 'BHN-01', 250000, true, 'UHI', 'Thùng'),
('Bia Sài Gòn (Thùng)', 'BSG-01', 240000, true, 'UHI', 'Thùng'),
('Nước ngọt Coca (Két)', 'COCA-01', 180000, true, 'BOYO', 'Két'),
('Mì tôm Hảo Hảo (Thùng)', 'HH-01', 110000, true, 'CVT', 'Thùng'),
('Dầu ăn Cái Lân 1L', 'DA-01', 35000, true, 'LYHU', 'Chai');

-- 3. SEED STOCK (100 items each)
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

SELECT 'Fixed Schema and Seeded Data successfully' as message;
