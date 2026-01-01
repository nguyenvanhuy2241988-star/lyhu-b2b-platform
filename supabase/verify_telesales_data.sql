-- VERIFY TELESALES DATA INTEGRITY
-- Run this in Supabase SQL Editor to check if data is assigned to the correct UID.

-- 1. Check Leads (assigned_to must match your AUTH_UID)
select id, name, assigned_to, telesales_status, created_at
from public.leads
order by created_at desc
limit 20;

-- 2. Check Orders (telesales_user_id must match your AUTH_UID)
select id, telesales_user_id, lead_id, total_amount, status, created_at
from public.orders
order by created_at desc
limit 20;
