# Bật bộ đăng trong kho LYHU

Bộ mã ở tools/lyhu-news. Hai workflow ở .github/workflows/lyhu-news-*.yml.

1. Merge thay đổi mã sau khi CI đạt. Không có khóa hay queue thật trong thay đổi này.
2. Repository Settings → Secrets and variables → Actions → Secrets: nhập SUPABASE_URL và một trong SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY. Không gửi khóa vào chat, mã nguồn hay bài viết.
3. Queue ngày thật nằm tại tools/lyhu-news/queue/YYYY-MM-DD.json, đủ3slot và chỉ đánh dấu ready sau khi kiểm đủ. Repository hiện công khai: không commit nội dung nháp/nguồn nội bộ hoặc bí mật. Bản kê chứa ID/tiêu đề/hash/URL ảnh cũng công khai nếu commit tại đây; nên dùng repository PRIVATE riêng khi vận hành nội dung chưa công bố. Không tự đổi visibility của kho website.
4. Workflow thủ công publish=false kiểm cả3bài trong ngày, không ghi. Cần queue đã sẵn sàng.
5. Khi dry-run và phép thử live được xác nhận, chọn duy nhất publisher này, giữ publisherCloud cũ tắt. Thêm repository Variable LYHU_PUBLISHER_ENABLED=true rồi mới cho chạy thật. Chưa có biến hoặc !=true: các lượt schedule bị bỏ qua; manual publish=true bị chặn.
6. Manual live chỉ defaultbranch và vẫn kiểm đúnggiờ. Không đăngbù quá60phút. GitHub cóthểtrễ. Các lỗi hiện trong Actions; chưa nối AI producer vàoGitHub.

Trạng thái hiện tại: chưa có Secrets/queue thật, chưabậtbiến vàchưađăng thật. Không thay RLS, không chạy SQL bịchặn trongchat. Cácbàigiữchỗ19/10 chưađủnộidung/ảnh nên khôngđượcđăngbằngbộnày.
