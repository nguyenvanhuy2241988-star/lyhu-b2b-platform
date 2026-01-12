-- 1. Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT,
    status TEXT DEFAULT 'sent', -- pending, sent, failed. For simulation we use 'sent'
    trigger_source TEXT, -- e.g. 'welcome_automation'
    related_deal_id UUID -- Optional reference
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Admin/Marketing/Sales can view logs
CREATE POLICY "Staff can view email logs" ON public.email_logs
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('admin', 'marketing', 'sales', 'telesales', 'sale_admin')
        )
    );

-- 2. Update Automation Config Functionality
-- We don't need to alter table app_settings again if it's just JSONB, but we will use the same column.

-- 3. Trigger Function to Send Welcome Email
CREATE OR REPLACE FUNCTION public.auto_send_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_email_enabled BOOLEAN;
    cust_email TEXT;
    cust_name TEXT;
    email_subject TEXT;
    email_body TEXT;
BEGIN
    -- 1. Check if feature is enabled
    SELECT (automation_config->>'email_automation_enabled')::boolean 
    INTO is_email_enabled
    FROM public.app_settings
    LIMIT 1;

    IF is_email_enabled IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    -- 2. Get Customer Email associated with the Deal
    -- NEW.customer_id is required.
    IF NEW.customer_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT email, name INTO cust_email, cust_name
    FROM public.customers
    WHERE id = NEW.customer_id;

    -- 3. Validate Email
    IF cust_email IS NULL OR cust_email = '' OR length(cust_email) < 5 THEN
        RETURN NEW; -- No email to send to
    END IF;

    -- 4. Prepare Email Content
    email_subject := 'Chào mừng bạn đến với LYHU!';
    email_body := format('Xin chào %s,<br><br>Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi. Nhân viên tư vấn sẽ liên hệ với bạn sớm nhất.<br><br>Trân trọng,<br>Đội ngũ LYHU.', cust_name);

    -- 5. Insert Log (Simulate Sending)
    INSERT INTO public.email_logs (recipient_email, subject, body_html, status, trigger_source, related_deal_id)
    VALUES (cust_email, email_subject, email_body, 'sent', 'welcome_automation', NEW.id);

    RETURN NEW;
END;
$$;

-- 4. Create Trigger
DROP TRIGGER IF EXISTS trigger_auto_send_welcome_email ON public.crm_deals;

CREATE TRIGGER trigger_auto_send_welcome_email
AFTER INSERT ON public.crm_deals
FOR EACH ROW
EXECUTE FUNCTION public.auto_send_welcome_email();
