-- FIX PRODUCT PERMISSIONS FOR ACCOUNTANT
-- Enable RLS and grant explicit permissions

-- 1. Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (to ensure clean slate)
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_insert_admin" ON products;
DROP POLICY IF EXISTS "products_update_admin" ON products;
DROP POLICY IF EXISTS "products_delete_admin" ON products;
DROP POLICY IF EXISTS "products_write_admin_accountant" ON products;

-- 3. Create Policies

-- READ: Allow everyone to view products (including customers, sales, etc)
CREATE POLICY "products_select_all" 
ON products FOR SELECT 
USING (true);

-- WRITE (Insert, Update, Delete): Allow Admin and Accountant
CREATE POLICY "products_write_admin_accountant"
ON products FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'accountant')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'accountant')
    )
);

SELECT 'Fixed permissions for Accountant on Products table' as message;
