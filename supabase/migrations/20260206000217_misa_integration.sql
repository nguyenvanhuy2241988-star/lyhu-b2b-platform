-- Add MISA config to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS misa_config JSONB DEFAULT '{}'::jsonb;

-- Add MISA mapping codes
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS misa_code TEXT;

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS misa_code TEXT,
ADD COLUMN IF NOT EXISTS tax_code TEXT;

-- Add MISA sync status to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS misa_sync_status TEXT DEFAULT 'pending', -- pending, synced, failed
ADD COLUMN IF NOT EXISTS misa_ref_id TEXT,
ADD COLUMN IF NOT EXISTS misa_sync_error TEXT,
ADD COLUMN IF NOT EXISTS misa_last_sync_at TIMESTAMPTZ;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_misa_status ON public.orders(misa_sync_status);
