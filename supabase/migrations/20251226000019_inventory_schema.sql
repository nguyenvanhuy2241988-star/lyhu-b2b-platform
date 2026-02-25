-- INVENTORY & PRODUCT WAREHOUSE SCHEMA
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. ENHANCE PRODUCTS TABLE
-- =====================================================
-- Add fields for inventory management if they don't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0; -- Giá vốn
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level int DEFAULT 5; -- Định mức tồn kho tối thiểu (báo động)
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'cái'; -- Đơn vị tính
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0; -- Cân nặng (g) hỗ trợ tính phí ship

-- =====================================================
-- 2. CREATE WAREHOUSES TABLE (Kho hàng)
-- =====================================================
CREATE TABLE IF NOT EXISTS warehouses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    code text UNIQUE NOT NULL, -- Mã kho (VD: KHO-HN-01)
    address text,
    manager_user_id uuid, -- Thủ kho
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Seed Default Warehouse
INSERT INTO warehouses (name, code, address, status)
VALUES ('Kho Tổng Hà Nội', 'MAIN-HN', 'Hà Nội', 'active')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 3. CREATE INVENTORY LEVELS (Tồn kho thực tế)
-- =====================================================
-- Stores the current state of stock per product per warehouse
CREATE TABLE IF NOT EXISTS inventory_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    
    quantity_on_hand int DEFAULT 0,    -- Tồn thực tế (trong kho)
    quantity_committed int DEFAULT 0,  -- Đang giữ hàng (cho đơn chưa đi)
    quantity_available int GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED, -- Có thể bán (Tự động tính)
    
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(warehouse_id, product_id)
);

-- =====================================================
-- 4. CREATE INVENTORY TRANSACTIONS (Lịch sử biến động)
-- =====================================================
-- Logs every single change for audit and accounting
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id uuid REFERENCES warehouses(id),
    product_id uuid REFERENCES products(id),
    
    type text NOT NULL, -- inbound (nhập), outbound (xuất), reserve (giữ), release (nhả giữ), adjustment (kiểm kê)
    quantity int NOT NULL, -- Số lượng thay đổi (+ hoặc -)
    
    reference_type text, -- order, purchase_order, return, audit
    reference_id uuid, -- ID của đơn hàng hoặc phiếu nhập
    note text,
    
    performed_by uuid, -- User thực hiện
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 5. CREATE CRM DEAL ITEMS (Sản phẩm trong Cơ hội)
-- =====================================================
-- Link Products to Deals as requested in previous step
CREATE TABLE IF NOT EXISTS crm_deal_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid REFERENCES crm_deals(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id),
    
    quantity int DEFAULT 1,
    unit_price numeric DEFAULT 0,
    total_amount numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
    
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 6. INDEXES & RLS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_inventory_levels_product ON inventory_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_deal_items_deal ON crm_deal_items(deal_id);

-- Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deal_items ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development (DROP first to maintain idempotency)

-- Warehouses
DROP POLICY IF EXISTS warehouses_all ON warehouses;
CREATE POLICY warehouses_all ON warehouses FOR ALL USING (true) WITH CHECK (true);

-- Inventory Levels
DROP POLICY IF EXISTS inventory_levels_all ON inventory_levels;
CREATE POLICY inventory_levels_all ON inventory_levels FOR ALL USING (true) WITH CHECK (true);

-- Inventory Transactions
DROP POLICY IF EXISTS inventory_transactions_all ON inventory_transactions;
CREATE POLICY inventory_transactions_all ON inventory_transactions FOR ALL USING (true) WITH CHECK (true);

-- CRM Deal Items
DROP POLICY IF EXISTS crm_deal_items_all ON crm_deal_items;
CREATE POLICY crm_deal_items_all ON crm_deal_items FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 7. VERIFY
-- =====================================================
SELECT 'Inventory Schema created successfully' as message;
