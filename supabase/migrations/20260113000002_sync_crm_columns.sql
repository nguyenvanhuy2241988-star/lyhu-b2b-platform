-- 1. Create table if not exists (Idempotent)
CREATE TABLE IF NOT EXISTS app_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    company_info jsonb NOT NULL DEFAULT '{}'::jsonb,
    bank_info jsonb NOT NULL DEFAULT '[]'::jsonb,
    crm_columns jsonb DEFAULT NULL, -- New Column for storing Kanban Config
    CONSTRAINT app_settings_pkey PRIMARY KEY (id)
);

-- 2. Add crm_columns column if not exists (for existing table)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'crm_columns') THEN
        ALTER TABLE app_settings ADD COLUMN crm_columns jsonb DEFAULT NULL;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Allow everyone to READ
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON app_settings;
CREATE POLICY "Enable read access for all authenticated users" ON app_settings
    FOR SELECT TO authenticated USING (true);

-- Allow Admin to UPDATE (using role check)
DROP POLICY IF EXISTS "Enable update access for admins only" ON app_settings;
CREATE POLICY "Enable update access for admins only" ON app_settings
    FOR UPDATE TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
    )
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'admin' OR 
        exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
    );

-- Allow Admin to INSERT (if empty)
DROP POLICY IF EXISTS "Enable insert access for admins only" ON app_settings;
CREATE POLICY "Enable insert access for admins only" ON app_settings
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'admin' OR 
        exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
    );


-- 5. Force Enable Realtime for app_settings
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE app_settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
ALTER TABLE app_settings REPLICA IDENTITY FULL;

-- 6. Insert default row if empty
INSERT INTO app_settings (company_info)
SELECT '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

SELECT 'CRM Columns Sync Enabled' as status;
