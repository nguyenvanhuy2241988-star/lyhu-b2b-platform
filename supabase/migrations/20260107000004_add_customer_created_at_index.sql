-- Create index for created_at column to speed up date range filtering and sorting
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
