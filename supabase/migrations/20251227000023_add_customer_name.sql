-- Add customer_name column to orders table
-- This allows storing customer name directly without FK lookup

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;

-- Update existing orders to have a placeholder name
UPDATE orders SET customer_name = 'Khách hàng' WHERE customer_name IS NULL;

SELECT 'Added customer_name column to orders' as status;
