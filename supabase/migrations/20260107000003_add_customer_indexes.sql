-- Create indexes for location columns to speed up filtering
CREATE INDEX IF NOT EXISTS idx_customers_province ON customers(province);
CREATE INDEX IF NOT EXISTS idx_customers_district ON customers(district);
CREATE INDEX IF NOT EXISTS idx_customers_ward ON customers(ward);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
