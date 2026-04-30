-- Create ai_news_topics table
CREATE TABLE IF NOT EXISTS public.ai_news_topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_news_topics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.ai_news_topics
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON public.ai_news_topics
    FOR ALL USING (auth.role() = 'authenticated');

-- Seed the initial 40 topics
INSERT INTO public.ai_news_topics (content) VALUES
('báo cáo tài chính, doanh thu, lợi nhuận của các ông lớn (Masan, Vinamilk, Kido...)'),
('động thái M&A (sát nhập và mua lại) trong ngành tiêu dùng và bán lẻ Việt Nam'),
('cạnh tranh thị phần trong ngành Sữa và Thực phẩm dinh dưỡng (Vinamilk, TH, Nutifood)'),
('cuộc chiến thị phần ngành Mì gói và Thực phẩm đóng gói (Acecook, Masan, Asia Foods)'),
('cuộc đua của các tập đoàn đồ uống, bia rượu (Sabeco, Habeco, Heineken, Suntory PepsiCo)'),
('tái cấu trúc bộ máy, thay đổi nhân sự cấp cao tại các tập đoàn bán lẻ lớn'),
('chiến lược mở rộng hoặc thu hẹp điểm bán của Bách Hóa Xanh, WinMart, CoopMart'),
('sự trỗi dậy của các cửa hàng tiện lợi phục vụ Gen Z (Circle K, GS25, FamilyMart)'),
('chiến lược cạnh tranh của các đại siêu thị ngoại (Aeon Mall, Lotte Mart, Central Retail/Go!)'),
('tình hình kinh doanh và lợi nhuận của mô hình siêu thị mini tại các khu dân cư'),
('chiến lược "Hàng nhãn riêng" (Private Label) của các chuỗi siêu thị để cạnh tranh giá'),
('sự chuyển mình và số hóa của các cửa hàng tạp hóa truyền thống'),
('xu hướng các chủ tạp hóa nhập hàng qua nền tảng B2B thay vì đại lý truyền thống'),
('sức ép cạnh tranh từ cửa hàng tiện lợi lên các tiệm tạp hóa ở khu vực thành thị'),
('tiềm năng và xu hướng bùng nổ của thị trường FMCG tại khu vực nông thôn'),
('xu hướng thắt chặt chi tiêu hoặc Trading Down (chuyển sang hàng giá rẻ) do kinh tế khó khăn'),
('xu hướng Cao cấp hóa (Premiumization) ở nhóm người tiêu dùng trung lưu'),
('sự lên ngôi của xu hướng thực phẩm xanh, hữu cơ (organic) và an toàn sức khỏe'),
('nhu cầu tiêu thụ các sản phẩm không đường (Sugar-free), ít béo, Eat Clean'),
('thói quen mua sắm theo thời vụ: Các chiến dịch lễ Tết, Trung Thu, Hè của ngành FMCG'),
('sự quan tâm đến bao bì thân thiện môi trường, tái chế trong ngành tiêu dùng nhanh'),
('sự đe dọa của TikTok Shop, Shopee đối với các kênh bán lẻ truyền thống'),
('xu hướng mua sắm nhu yếu phẩm, đồ ăn nhanh qua các ứng dụng (GrabMart, ShopeeFood)'),
('cuộc đua Giao hàng siêu tốc (Quick Commerce) của các chuỗi bán lẻ'),
('tác động của xu hướng Livestream bán hàng (KOC/KOL) đối với các thương hiệu FMCG'),
('chiến lược bán hàng đa kênh (Omnichannel) kết hợp giữa cửa hàng vật lý và online'),
('đề xuất tăng/giảm Thuế giá trị gia tăng (VAT) và tác động trực tiếp đến sức mua bán lẻ'),
('ảnh hưởng của Thuế tiêu thụ đặc biệt đối với ngành đồ uống có đường và bia rượu'),
('tác động của lạm phát, giá xăng dầu lên giá bán lẻ hàng hóa FMCG'),
('quy định mới về an toàn vệ sinh thực phẩm, nhãn mác đối với hàng tiêu dùng'),
('các rào cản pháp lý và thuận lợi khi doanh nghiệp nước ngoài đầu tư vào bán lẻ Việt Nam'),
('khủng hoảng hoặc biến động giá nguyên vật liệu đầu vào (đường, cà phê, lúa mì, dầu cọ)'),
('ứng dụng Trí tuệ nhân tạo (AI) và Big Data trong quản lý tồn kho và dự báo nhu cầu'),
('vai trò của Logistics lạnh (Cold Chain) trong việc phân phối thực phẩm tươi sống'),
('chuyển đổi số và ứng dụng phần mềm quản lý bán hàng (POS) tại các điểm bán lẻ'),
('tối ưu hóa chuỗi cung ứng "Từ nông trại đến bàn ăn" (Farm to Fork)'),
('thiếu hụt lao động và giải pháp tự động hóa trong ngành bán lẻ/FMCG'),
('xu hướng thanh toán không tiền mặt (QR Code, ví điện tử) tại các điểm bán lẻ'),
('chương trình khách hàng thân thiết (Loyalty programs) giữ chân người mua hàng'),
('thực trạng chống hàng giả, hàng nhái, hàng nhập lậu trong ngành tiêu dùng nhanh')
ON CONFLICT DO NOTHING;
