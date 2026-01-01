-- Add source column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('TELESALES', 'CUSTOMER', 'SALES', 'CTV', 'SHOPEE', 'TIKTOK', 'WEB', 'FACEBOOK', 'ZALO')) DEFAULT 'CUSTOMER';

-- Update existing rows if necessary (optional, defaults to CUSTOMER matches logic)
-- Create index for faster filtering by source
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);
