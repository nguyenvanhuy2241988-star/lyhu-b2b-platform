-- ============================================
-- Fair Lead Distribution (Schedule-Aware + Quota-Based)
-- Logic: Check shift_registrations for today → calculate quota → stop at quota
-- Update: Added 'admin' to eligible roles so Admin can receive leads when selected
-- ============================================

CREATE OR REPLACE FUNCTION get_online_eligible_telesales()
RETURNS TABLE(user_id uuid, full_name text) AS $$
DECLARE
    config_rec lead_distribution_config;
    v_total_eligible int;
    v_total_leads_today int;
    v_quota int;
BEGIN
    SELECT * INTO config_rec FROM lead_distribution_config WHERE id = 1;
    
    IF NOT config_rec.enabled THEN
        RETURN;
    END IF;

    -- Count total eligible users scheduled to work today
    -- (users who registered an approved shift for today)
    SELECT COUNT(DISTINCT sr.user_id) INTO v_total_eligible
    FROM shift_registrations sr
    WHERE sr.date = CURRENT_DATE
      AND sr.status = 'approved'
      AND sr.user_id = ANY(config_rec.eligible_user_ids);

    -- If nobody registered shifts today, fallback: count all eligible users
    IF v_total_eligible = 0 THEN
        v_total_eligible := array_length(config_rec.eligible_user_ids, 1);
        IF v_total_eligible IS NULL OR v_total_eligible = 0 THEN
            RETURN; -- No eligible users at all
        END IF;
    END IF;

    -- Count total leads assigned today (to calculate dynamic quota)
    SELECT COUNT(*) INTO v_total_leads_today
    FROM marketing_leads
    WHERE assigned_at::date = CURRENT_DATE
      AND status = 'assigned';

    -- Add pending leads to get total "to-be-distributed" count
    v_total_leads_today := v_total_leads_today + (
        SELECT COUNT(*) FROM marketing_leads WHERE status = 'pending'
    );

    -- Calculate quota per person (round up so nobody is shorted)
    -- Minimum quota of 1 to always allow at least 1 lead
    v_quota := GREATEST(CEIL(v_total_leads_today::numeric / v_total_eligible), 1);

    RETURN QUERY
    SELECT p.id, p.full_name
    FROM profiles p
    LEFT JOIN user_daily_activities uda ON p.id = uda.user_id AND uda.date = CURRENT_DATE
    LEFT JOIN LATERAL (
        -- Count how many leads this user already received today
        SELECT COUNT(*) as lead_count
        FROM marketing_leads ml
        WHERE ml.assigned_to = p.id
          AND ml.assigned_at::date = CURRENT_DATE
          AND ml.status = 'assigned'
    ) lc ON true
    WHERE p.id = ANY(config_rec.eligible_user_ids)
      AND p.role IN ('telesales', 'sale_admin', 'admin')  -- <--- THÊM ADMIN VÀO ĐÂY
      AND p.status = 'active'
      -- Online check: last_seen within 2 minutes
      AND (NOT config_rec.only_online OR uda.last_seen > (now() - interval '2 minutes'))
      -- Company IP check
      AND (
          NOT config_rec.only_company_ip 
          OR (
              uda.current_ip IS NOT NULL 
              AND uda.current_ip = ANY(config_rec.company_ips)
          )
      )
      -- QUOTA CHECK: only include users who haven't reached their quota
      AND lc.lead_count < v_quota
    -- ORDER BY least leads first (fairest first)
    ORDER BY lc.lead_count ASC, random();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
