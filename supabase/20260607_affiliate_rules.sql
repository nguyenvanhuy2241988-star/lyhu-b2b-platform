-- Create Affiliate Commission Rules Table
CREATE TABLE IF NOT EXISTS affiliate_commission_rules (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    affiliate_id uuid REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    brand text,
    category text,
    commission_rate numeric NOT NULL DEFAULT 0,
    priority integer NOT NULL DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note:
-- If affiliate_id is NULL, rule applies to all affiliates
-- If product_id is NULL, rule applies to all products (unless brand or category is specified)
-- Higher priority number takes precedence when multiple rules match

-- Enable RLS
ALTER TABLE affiliate_commission_rules ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin Full Access Affiliate Rules" 
ON affiliate_commission_rules FOR ALL 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Affiliates can read active rules
CREATE POLICY "Affiliates can read active rules" 
ON affiliate_commission_rules FOR SELECT 
USING (is_active = true AND (affiliate_id IS NULL OR affiliate_id IN (SELECT id FROM affiliate_profiles WHERE user_id = auth.uid())));
