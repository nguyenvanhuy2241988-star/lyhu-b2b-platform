-- Add VAT and Note to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS vat NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS note TEXT;

-- Add Discount and Is_Gift to order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
