-- =====================================================
-- PROSPECT FINDER (admin)
-- Lập danh sách cửa hàng từ OpenStreetMap, bổ sung SĐT từ Google Places
-- (trong hạn mức miễn phí) và website/fanpage, chống trùng với CRM.
-- Chưa chia cho telesales: dữ liệu nằm trong bảng riêng cho admin xem.
-- =====================================================

-- 1. Chuẩn hóa SĐT Việt Nam về dạng 0xxxxxxxxx (dùng để so trùng)
CREATE OR REPLACE FUNCTION prospect_norm_phone(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN p IS NULL THEN NULL
        ELSE (
            SELECT CASE
                WHEN d ~ '^84[0-9]{9,10}$' THEN '0' || substr(d, 3)
                WHEN d ~ '^0[0-9]{9,10}$' THEN d
                ELSE NULL
            END
            FROM (SELECT regexp_replace(p, '[^0-9]', '', 'g') AS d) s
        )
    END
$$;

-- Index để tra trùng nhanh trên bảng customers
CREATE INDEX IF NOT EXISTS idx_customers_prospect_norm_phone
    ON customers (prospect_norm_phone(phone));

-- 2. Job quét
CREATE TABLE IF NOT EXISTS prospect_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by uuid,
    province text NOT NULL,
    district text,
    categories text[] NOT NULL DEFAULT '{}',
    status text NOT NULL DEFAULT 'running', -- running | completed | failed
    found_count int NOT NULL DEFAULT 0,
    inserted_count int NOT NULL DEFAULT 0,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Cửa hàng tiềm năng
CREATE TABLE IF NOT EXISTS prospects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES prospect_jobs(id) ON DELETE SET NULL,

    -- Định danh nguồn
    osm_type text,
    osm_id bigint,
    google_place_id text,

    -- Thông tin cửa hàng
    name text NOT NULL,
    category text,            -- khóa nhóm: tap_hoa, sieu_thi_mini, quan_an...
    address text,
    province text,
    district text,
    lat double precision,
    lng double precision,

    -- Liên hệ
    phone text,               -- đã chuẩn hóa 0xxxxxxxxx
    phone_raw text,
    phone_source text,        -- osm | google | website | facebook
    website text,
    facebook_url text,
    zalo text,
    email text,

    -- Làm giàu
    google_checked_at timestamptz,
    google_match text,        -- matched | no_match | skipped
    web_checked_at timestamptz,

    -- Chống trùng
    dup_status text NOT NULL DEFAULT 'new', -- new | dup_customer | dup_deal | dup_lead | dup_prospect
    dup_ref text,
    dup_checked_at timestamptz,

    -- Duyệt tay
    review_status text NOT NULL DEFAULT 'new', -- new | approved | rejected
    note text,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_prospects_osm
    ON prospects (osm_type, osm_id) WHERE osm_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_prospects_google_place
    ON prospects (google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospects_phone ON prospects (phone);
CREATE INDEX IF NOT EXISTS idx_prospects_job ON prospects (job_id);
CREATE INDEX IF NOT EXISTS idx_prospects_dup ON prospects (dup_status);

-- 4. Bộ đếm hạn mức Google theo tháng (chặn vượt hạn mức miễn phí)
CREATE TABLE IF NOT EXISTS prospect_google_quota (
    month text PRIMARY KEY,           -- 'YYYY-MM'
    calls int NOT NULL DEFAULT 0
);

-- Cộng quota nguyên tử; trả về true nếu còn đủ hạn mức
CREATE OR REPLACE FUNCTION prospect_try_use_quota(p_month text, p_amount int, p_limit int)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows int;
BEGIN
    INSERT INTO prospect_google_quota (month, calls) VALUES (p_month, 0)
    ON CONFLICT (month) DO NOTHING;

    UPDATE prospect_google_quota
    SET calls = calls + p_amount
    WHERE month = p_month AND calls + p_amount <= p_limit;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN v_rows > 0;
END;
$$;

-- 5. Tra trùng SĐT với customers, crm_deals (qua customer), marketing_leads
-- Trả về mỗi SĐT trùng kèm nguồn: customer | deal | lead
CREATE OR REPLACE FUNCTION prospect_find_phone_dups(p_phones text[])
RETURNS TABLE (phone text, kind text, ref text)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Khách hàng đã có
    RETURN QUERY
    SELECT p.ph, 'customer'::text, c.id::text
    FROM unnest(p_phones) AS p(ph)
    JOIN customers c ON prospect_norm_phone(c.phone) = p.ph;

    -- Deal CRM (đi qua khách hàng)
    RETURN QUERY
    SELECT p.ph, 'deal'::text, d.id::text
    FROM unnest(p_phones) AS p(ph)
    JOIN customers c ON prospect_norm_phone(c.phone) = p.ph
    JOIN crm_deals d ON d.customer_id = c.id;

    -- Lead marketing (Messenger/quảng cáo), nếu bảng tồn tại
    IF to_regclass('public.marketing_leads') IS NOT NULL THEN
        RETURN QUERY EXECUTE
            'SELECT p.ph, ''lead''::text, l.id::text
             FROM unnest($1) AS p(ph)
             JOIN marketing_leads l ON prospect_norm_phone(l.customer_phone) = p.ph'
        USING p_phones;
    END IF;
END;
$$;

-- 6. Bảo mật: chỉ truy cập qua API admin (service role). Không có policy
-- cho anon/authenticated nên client không đọc/ghi trực tiếp được.
ALTER TABLE prospect_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_google_quota ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON FUNCTION prospect_try_use_quota(text, int, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION prospect_find_phone_dups(text[]) FROM PUBLIC, anon, authenticated;
