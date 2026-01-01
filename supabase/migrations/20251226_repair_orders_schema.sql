-- REPAIR ORDERS SCHEMA
-- Run this in Supabase SQL Editor

-- 1. Ensure ORDERS table exists and has all columns
CREATE TABLE IF NOT EXISTS orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid());

-- Safely add columns if they are missing
DO $$
BEGIN
    -- customer_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
        ALTER TABLE orders ADD COLUMN customer_id uuid REFERENCES customers(id);
    END IF;

    -- lead_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'lead_id') THEN
        ALTER TABLE orders ADD COLUMN lead_id uuid REFERENCES leads(id);
    END IF;

    -- telesales_user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'telesales_user_id') THEN
        ALTER TABLE orders ADD COLUMN telesales_user_id uuid REFERENCES auth.users(id);
    END IF;

    -- total_amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN
        ALTER TABLE orders ADD COLUMN total_amount numeric DEFAULT 0;
    END IF;

    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders ADD COLUMN status text DEFAULT 'pending';
    END IF;

    -- source
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'source') THEN
        ALTER TABLE orders ADD COLUMN source text DEFAULT 'TELESALES';
    END IF;
    
    -- note
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'note') THEN
        ALTER TABLE orders ADD COLUMN note text;
    END IF;

    -- timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'created_at') THEN
        ALTER TABLE orders ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
END $$;


-- 2. Ensure ORDER_ITEMS table exists (Re-run)
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id),
    
    quantity int DEFAULT 1,
    price numeric DEFAULT 0,
    discount numeric DEFAULT 0,
    
    created_at timestamptz DEFAULT now()
);

-- 3. Re-Create Indexes (Now safe because columns exist)
DROP INDEX IF EXISTS idx_orders_customer;
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

DROP INDEX IF EXISTS idx_orders_telesales;
CREATE INDEX IF NOT EXISTS idx_orders_telesales ON orders(telesales_user_id);

DROP INDEX IF EXISTS idx_order_items_order;
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 4. Re-Apply Permissions
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_allow_all" ON orders;
CREATE POLICY "orders_allow_all" ON orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_allow_all" ON order_items;
CREATE POLICY "order_items_allow_all" ON order_items FOR ALL USING (true) WITH CHECK (true);

SELECT 'Orders Schema Repaired Successfully' as status;
