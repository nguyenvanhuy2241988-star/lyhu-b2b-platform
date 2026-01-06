-- Add payment_method to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'COD';

-- Add discount_type to order_items table to store whether it was 'percent' or 'amount'
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'amount';

-- Comment on columns
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method: COD, BANKING, DEBT';
COMMENT ON COLUMN public.order_items.discount_type IS 'Discount type: amount or percent';

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
