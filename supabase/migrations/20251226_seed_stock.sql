-- SEED STOCK FOR TESTING
-- Run this in Supabase SQL Editor to fill your warehouse with 100 items for every product.

INSERT INTO inventory_levels (warehouse_id, product_id, quantity_on_hand, quantity_committed)
SELECT 
  (SELECT id FROM warehouses WHERE code = 'MAIN-HN' LIMIT 1),
  id,
  100, -- START WITH 100 ITEMS
  0
FROM products
ON CONFLICT (warehouse_id, product_id) 
DO UPDATE SET quantity_on_hand = 100, updated_at = now();

SELECT 'Stock seeded successfully: 100 items per product' as message;
