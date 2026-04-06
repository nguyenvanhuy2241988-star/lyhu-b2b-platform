-- ==========================================
-- SQL Script: Sync Media Briefs to Telesales Tasks
-- ==========================================

CREATE OR REPLACE FUNCTION sync_brief_to_task()
RETURNS TRIGGER AS $$
DECLARE
    task_status TEXT;
    task_exists BOOLEAN;
BEGIN
    -- Only process if record is not null (for insert/update)
    IF TG_OP = 'DELETE' THEN
        DELETE FROM public.telesales_tasks WHERE id = OLD.id;
        RETURN OLD;
    END IF;

    -- Map status
    IF NEW.status = 'completed' THEN task_status := 'done';
    ELSIF NEW.status = 'in_progress' THEN task_status := 'active';
    ELSE task_status := 'inbox';
    END IF;

    -- Check if it exists 
    SELECT EXISTS (SELECT 1 FROM public.telesales_tasks WHERE id = NEW.id) INTO task_exists;

    IF TG_OP = 'INSERT' OR NOT task_exists THEN
        INSERT INTO public.telesales_tasks (
            id,
            title,
            note,
            priority,
            due_date,
            status,
            user_id,
            assignee_ids,
            created_at
        ) VALUES (
            NEW.id,
            '🎬 Brief: ' || NEW.title,
            NEW.description,
            NEW.priority,
            NEW.deadline,
            task_status,
            NEW.created_by,
            NEW.assignees,
            NEW.created_at
        );
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.telesales_tasks SET
            title = '🎬 Brief: ' || NEW.title,
            note = NEW.description,
            priority = NEW.priority,
            due_date = NEW.deadline,
            status = task_status,
            assignee_ids = NEW.assignees
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_brief_to_task ON public.media_briefs;
CREATE TRIGGER trg_sync_brief_to_task
AFTER INSERT OR UPDATE OR DELETE ON public.media_briefs
FOR EACH ROW EXECUTE FUNCTION sync_brief_to_task();

-- Bổ sung luôn các brief cũ vào tasks board nếu chưa có
INSERT INTO public.telesales_tasks (id, title, note, priority, due_date, status, user_id, assignee_ids, created_at)
SELECT 
    id, 
    '🎬 Brief: ' || title, 
    description, 
    priority, 
    deadline, 
    CASE WHEN status = 'completed' THEN 'done' WHEN status = 'in_progress' THEN 'active' ELSE 'inbox' END, 
    created_by, 
    assignees,
    created_at
FROM public.media_briefs
ON CONFLICT (id) DO NOTHING;
