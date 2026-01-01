/*
  SEED DATA FOR TELESALES (ROBUST V2)
  - Target: telesales@lyhu.vn (User must exist in Auth)
  - Cleanup: Removes 'Seed%' tasks, customers, deals to prevent duplicates.
  - Inserts:
    1. Customers (CRM Contacts)
    2. Telesales Tasks (Inbox, Today, Overdue)
    3. CRM Deals (Pipeline)
    4. Orders (Earnings)
*/

do $$
declare
  v_target_email text := 'telesales@lyhu.vn'; 
  v_uid uuid;
  v_cust1_id uuid;
  v_cust2_id uuid;
  v_cust3_id uuid;
begin

  -- 1. Get UID (Strict single row)
  select id into v_uid 
  from auth.users 
  where email = v_target_email 
  order by created_at desc 
  limit 1;
  
  if v_uid is null then
    raise exception 'Error: User % not found. Please create this user first.', v_target_email;
  end if;

  raise notice 'Seeding for User ID: % (%)', v_uid, v_target_email;

  -- 2. Cleanup Old Seed Data
  delete from public.telesales_tasks where title like '%(Seed)%';
  delete from public.crm_deals where deal_name like '%(Seed)%';
  delete from public.orders where customer_name like '%(Seed)%';
  delete from public.customers where full_name like '%(Seed)%';

  -- 3. Insert Customers
  insert into public.customers (full_name, phone, address, created_by, created_at)
  values 
    ('Nguyễn Văn Seed A', '0901112223', 'Hà Nội', v_uid, now()),
    ('Trần Thị Seed B', '0901112224', 'HCM', v_uid, now()),
    ('Lê Văn Seed C', '0901112225', 'Đà Nẵng', v_uid, now())
  returning id into v_cust1_id;
  
  -- (Get IDs for logic - simple trick: assumes sequential or just use returned id for first one and query others if needed, 
  -- but strictly we can just insert one by one to get IDs easily in PL/PGSQL blocks)
  
  select id into v_cust2_id from public.customers where phone = '0901112224' limit 1;
  select id into v_cust3_id from public.customers where phone = '0901112225' limit 1;

  -- 4. Insert Telesales Tasks
  -- Task 1: Inbox (New Lead)
  insert into public.telesales_tasks (
    user_id, title, customer_name, phone, note, status, priority, type, created_at, order
  ) values (
    v_uid, 'Gọi chào hàng (Seed)', 'Nguyễn Văn Seed A', '0901112223', 'Khách mới từ Marketing', 
    'inbox', 'normal', 'task', now(), 1000
  );

  -- Task 2: Today (Follow up)
  insert into public.telesales_tasks (
    user_id, title, customer_name, phone, note, status, priority, type, due_date, created_at, order
  ) values (
    v_uid, 'Nhắc lịch hẹn (Seed)', 'Trần Thị Seed B', '0901112224', 'Khách hẹn chiều nay', 
    'today', 'high', 'task', now(), now(), 2000
  );

  -- Task 3: Overdue
  insert into public.telesales_tasks (
    user_id, title, customer_name, phone, note, status, priority, type, due_date, created_at, order
  ) values (
    v_uid, 'Gọi lại gấp (Seed)', 'Lê Văn Seed C', '0901112225', 'Quá hạn 1 ngày', 
    'today', 'urgent', 'task', (now() - interval '1 day'), now(), 3000
  );

  -- 5. Insert CRM Deals
  insert into public.crm_deals (
    owner_user_id, customer_id, deal_name, amount, stage, expected_close_date, probability, created_at
  ) values (
    v_uid, v_cust2_id, 'Đơn hàng tháng 12 (Seed)', 5000000, 'negotiation', (now() + interval '5 days'), 60, now()
  );

  -- 6. Insert Orders (Confirmed)
  insert into public.orders (
    telesales_user_id, customer_id, customer_name, customer_phone, 
    status, total_amount, commission_amount, created_at
  ) values (
    v_uid, v_cust3_id, 'Lê Văn Seed C', '0901112225', 
    'completed', 2500000, 250000, (now() - interval '2 days')
  );

  raise notice 'Seed completed successfully for %', v_target_email;

end $$;
