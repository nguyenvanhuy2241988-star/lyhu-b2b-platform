-- Update RPC to support Date Filtering
CREATE OR REPLACE FUNCTION get_campaign_performance_stats(
    start_date timestamptz DEFAULT NULL,
    end_date timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- We need to group by source_detail where source_category = 'MARKETING'
  -- source_detail format is 'campaign:UUID'
  -- We join with marketing_campaigns to get the title
  
  WITH campaign_stats AS (
    SELECT 
      split_part(d.source_detail, ':', 2)::uuid as campaign_id,
      count(*) as lead_count,
      coalesce(sum(d.expected_value), 0) as total_expected_value
    FROM crm_deals d
    WHERE d.source_category = 'MARKETING'
      AND d.source_detail LIKE 'campaign:%'
      -- Date Filtering Logic
      AND (start_date IS NULL OR d.created_at >= start_date)
      AND (end_date IS NULL OR d.created_at <= end_date)
    GROUP BY split_part(d.source_detail, ':', 2)::uuid
  )
  SELECT json_agg(
    json_build_object(
      'campaign_id', c.id,
      'title', c.title,
      'status', c.status,
      'lead_count', coalesce(s.lead_count, 0),
      'revenue', coalesce(s.total_expected_value, 0)
    ) ORDER BY coalesce(s.lead_count, 0) DESC
  ) INTO result
  FROM marketing_campaigns c
  LEFT JOIN campaign_stats s ON c.id = s.campaign_id
  WHERE c.status IN ('active', 'completed') -- Only show active or completed campaigns in report
  LIMIT 10; -- Top 10

  RETURN coalesce(result, '[]'::json);
END;
$$;
