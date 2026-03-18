-- Add role column to kpi_metric_definitions for role-specific KPI metrics
-- This allows Telesales and Sales GT (and future roles) to have separate KPI configurations

ALTER TABLE kpi_metric_definitions 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'telesales';

-- Set existing metrics to 'telesales' (they are all Telesales metrics currently)
UPDATE kpi_metric_definitions 
SET role = 'telesales' 
WHERE role IS NULL;

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_kpi_metric_definitions_role 
ON kpi_metric_definitions(role);
