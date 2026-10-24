export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto p-8 font-sans text-gray-800 leading-relaxed">
            <h1 className="text-3xl font-bold mb-4">Chính sách quyền riêng tư (Privacy Policy)</h1>
            <p className="mb-6 text-sm text-gray-500">Cập nhật lần cuối: 24/10/2026</p>

            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-2">1. Giới thiệu</h2>
                    <p>
                        Chào mừng bạn đến với nền tảng <strong>LYHU</strong> (gọi tắt là "Dịch vụ" hoặc "Nền tảng"). 
                        Chúng tôi cung cấp bộ giải pháp quản trị nội dung số, tự động hóa sáng tạo và phân phối video đa nền tảng 
                        (bao gồm TikTok, Facebook và các kênh truyền thông xã hội) dành cho các nhà sáng tạo nội dung, thương hiệu và nhà bán hàng.
                    </p>
                    <p className="mt-2">
                        Chúng tôi tôn trọng quyền riêng tư của bạn và cam kết bảo vệ dữ liệu cá nhân theo đúng các tiêu chuẩn bảo mật quốc tế và quy định pháp luật hiện hành.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">2. Dữ liệu chúng tôi thu thập</h2>
                    <p>Khi bạn kết nối và sử dụng các tính năng tích hợp với nền tảng đối tác (TikTok, Facebook):</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Thông tin xác thực & hồ sơ cơ bản:</strong> ID người dùng (Open ID / Union ID), tên hiển thị (Display Name), ảnh đại diện (Avatar) để xác định phiên làm việc và hiển thị kênh kết nối.</li>
                        <li><strong>Mã truy cập (Access Token & Refresh Token):</strong> Được lưu trữ dưới dạng mã hóa an toàn nhằm thực hiện các thao tác ủy quyền theo lệnh của bạn.</li>
                        <li><strong>Nội dung truyền thông do người dùng tải lên:</strong> Video, hình ảnh, văn bản mô tả hoặc tiêu đề video bạn muốn lên lịch và xuất bản lên TikTok.</li>
                        <li><strong>Dữ liệu tương tác & CSKH:</strong> Tin nhắn, bình luận trên Fanpage công khai nhằm hỗ trợ phản hồi khách hàng theo yêu cầu quản trị viên.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">3. Mục đích sử dụng dữ liệu</h2>
                    <p>Chúng tôi chỉ sử dụng dữ liệu được người dùng ủy quyền cho các mục đích hợp pháp sau:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Cho phép người dùng quản trị danh sách các kênh truyền thông xã hội đã liên kết.</li>
                        <li>Thực hiện tác vụ xuất bản video (TikTok Content Posting API) và lên lịch đăng bài theo chỉ định chủ động của người dùng.</li>
                        <li>Hỗ trợ phân tích dữ liệu hiệu quả nội dung và đồng bộ trạng thái đăng tải video.</li>
                        <li>Tuyệt đối KHÔNG sử dụng dữ liệu cho mục đích theo dõi trái phép, quảng cáo nhắm mục tiêu bên ngoài hoặc bất kỳ mục đích nào chưa được người dùng đồng thuận.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">4. Chia sẻ và lưu trữ dữ liệu</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Chúng tôi <strong>KHÔNG</strong> bán, cho thuê, trao đổi hoặc thương mại hóa dữ liệu cá nhân của người dùng với bất kỳ bên thứ ba nào.</li>
                        <li>Dữ liệu xác thực (tokens) được lưu trữ trên hệ thống cơ sở dữ liệu bảo mật có phân quyền nghiêm ngặt.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">5. Quyền của người dùng & Xóa dữ liệu (Data Deletion)</h2>
                    <p>Người dùng có toàn quyền:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Hủy liên kết tài khoản TikTok hoặc Facebook bất kỳ lúc nào trực tiếp ngay trên giao diện Cài đặt của Nền tảng hoặc trong trang Cài đặt bảo mật của TikTok/Facebook.</li>
                        <li>Yêu cầu xóa toàn bộ dữ liệu lưu trữ liên quan đến tài khoản bằng cách gửi email về: <strong className="text-blue-600">admin@lyhu.com.vn</strong> hoặc <strong className="text-blue-600">support@lyhu.com</strong>. Yêu cầu sẽ được xử lý trong vòng 24 - 48 giờ.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">6. Thông tin liên hệ</h2>
                    <p>Nếu bạn có bất kỳ câu hỏi nào về Chính sách quyền riêng tư này, vui lòng liên hệ:</p>
                    <p className="mt-1 font-medium">LYHU Platform - Bộ phận Hỗ trợ Nhà phát triển</p>
                    <p>Website: <a href="https://lyhu.com.vn" className="text-blue-600 underline" target="_blank" rel="noreferrer">https://lyhu.com.vn</a></p>
                    <p>Email: <a href="mailto:support@lyhu.com" className="text-blue-600 underline">support@lyhu.com</a> / <a href="mailto:admin@lyhu.com.vn" className="text-blue-600 underline">admin@lyhu.com.vn</a></p>
                </section>
            </div>
        </div>
    );
}
