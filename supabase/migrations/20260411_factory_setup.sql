-- ==============================================================================
-- Module: Factory Setup & Construction Project Management
-- Created: 2026-04-11
-- Description: Tracking tasks, expenses, and vendors for setting up a factory
-- ==============================================================================

-- 1. Thợ / Nhà thầu (Vendors)
CREATE TABLE IF NOT EXISTS factory_setup_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Mộc, Điện, Cấp thoát nước, Camera, Máy móc, khác...
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Công việc (Tasks - Kanban)
CREATE TABLE IF NOT EXISTS factory_setup_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo', -- todo, looking_for_vendor, doing, done
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    deadline TIMESTAMPTZ,
    vendor_id UUID REFERENCES factory_setup_vendors(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chi phí (Expenses & Budget)
CREATE TABLE IF NOT EXISTS factory_setup_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    category TEXT DEFAULT 'hardware', -- rent, hardware, electricity, machines, labor, other
    amount_expected NUMERIC(15,2) DEFAULT 0, -- Số tiền dự trù
    amount_actual NUMERIC(15,2) DEFAULT 0, -- Số tiền thực chi
    status TEXT DEFAULT 'pending', -- pending, deposit, paid
    payment_date TIMESTAMPTZ,
    vendor_id UUID REFERENCES factory_setup_vendors(id) ON DELETE SET NULL,
    task_id UUID REFERENCES factory_setup_tasks(id) ON DELETE SET NULL, -- Chi phí link với 1 task nào đó
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE factory_setup_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_setup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_setup_expenses ENABLE ROW LEVEL SECURITY;

-- Policies: Chỉ cho Admin và Accountant (nếu cần quản lý chi phí)
CREATE POLICY "Cho phép Admin đọc ghi" ON factory_setup_vendors FOR ALL
USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'accountant')
WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'accountant');

CREATE POLICY "Cho phép Admin đọc ghi task" ON factory_setup_tasks FOR ALL
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Cho phép Admin đọc ghi expenses" ON factory_setup_expenses FOR ALL
USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'accountant')
WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'accountant');

-- Trigger tự cập nhật updated_at
CREATE OR REPLACE FUNCTION update_factory_setup_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_timestamp_vendors
BEFORE UPDATE ON factory_setup_vendors
FOR EACH ROW EXECUTE PROCEDURE update_factory_setup_timestamp();

CREATE TRIGGER update_timestamp_tasks
BEFORE UPDATE ON factory_setup_tasks
FOR EACH ROW EXECUTE PROCEDURE update_factory_setup_timestamp();

CREATE TRIGGER update_timestamp_expenses
BEFORE UPDATE ON factory_setup_expenses
FOR EACH ROW EXECUTE PROCEDURE update_factory_setup_timestamp();
