-- Create a function to calculate and update daily stats
CREATE OR REPLACE FUNCTION public.handle_recruitment_log_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  target_date DATE;
  
  -- Variables for counts
  cnt_fb_posts BIGINT;
  cnt_fb_comments BIGINT;
  cnt_fb_friends BIGINT;
  cnt_threads BIGINT; -- Placeholder if we add threads later
BEGIN
  -- Determine user and date based on operation
  IF (TG_OP = 'DELETE') THEN
    target_user_id := OLD.user_id;
    target_date := OLD.date;
  ELSE
    target_user_id := NEW.user_id;
    target_date := NEW.date;
  END IF;

  -- Calculate counts for this user and date
  SELECT 
    COUNT(*) FILTER (WHERE activity_type = 'post' AND platform IN ('facebook_group', 'facebook_page')),
    COUNT(*) FILTER (WHERE activity_type = 'comment'),
    COUNT(*) FILTER (WHERE activity_type = 'friend')
  INTO cnt_fb_posts, cnt_fb_comments, cnt_fb_friends
  FROM public.recruitment_post_logs
  WHERE user_id = target_user_id AND date = target_date;

  -- Upsert into daily activities
  INSERT INTO public.recruitment_daily_activities (user_id, date, fb_posts_free, fb_comments, fb_friends, updated_at)
  VALUES (target_user_id, target_date, cnt_fb_posts, cnt_fb_comments, cnt_fb_friends, NOW())
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    fb_posts_free = EXCLUDED.fb_posts_free,
    fb_comments = EXCLUDED.fb_comments,
    fb_friends = EXCLUDED.fb_friends,
    updated_at = NOW();

  RETURN NULL; -- Return value ignored for AFTER trigger
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_sync_recruitment_logs ON public.recruitment_post_logs;

-- Create trigger
CREATE TRIGGER trg_sync_recruitment_logs
AFTER INSERT OR UPDATE OR DELETE ON public.recruitment_post_logs
FOR EACH ROW
EXECUTE FUNCTION public.handle_recruitment_log_sync();

-- Run manual sync for existing data (optional, but good for cleanup)
-- (Looping through all logs just to trigger update might be heavy, so we skip it for now.
--  The user can manually add/edit one item to trigger sync for today).
