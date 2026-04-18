-- =============================================
-- B2B Support Chat: Rooms + Messages
-- =============================================

-- 1. Support Rooms
CREATE TABLE IF NOT EXISTS b2b_support_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_session_id TEXT, -- For guest users (localStorage key)
    customer_name TEXT NOT NULL DEFAULT 'Khách hàng',
    customer_phone TEXT,
    customer_email TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    unread_admin INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Support Messages
CREATE TABLE IF NOT EXISTS b2b_support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES b2b_support_rooms(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
    sender_name TEXT NOT NULL DEFAULT 'Khách hàng',
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_type TEXT, -- 'image' or 'file'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_b2b_support_rooms_customer_id ON b2b_support_rooms(customer_id);
CREATE INDEX IF NOT EXISTS idx_b2b_support_rooms_guest_session ON b2b_support_rooms(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_b2b_support_rooms_status ON b2b_support_rooms(status);
CREATE INDEX IF NOT EXISTS idx_b2b_support_messages_room_id ON b2b_support_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_b2b_support_messages_created ON b2b_support_messages(created_at);

-- 4. Enable RLS
ALTER TABLE b2b_support_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_support_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for b2b_support_rooms

-- Anon users can create rooms
CREATE POLICY "anon_insert_rooms" ON b2b_support_rooms
    FOR INSERT TO anon WITH CHECK (true);

-- Anon users can read rooms by guest_session_id (checked in app)
CREATE POLICY "anon_select_rooms" ON b2b_support_rooms
    FOR SELECT TO anon USING (true);

-- Authenticated customers can see their own rooms
CREATE POLICY "customer_select_own_rooms" ON b2b_support_rooms
    FOR SELECT TO authenticated USING (
        customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
    );

-- Authenticated customers can create rooms
CREATE POLICY "customer_insert_rooms" ON b2b_support_rooms
    FOR INSERT TO authenticated WITH CHECK (true);

-- Admin can update rooms (close, etc)
CREATE POLICY "admin_update_rooms" ON b2b_support_rooms
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
    );

-- 6. RLS Policies for b2b_support_messages

-- Anon users can insert messages
CREATE POLICY "anon_insert_messages" ON b2b_support_messages
    FOR INSERT TO anon WITH CHECK (true);

-- Anon users can read messages
CREATE POLICY "anon_select_messages" ON b2b_support_messages
    FOR SELECT TO anon USING (true);

-- Authenticated: customers see own room messages, admin/manager see all
CREATE POLICY "auth_select_messages" ON b2b_support_messages
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM b2b_support_rooms r
            WHERE r.id = room_id
            AND (r.customer_id = auth.uid()
                 OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')))
        )
    );

-- Authenticated can insert messages
CREATE POLICY "auth_insert_messages" ON b2b_support_messages
    FOR INSERT TO authenticated WITH CHECK (true);

-- 7. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE b2b_support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE b2b_support_rooms;
