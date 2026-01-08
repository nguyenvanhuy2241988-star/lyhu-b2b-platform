-- CHECK 1: Table exists?
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'app_settings'
    ) as table_exists;

-- CHECK 2: Column exists?
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'app_settings' 
        AND column_name = 'crm_columns'
    ) as column_exists;

-- CHECK 3: Row exists?
SELECT count(*) as row_count FROM app_settings;

-- CHECK 4: RLS Policies?
SELECT * FROM pg_policies WHERE tablename = 'app_settings';

-- CHECK 5: Current Data?
SELECT id, crm_columns FROM app_settings LIMIT 1;
