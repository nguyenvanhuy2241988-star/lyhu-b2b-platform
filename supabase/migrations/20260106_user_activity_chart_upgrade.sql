-- PHASE 2.5: CHART UPGRADE (Dynamic Aggregation)
-- Run this in Supabase SQL Editor

-- Update RPC to support interval aggregation (day/month/year)
CREATE OR REPLACE FUNCTION get_user_activity_history(
    p_user_id uuid,
    p_days int DEFAULT 7,
    p_interval text DEFAULT 'day' -- 'day', 'month', 'year'
)
RETURNS TABLE (
    date date,
    online_seconds bigint, -- Changed to bigint for aggregated sums
    path_summary text
) AS $$
BEGIN
    IF p_interval = 'day' THEN
        -- Default behavior: Daily data
        RETURN QUERY
        SELECT 
            uda.date,
            uda.online_seconds::bigint,
            uda.last_path as path_summary
        FROM user_daily_activities uda
        WHERE uda.user_id = p_user_id
        AND uda.date >= (CURRENT_DATE - (p_days || ' days')::interval)::date
        ORDER BY uda.date ASC;
    ELSE
        -- Aggregated behavior: Monthly/Yearly data
        RETURN QUERY
        SELECT 
            date_trunc(p_interval, uda.date)::date as agg_date,
            SUM(uda.online_seconds)::bigint as total_seconds,
            MAX(uda.last_path) as path_summary -- Just take one for reference
        FROM user_daily_activities uda
        WHERE uda.user_id = p_user_id
        AND uda.date >= (CURRENT_DATE - (p_days || ' days')::interval)::date
        GROUP BY agg_date
        ORDER BY agg_date ASC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
