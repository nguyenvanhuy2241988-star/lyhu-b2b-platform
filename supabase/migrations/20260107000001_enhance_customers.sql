-- Add new columns to customers table for enhanced profiling
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS contact_person text,
ADD COLUMN IF NOT EXISTS zalo text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS tax_code text;

-- Add comments for documentation
COMMENT ON COLUMN customers.contact_person IS 'Name of the contact person if different from store name';
COMMENT ON COLUMN customers.zalo IS 'Zalo phone number';
COMMENT ON COLUMN customers.notes IS 'General notes about the customer';
COMMENT ON COLUMN customers.tax_code IS 'Tax identification number';
