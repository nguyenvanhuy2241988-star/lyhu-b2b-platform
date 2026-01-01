-- Enable RLS on public tables
alter table "public"."leads" enable row level security;
alter table "public"."orders" enable row level security;

-- Leads: Telesales can view their assigned leads
drop policy if exists "telesales_select_own_leads" on "public"."leads";
create policy "telesales_select_own_leads"
on "public"."leads"
for select
to authenticated
using (assigned_to = auth.uid());

-- Leads: Telesales can update their assigned leads (e.g. status)
drop policy if exists "telesales_update_own_leads" on "public"."leads";
create policy "telesales_update_own_leads"
on "public"."leads"
for update
to authenticated
using (assigned_to = auth.uid());

-- Orders: Telesales can view their own orders (and thus earnings)
-- Note: 'telesales_user_id' is used based on schema.sql
drop policy if exists "telesales_select_own_orders" on "public"."orders";
create policy "telesales_select_own_orders"
on "public"."orders"
for select
to authenticated
using (telesales_user_id = auth.uid());
