-- Add RLS policies for crm_leads table
-- Enable RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their assigned leads
drop policy if exists "Users can view assigned leads" on crm_leads;
CREATE POLICY "Users can view assigned leads"
  ON crm_leads
  FOR SELECT
  USING (assigned_to = auth.uid());

-- Policy: Users can insert leads (assigned to themselves)
drop policy if exists "Users can create leads" on crm_leads;
CREATE POLICY "Users can create leads"
  ON crm_leads
  FOR INSERT
  WITH CHECK (assigned_to = auth.uid());

-- Policy: Users can update their assigned leads
drop policy if exists "Users can update assigned leads" on crm_leads;
CREATE POLICY "Users can update assigned leads"
  ON crm_leads
  FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Policy: Users can delete their assigned leads
drop policy if exists "Users can delete assigned leads" on crm_leads;
CREATE POLICY "Users can delete assigned leads"
  ON crm_leads
  FOR DELETE
  USING (assigned_to = auth.uid());
