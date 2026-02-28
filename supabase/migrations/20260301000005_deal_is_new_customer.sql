-- Add is_new_customer flag to crm_deals
-- This flag is set when a deal is created alongside a new customer
-- Used for accurate KPI tracking of self-sourced data

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'crm_deals' AND column_name = 'is_new_customer') THEN
        ALTER TABLE public.crm_deals ADD COLUMN is_new_customer BOOLEAN DEFAULT false;
    END IF;
END $$;
