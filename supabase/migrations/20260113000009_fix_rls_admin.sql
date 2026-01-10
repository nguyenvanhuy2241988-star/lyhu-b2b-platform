-- Fix RLS: Ensure Admins can see ALL crm_deals and customers
-- Run this in Supabase SQL Editor

-- ==============================================================================
-- 1. CRM DEALS POLICIES
-- ==============================================================================
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (permissive drop)
DROP POLICY IF EXISTS "crm_deals_allow_all" ON crm_deals;
DROP POLICY IF EXISTS "Users can view assigned leads" ON crm_deals;
DROP POLICY IF EXISTS "Users can create leads" ON crm_deals;
DROP POLICY IF EXISTS "Users can update assigned leads" ON crm_deals;
DROP POLICY IF EXISTS "Users can delete assigned leads" ON crm_deals;
DROP POLICY IF EXISTS "Admins can do everything on crm_deals" ON crm_deals;
DROP POLICY IF EXISTS "Users can view own deals" ON crm_deals;
DROP POLICY IF EXISTS "Users can insert own deals" ON crm_deals;
DROP POLICY IF EXISTS "Users can update own deals" ON crm_deals;

-- Policy A: ADMINS / SALE_ADMINS -> FULL ACCESS
CREATE POLICY "Admins select all crm_deals"
ON crm_deals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sale_admin')
  )
);

CREATE POLICY "Admins insert all crm_deals"
ON crm_deals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sale_admin')
  )
);

CREATE POLICY "Admins update all crm_deals"
ON crm_deals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sale_admin')
  )
);

CREATE POLICY "Admins delete all crm_deals"
ON crm_deals FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sale_admin')
  )
);

-- Policy B: USERS -> OWN DATA ONLY
CREATE POLICY "Users select own crm_deals"
ON crm_deals FOR SELECT
USING (
  owner_user_id = auth.uid() 
  -- OR (assigned_to = auth.uid()) -- if you use another column
);

CREATE POLICY "Users insert own crm_deals"
ON crm_deals FOR INSERT
WITH CHECK (
  owner_user_id = auth.uid()
);

CREATE POLICY "Users update own crm_deals"
ON crm_deals FOR UPDATE
USING (owner_user_id = auth.uid());

-- ==============================================================================
-- 2. CUSTOMERS POLICIES
-- ==============================================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_allow_all" ON customers;
DROP POLICY IF EXISTS "Admins select all customers" ON customers;

-- Admin Policy
CREATE POLICY "Admins select all customers"
ON customers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sale_admin')
  )
);

CREATE POLICY "Admins all customers actions"
ON customers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'sale_admin')
  )
);

-- User Policy (View All Customers? Typically CRM users see all customers, or only own?)
-- Assuming for now: Users can View ALL customers, but maybe only Edit own.
-- Let's stick to View All for simplicity unless specified.
CREATE POLICY "Users view all customers"
ON customers FOR SELECT
USING (true);

-- User Policy (Edit Own Customers? - Needs 'created_by' or similar. 
-- Assuming customers are shared resource).
CREATE POLICY "Users insert customers"
ON customers FOR INSERT
WITH CHECK (true);

-- ==============================================================================
-- 3. FORCE REFRESH SCHEMA CACHE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
