-- Add tracking_url to marketing_posts
ALTER TABLE marketing_posts ADD COLUMN IF NOT EXISTS tracking_url text;

-- RPC to get Marketing Dashboard Stats
CREATE OR REPLACE FUNCTION get_marketing_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_campaigns_count integer;
  scheduled_posts_count integer;
  total_posts_count integer;
  total_budget numeric;
BEGIN
  -- Count active campaigns
  SELECT COUNT(*) INTO active_campaigns_count
  FROM marketing_campaigns
  WHERE status = 'active';

  -- Sum budget of active campaigns (or all campaigns? usually active + planning for this month, but let's stick to active for "Running")
  -- Let's sum budget of ALL campaigns for now to show "Total Budget", or just Active.
  -- Requirement says: "Tổng ngân sách đã tiêu và còn lại".
  -- Since we don't have "used" vs "remaining" detailed tracking yet, let's just sum the budget of Active campaigns as a proxy for "Current Active Budget".
  SELECT COALESCE(SUM(budget), 0) INTO total_budget
  FROM marketing_campaigns
  WHERE status = 'active';

  -- Count scheduled posts
  SELECT COUNT(*) INTO scheduled_posts_count
  FROM marketing_posts
  WHERE status = 'scheduled';

  -- Count total posts
  SELECT COUNT(*) INTO total_posts_count
  FROM marketing_posts;

  RETURN json_build_object(
    'active_campaigns', active_campaigns_count,
    'scheduled_posts', scheduled_posts_count,
    'total_posts', total_posts_count,
    'budget_active', total_budget
  );
END;
$$;
