-- =====================================================
-- SEED DATA FOR TELESALES TASKS MODULE DEMO
-- Created: 2025-12-23
-- Purpose: Full demo data for task management
-- =====================================================

-- IMPORTANT: This script assumes you have at least 3 users in profiles table
-- Run this AFTER setting up users

-- Get user IDs (replace with actual user emails/IDs)
DO $$
DECLARE
    user1_id UUID;
    user2_id UUID;
    user3_id UUID;
BEGIN
    -- Get 3 telesales users (adjust emails as needed)
    SELECT id INTO user1_id FROM profiles WHERE role = 'telesales' LIMIT 1 OFFSET 0;
    SELECT id INTO user2_id FROM profiles WHERE role = 'telesales' LIMIT 1 OFFSET 1;
    SELECT id INTO user3_id FROM profiles WHERE role = 'telesales' LIMIT 1 OFFSET 2;

    -- If not enough users, create placeholder message
    IF user1_id IS NULL OR user2_id IS NULL OR user3_id IS NULL THEN
        RAISE NOTICE 'Need at least 3 telesales users. Please create users first.';
        RETURN;
    END IF;

    -- Clear existing demo data (optional, comment out if you want to keep existing)
    -- DELETE FROM telesales_tasks WHERE note LIKE '%DEMO%';

    -- ===== INBOX TASKS (Chưa phân loại) =====
    
    INSERT INTO telesales_tasks (user_id, assigned_to, title, customer_name, phone, status, priority, task_type, due_date, note, attachments)
    VALUES
    -- New leads chưa liên hệ
    (user1_id, user1_id, 'Tư vấn sản phẩm cho khách hàng mới', 'Nguyễn Văn An', '0901234567', 'inbox', 'high', 'lead', NULL, 'DEMO: Lead từ Facebook Ads', 
     '[{"type":"link","name":"Facebook Profile","url":"https://facebook.com/demo"}]'::jsonb),
    
    (user1_id, user2_id, 'Gọi lại khách hỏi về giá', 'Trần Thị Bình', '0912345678', 'inbox', 'normal', 'task', NULL, 'DEMO: Khách hỏi giá qua Zalo',
     NULL),
    
    (user2_id, user2_id, 'Follow up lead từ website', 'Lê Văn Cường', '0923456789', 'inbox', 'normal', 'lead', NULL, 'DEMO: Điền form liên hệ trên website',
     NULL),
    
    (user1_id, user3_id, 'Xác nhận đơn hàng',NULL, '0934567890', 'inbox', 'urgent', 'task', NULL, 'DEMO: Khách đặt hàng qua hotline, cần xác nhận',
     NULL),

    -- ===== TODAY TASKS (Deadline hôm nay) =====
    
    (user1_id, user1_id, 'Gọi xác nhận giao hàng', 'Phạm Thị Dung', '0945678901', 'today', 'urgent', 'task', NOW(), 'DEMO: Đơn hàng cần giao hôm nay',
     '[{"type":"file","name":"order_details.pdf"}]'::jsonb),
    
    (user2_id, user2_id, 'Tư vấn gói dịch vụ VIP', 'Hoàng Văn Em', '0956789012', 'today', 'high', 'lead', NOW(), 'DEMO: Khách quan tâm gói VIP, hẹn gọi 10h sáng',
     NULL),
    
    (user1_id, user2_id, 'Chăm sóc khách hàng cũ', 'Vũ Thị Phượng', '0967890123', 'today', 'normal', 'task', NOW(), 'DEMO: Birthday call - khách sinh nhật hôm nay',
     NULL),
    
    (user3_id, user1_id, 'Giải đáp thắc mắc sản phẩm', 'Đỗ Văn Giang', '0978901234', 'today', 'normal', 'task', NOW(), 'DEMO: Khách hỏi về chính sách bảo hành',
     NULL),

    -- ===== TOMORROW TASKS =====
    
    (user1_id, user1_id, 'Hẹn gặp khách hàng tiềm năng', 'Bùi Thị Hoa', '0989012345', 'tomorrow', 'high', 'lead', NOW() + INTERVAL '1 day', 'DEMO: Hẹn gặp 14h tại văn phòng khách',
     NULL),
    
    (user2_id, user3_id, 'Giao việc survey thị trường', 'Lý Văn Ích', '0990123456', 'tomorrow', 'normal', 'task', NOW() + INTERVAL '1 day', 'DEMO: Thu thập feedback từ 10 khách hàng cũ',
     '[{"type":"link","name":"Survey Form","url":"https://forms.google.com/demo"}]'::jsonb),

    -- ===== THIS WEEK TASKS =====
    
    (user1_id, user2_id, 'Follow up đơn hàng lớn', 'Ngô Thị Kim', '0912340001', 'this_week', 'high', 'task', NOW() + INTERVAL '3 days', 'DEMO: Đơn 50 triệu, cần theo sát',
     NULL),
    
    (user2_id, user2_id, 'Tư vấn cho nhóm khách doanh nghiệp', 'Công ty TNHH ABC', '0912340002', 'this_week', 'high', 'lead', NOW() + INTERVAL '4 days', 'DEMO: Khách B2B, cần báo giá số lượng lớn',
     NULL),
    
    (user3_id, user3_id, 'Chuẩn bị tài liệu training', NULL, NULL, 'this_week', 'normal', 'task', NOW() + INTERVAL '5 days', 'DEMO: Tài liệu onboarding cho nhân viên mới',
     '[{"type":"file","name":"training_slides.pptx"},{"type":"file","name":"product_catalog.pdf"}]'::jsonb),

    -- ===== OVERDUE TASKS (Quá hạn - để test notification) =====
    
    (user1_id, user1_id, 'Gọi lại khách bỏ lỡ cuộc hẹn', 'Trịnh Văn Long', '0912340003', 'today', 'urgent', 'task', NOW() - INTERVAL '1 day', 'DEMO: OVERDUE - Khách không nghe máy hôm qua',
     NULL),
    
    (user2_id, user2_id, 'Xử lý khiếu nại của khách', 'Đinh Thị Mai', '0912340004', 'today', 'urgent', 'task', NOW() - INTERVAL '2 days', 'DEMO: OVERDUE - Khách khiếu nại chất lượng sản phẩm',
     NULL),

    -- ===== DONE TASKS (Đã hoàn thành) =====
    
    (user1_id, user1_id, 'Chốt đơn hàng thành công', 'Phan Văn Nam', '0912340005', 'done', 'high', 'lead', NOW() - INTERVAL '3 hours', 'DEMO: COMPLETED - Khách đã chuyển khoản 100%',
     NULL),
    
    (user2_id, user2_id, 'Tư vấn và giới thiệu giải pháp', 'Lương Thị Oanh', '0912340006', 'done', 'normal', 'task', NOW() - INTERVAL '1 day', 'DEMO: COMPLETED - Khách đồng ý dùng thử 7 ngày',
     NULL),
    
    (user3_id, user3_id, 'Gửi catalogue cho khách', 'Võ Văn Phong', '0912340007', 'done', 'normal', 'task', NOW() - INTERVAL '2 days', 'DEMO: COMPLETED - Đã gửi email kèm PDF',
     '[{"type":"file","name":"catalogue_2024.pdf"}]'::jsonb);

    RAISE NOTICE 'Successfully created % demo tasks', (SELECT COUNT(*) FROM telesales_tasks WHERE note LIKE '%DEMO%');
    RAISE NOTICE 'User 1 ID: %', user1_id;
    RAISE NOTICE 'User 2 ID: %', user2_id;
    RAISE NOTICE 'User 3 ID: %', user3_id;

END $$;

-- =====================================================
-- VERIFY DATA
-- =====================================================

-- Check distribution by status
SELECT 
    status,
    COUNT(*) as count,
    STRING_AGG(DISTINCT priority::text, ', ') as priorities
FROM telesales_tasks 
WHERE note LIKE '%DEMO%'
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'inbox' THEN 1
        WHEN 'today' THEN 2
        WHEN 'tomorrow' THEN 3
        WHEN 'this_week' THEN 4
        WHEN 'done' THEN 5
    END;

-- Check assignments
SELECT 
    COUNT(*) as total_tasks,
    COUNT(DISTINCT user_id) as task_owners,
    COUNT(DISTINCT assigned_to) as assigned_users,
    COUNT(CASE WHEN user_id != assigned_to THEN 1 END) as delegated_tasks
FROM telesales_tasks
WHERE note LIKE '%DEMO%';
