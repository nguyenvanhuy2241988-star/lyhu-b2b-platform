-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'telesales', 'customer', 'ctv')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Products Table
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sku text not null,
  price numeric not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Leads Table
create table leads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text,
  status text default 'new',
  assigned_to uuid references profiles(id),
  converted_customer_id uuid, -- Link to customers table if converted
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Customers Table
create table customers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text,
  email text,
  address text,
  assigned_to uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Orders Table
create table orders (
  id uuid default uuid_generate_v4() primary key,
  readable_id serial, -- Auto-incrementing readable ID (e.g., 1001, 1002)
  lead_id uuid references leads(id),
  customer_id uuid references customers(id),
  telesales_user_id uuid references profiles(id),
  status text default 'draft', -- draft, confirmed, delivered, cancelled, returned
  total_amount numeric default 0,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint order_source_check check (lead_id is not null or customer_id is not null)
);

-- 6. Order Items Table
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer default 1,
  price numeric not null,
  subtotal numeric generated always as (quantity * price) stored
);

-- 7. Tasks Table (for calls/activities)
create table telesales_tasks (
  id uuid default uuid_generate_v4() primary key,
  type text not null, -- 'call', 'meeting'
  status text default 'pending',
  assigned_to uuid references profiles(id),
  lead_id uuid references leads(id),
  outcome text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table profiles enable row level security;
alter table products enable row level security;
alter table leads enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table telesales_tasks enable row level security;

-- Admin: Full Access
create policy "Admin Full Access" on profiles for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admin Full Access Products" on products for all using (auth.uid() in (select id from profiles where role = 'admin'));
-- Repeat for other tables... simplified for brevity, assume admin has bypass or policies cover all.

-- Telesales: Own Data
create policy "Telesales View/Edit Own Leads" on leads for all using (assigned_to = auth.uid());
create policy "Telesales View/Edit Own Customers" on customers for all using (assigned_to = auth.uid());
create policy "Telesales View/Edit Own Orders" on orders for all using (telesales_user_id = auth.uid());
create policy "Telesales View/Edit Own Tasks" on telesales_tasks for all using (assigned_to = auth.uid());

-- Products: Readable by authenticated
create policy "Authenticated Read Products" on products for select using (auth.role() = 'authenticated');

-- Triggers & Functions

-- Handle Order Delivered
create or replace function handle_order_delivered()
returns trigger as $$
begin
  if new.status = 'delivered' and old.status != 'delivered' then
    -- Set delivered_at
    new.delivered_at = now();
    
    -- Convert Lead to Customer if needed
    if new.lead_id is not null and new.customer_id is null then
      -- Create Customer
      insert into customers (name, phone, assigned_to)
      select name, phone, assigned_to from leads where id = new.lead_id
      returning id into new.customer_id;
      
      -- Update Lead
      update leads set status = 'won', converted_customer_id = new.customer_id where id = new.lead_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_order_delivered
before update on orders
for each row execute procedure handle_order_delivered();

-- KPI View
create view kpi_daily as
select 
  telesales_user_id,
  date_trunc('day', created_at) as date,
  count(*) as total_orders,
  sum(case when status = 'delivered' then total_amount else 0 end) as revenue,
  count(case when status = 'delivered' then 1 end) as delivered_orders
from orders
group by telesales_user_id, date_trunc('day', created_at);
