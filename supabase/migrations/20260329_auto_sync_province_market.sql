-- ═══════════════════════════════════════════════════════════════
-- AUTO-SYNC: province_market_data từ customers + orders
-- 1. Function sync toàn bộ (chạy 1 lần để backfill)
-- 2. Trigger tự động khi có đơn hàng mới
-- ═══════════════════════════════════════════════════════════════

-- =====================================================
-- FUNCTION: Sync toàn bộ province_market_data từ customers có đơn
-- =====================================================
CREATE OR REPLACE FUNCTION sync_province_market_from_customers()
RETURNS void AS $$
BEGIN
  -- Cập nhật has_npp, npp_name cho các tỉnh có customer type='npp' đã lên đơn
  UPDATE province_market_data pm
  SET
    has_npp = true,
    npp_name = sub.npp_names,
    npp_status = 'active',
    updated_at = now()
  FROM (
    SELECT
      c.province,
      string_agg(DISTINCT c.name, ', ' ORDER BY c.name) as npp_names
    FROM customers c
    INNER JOIN orders o ON o.customer_id = c.id
    WHERE c.type = 'npp'
      AND c.province IS NOT NULL
      AND c.province != ''
      AND o.status NOT IN ('cancelled')
    GROUP BY c.province
  ) sub
  WHERE pm.province = sub.province;

  -- Cũng cập nhật cho customers type='npp' chưa có đơn nhưng đã tồn tại
  UPDATE province_market_data pm
  SET
    has_npp = true,
    npp_name = COALESCE(pm.npp_name, sub.npp_names),
    npp_status = CASE
      WHEN pm.npp_status = 'active' THEN 'active'  -- giữ active nếu đã active
      ELSE 'pending'
    END,
    updated_at = now()
  FROM (
    SELECT
      c.province,
      string_agg(DISTINCT c.name, ', ' ORDER BY c.name) as npp_names
    FROM customers c
    WHERE c.type = 'npp'
      AND c.province IS NOT NULL
      AND c.province != ''
      AND NOT EXISTS (
        SELECT 1 FROM orders o
        WHERE o.customer_id = c.id AND o.status NOT IN ('cancelled')
      )
    GROUP BY c.province
  ) sub
  WHERE pm.province = sub.province
    AND pm.has_npp = false;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Sync 1 tỉnh khi có đơn mới (dùng cho trigger)
-- =====================================================
CREATE OR REPLACE FUNCTION sync_province_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_province TEXT;
  v_customer_type TEXT;
  v_customer_name TEXT;
BEGIN
  -- Lấy thông tin customer của đơn hàng mới
  SELECT province, type, name
  INTO v_province, v_customer_type, v_customer_name
  FROM customers
  WHERE id = NEW.customer_id;

  -- Chỉ xử lý nếu customer là NPP và có province
  IF v_customer_type = 'npp' AND v_province IS NOT NULL AND v_province != '' THEN
    -- Cập nhật province_market_data
    UPDATE province_market_data
    SET
      has_npp = true,
      npp_name = CASE
        WHEN npp_name IS NULL OR npp_name = '' THEN v_customer_name
        WHEN npp_name NOT LIKE '%' || v_customer_name || '%' THEN npp_name || ', ' || v_customer_name
        ELSE npp_name  -- đã có tên rồi, không thêm trùng
      END,
      npp_status = 'active',
      updated_at = now()
    WHERE province = v_province;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Tự động sync khi có đơn mới
-- =====================================================
DROP TRIGGER IF EXISTS trg_sync_province_on_order ON orders;
CREATE TRIGGER trg_sync_province_on_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_province_on_new_order();

-- =====================================================
-- CHẠY BACKFILL: Sync tất cả data cũ 1 lần
-- =====================================================
SELECT sync_province_market_from_customers();

-- Verify kết quả
SELECT province, has_npp, npp_name, npp_status
FROM province_market_data
WHERE has_npp = true
ORDER BY region, province;
