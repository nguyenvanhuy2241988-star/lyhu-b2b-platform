-- CRM Leads - Table Creation + RLS Policies
-- Step 1: Create Table (if not exists)
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  customer_name TEXT,
  phone TEXT,
  company TEXT,
  stage TEXT DEFAULT 'new_data',
  priority TEXT DEFAULT 'normal',
  due_date DATE,
  note TEXT,
  "order" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='crm_leads' AND column_name='assigned_to') THEN
    ALTER TABLE crm_leads ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='crm_leads' AND column_name='user_id') THEN
    ALTER TABLE crm_leads ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Step 3: Enable RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can view assigned leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can create leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can update assigned leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can delete assigned leads" ON crm_leads;

-- Step 5: Create RLS Policies
drop policy if exists "Users can view assigned leads" on crm_leads;
CREATE POLICY "Users can view assigned leads"
  ON crm_leads
  FOR SELECT
  USING (assigned_to = auth.uid() OR user_id = auth.uid());

drop policy if exists "Users can create leads" on crm_leads;
CREATE POLICY "Users can create leads"
  ON crm_leads
  FOR INSERT
  WITH CHECK (assigned_to = auth.uid() OR user_id = auth.uid());

drop policy if exists "Users can update assigned leads" on crm_leads;
CREATE POLICY "Users can update assigned leads"
  ON crm_leads
  FOR UPDATE
  USING (assigned_to = auth.uid() OR user_id = auth.uid())
  WITH CHECK (assigned_to = auth.uid() OR user_id = auth.uid());

drop policy if exists "Users can delete assigned leads" on crm_leads;
CREATE POLICY "Users can delete assigned leads"
  ON crm_leads
  FOR DELETE
  USING (assigned_to = auth.uid() OR user_id = auth.uid());
