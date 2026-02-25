-- Enable Realtime for CRM Deals
-- This ensures that changes made by Admin (or any user) are broadcasted to other connected clients
-- allowing the Kanban board to update instantly.

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE crm_deals;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

SELECT 'Realtime enabled for crm_deals' as status;
