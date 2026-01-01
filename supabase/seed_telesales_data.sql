-- SEED DATA FOR TELESALES (AUTO-DETECT USER)
-- Run this block in Supabase SQL Editor.

do $$
declare
  v_user_id uuid;
  v_lead_id uuid;
begin
  -- 1. Auto-detect the most recently created user (usually YOU)
  select id into v_user_id from auth.users order by created_at desc limit 1;

  if v_user_id is null then
    raise exception 'Error: No user found in auth.users. Please sign up in the app first.';
  end if;

  raise notice 'Seeding data for User ID: %', v_user_id;

  -- 2. Insert a LEAD assigned to this user
  insert into public.leads (name, phone, status, assigned_to, notes)
  values 
  ('Cửa Hàng Test (Auto-Seed)', '0999888777', 'new', v_user_id, 'Lead được tạo tự động để test')
  returning id into v_lead_id;

  raise notice 'Created Lead ID: %', v_lead_id;

  -- 3. Insert ORDERS linked to this Lead (Source = TELESALES)
  -- Order 1: Delivered (Revenue)
  insert into public.orders (lead_id, telesales_user_id, status, total_amount, created_at)
  values
  (v_lead_id, v_user_id, 'delivered', 1500000, now());

  -- Order 2: Pending
  insert into public.orders (lead_id, telesales_user_id, status, total_amount, created_at)
  values
  (v_lead_id, v_user_id, 'pending', 500000, now());

  raise notice 'Created 2 Orders for Telesales.';

end $$;
