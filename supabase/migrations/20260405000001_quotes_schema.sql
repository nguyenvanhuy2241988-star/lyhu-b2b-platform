-- =====================================================
-- QUOTES (Báo giá) Schema - LYHU CRM
-- =====================================================

-- 1. Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    readable_id SERIAL,
    customer_id UUID,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    discount_type TEXT DEFAULT 'amount' CHECK (discount_type IN ('amount', 'percent')),
    vat_percent NUMERIC(5,2) DEFAULT 0,
    shipping_fee NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,
    valid_until TIMESTAMPTZ,
    notes TEXT,
    terms TEXT,
    converted_order_id UUID,
    created_by UUID REFERENCES auth.users(id),
    creator_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "quotes_select_all" ON quotes FOR SELECT USING (true);
CREATE POLICY "quotes_insert_auth" ON quotes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "quotes_update_auth" ON quotes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "quotes_delete_auth" ON quotes FOR DELETE USING (auth.uid() IS NOT NULL);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);

-- 5. RPC: Fetch quotes
CREATE OR REPLACE FUNCTION fetch_quotes(p_status TEXT DEFAULT NULL, p_limit INT DEFAULT 100)
RETURNS SETOF quotes
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT *
    FROM quotes
    WHERE (p_status IS NULL OR status = p_status)
    ORDER BY created_at DESC
    LIMIT p_limit;
$$;

-- 6. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE quotes;

-- Verify
SELECT 'quotes_schema_ready' AS status, count(*) AS existing_rows FROM quotes;
