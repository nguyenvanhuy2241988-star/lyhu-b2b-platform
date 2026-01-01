-- Odoo-Style CRM Schema - Simple Version
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. CREATE CUSTOMERS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    address text,
    type text DEFAULT 'tap_hoa',
    province text,
    district text,
    owner_user_id uuid,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. CREATE CRM_DEALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS crm_deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    stage text NOT NULL DEFAULT 'new_data',
    priority text DEFAULT 'normal',
    next_action_at timestamptz,
    note text,
    source text DEFAULT 'data_moi',
    tags text[],
    owner_user_id uuid NOT NULL,
    status text DEFAULT 'open',
    lost_reason text,
    expected_value numeric,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_customers_owner ON customers(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_crm_deals_owner ON crm_deals(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON crm_deals(status);
CREATE INDEX IF NOT EXISTS idx_crm_deals_customer ON crm_deals(customer_id);

-- =====================================================
-- 4. RLS POLICIES - Allow all for testing
-- =====================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS customers_all_policy ON customers;
DROP POLICY IF EXISTS crm_deals_all_policy ON crm_deals;

-- Create permissive policies for testing
CREATE POLICY customers_all_policy ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY crm_deals_all_policy ON crm_deals FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 5. DONE!
-- =====================================================

SELECT 'Odoo CRM schema created successfully!' as message;
