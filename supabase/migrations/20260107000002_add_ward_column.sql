-- Add ward column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS ward text;

COMMENT ON COLUMN customers.ward IS 'Phường/Xã';
