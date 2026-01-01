-- Create Orders and Order Items Tables
-- Run this in Supabase SQL Editor

-- 1. Create ORDERS Table
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    readable_id SERIAL, -- Auto-incrementing basic ID for humans
    customer_id uuid REFERENCES customers(id), -- Nullable if from guest/lead
    lead_id uuid REFERENCES leads(id), -- Nullable if from existing customer
    telesales_user_id uuid REFERENCES auth.users(id), -- Sales person
    
    total_amount numeric DEFAULT 0,
    status text DEFAULT 'pending', -- pending, processing, delivered, cancelled, draft
    source text DEFAULT 'TELESALES',
    note text,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Create ORDER ITEMS Table
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id),
    
    quantity int DEFAULT 1,
    price numeric DEFAULT 0, -- Unit price at time of purchase
    discount numeric DEFAULT 0,
    
    created_at timestamptz DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_telesales ON orders(telesales_user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- 4. Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive Policies (for Development)
DROP POLICY IF EXISTS "orders_allow_all" ON orders;
CREATE POLICY "orders_allow_all" ON orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_allow_all" ON order_items;
CREATE POLICY "order_items_allow_all" ON order_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

SELECT 'Orders Schema Created Successfully' as status;
