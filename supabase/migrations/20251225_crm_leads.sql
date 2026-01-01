-- CRM Leads Table Migration
-- Creates table for managing lead pipeline with 11 stages

CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  customer_name TEXT,
  phone TEXT,
  company TEXT,
  stage TEXT DEFAULT 'new_data',
  priority TEXT DEFAULT 'normal',
  due_date DATE,
  assigned_to UUID,
  note TEXT,
  "order" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage ON crm_leads(stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);
