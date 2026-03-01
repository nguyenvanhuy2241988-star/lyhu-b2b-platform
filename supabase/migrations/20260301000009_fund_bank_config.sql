-- Add fund_bank_config column to app_settings to store QR bank info
ALTER TABLE public.app_settings
    ADD COLUMN IF NOT EXISTS fund_bank_config JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Set default values
UPDATE public.app_settings
SET fund_bank_config = jsonb_build_object(
    'bankId', 'MB',
    'accountNo', '',
    'accountName', '',
    'monthlyAmount', 50000
)
WHERE fund_bank_config = '{}'::jsonb OR fund_bank_config IS NULL;
