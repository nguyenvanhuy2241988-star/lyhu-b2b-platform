-- Add order_index column to documents_folders for custom manual ordering
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents_folders' AND column_name = 'order_index') THEN
        ALTER TABLE public.documents_folders ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Reload postgrest schema
NOTIFY pgrst, 'reload schema';
