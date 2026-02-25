-- FIX MISSING PRODUCTS & STOCK
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS allows reading products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
drop policy if exists "Public read products" on products;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

-- 2. Insert Sample Products (if empty)
INSERT INTO products (name, sku, price, is_active, brand, unit)
VALUES 
('Bia Hà Nội (Thùng)', 'BHN-01', 250000, true, 'UHI', 'Thùng'),
('Bia Sài Gòn (Thùng)', 'BSG-01', 240000, true, 'UHI', 'Thùng'),
('Nước ngọt Coca (Két)', 'COCA-01', 180000, true, 'BOYO', 'Két'),
('Mì tôm Hảo Hảo (Thùng)', 'HH-01', 110000, true, 'CVT', 'Thùng'),
('Dầu ăn Cái Lân 1L', 'DA-01', 35000, true, 'LYHU', 'Chai')
ON CONFLICT DO NOTHING;

-- 3. Seed Stock for these products (100 items each)
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

SELECT 'Fixed Products and Stock successfully' as message;
