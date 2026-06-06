-- Add affiliate_commission_rate to products
ALTER TABLE products ADD COLUMN affiliate_commission_rate numeric DEFAULT 0;

-- Optional: Drop the affiliate_commission_rules table if you ran the previous script
DROP TABLE IF EXISTS affiliate_commission_rules CASCADE;
