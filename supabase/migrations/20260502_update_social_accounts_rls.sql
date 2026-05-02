-- Update RLS for company_social_accounts to allow users to view accounts assigned to them

-- Add policy for select
CREATE POLICY "Users can view their assigned social accounts"
ON company_social_accounts
FOR SELECT
USING (
  assigned_to = auth.uid() OR
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
