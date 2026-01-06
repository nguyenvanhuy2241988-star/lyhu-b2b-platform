-- Create a table to store application settings
-- Id is a single row enforcement typically, or just use key-value pair approach. 
-- Here we use a single row approach for 'company_info' and 'bank_info' to keep it simple as per plan.

CREATE TABLE IF NOT EXISTS app_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    company_info jsonb NOT NULL DEFAULT '{}'::jsonb,
    bank_info jsonb NOT NULL DEFAULT '[]'::jsonb,
    CONSTRAINT app_settings_pkey PRIMARY KEY (id)
);

-- Policy to allow authenticated users to read settings (public info like company name)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users" ON app_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy to allow only admins to update settings
-- Assuming 'admin' role existence based on previous context
CREATE POLICY "Enable update access for admins only" ON app_settings
    FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() ->> 'role') = 'admin' OR 
        exists (
            select 1 from profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    )
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'admin' OR 
        exists (
            select 1 from profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Insert default row if not exists
INSERT INTO app_settings (company_info, bank_info)
SELECT 
    '{"name": "CÔNG TY TNHH LYHU", "address": "Số 123, Đường ABC, Quận XYZ, TP.HCM", "hotline": "1900 1234", "email": "contact@lyhu.vn", "website": "www.lyhu.vn"}'::jsonb,
    '[{"bankName": "Ngân hàng Á Châu (ACB)", "accountNumber": "12345678", "accountName": "CÔNG TY TNHH LYHU", "branch": "PGD ABC"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM app_settings);
