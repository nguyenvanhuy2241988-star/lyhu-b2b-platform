export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto p-8 font-sans">
            <h1 className="text-3xl font-bold mb-6">Điều khoản dịch vụ (Terms of Service)</h1>

            <p className="mb-4 text-gray-500 text-sm">Ngày hiệu lực: 18/10/2026</p>

            <div className="space-y-6 text-gray-800">
                <section>
                    <h2 className="text-xl font-semibold mb-2">1. Giới thiệu</h2>
                    <p>Chào mừng bạn đến với hệ sinh thái phần mềm và nền tảng dịch vụ của LYHU (sau đây gọi là "Dịch vụ" hoặc "Ứng dụng"). Khi sử dụng ứng dụng của chúng tôi để đồng bộ hóa, quản lý dữ liệu hoặc lên lịch tự động đăng tải nội dung lên các nền tảng mạng xã hội bao gồm TikTok, bạn đồng ý tuân thủ các Điều khoản dịch vụ này.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">2. Sử dụng dịch vụ</h2>
                    <ul className="list-disc pl-6 list-inside mt-2 space-y-1">
                        <li>Bạn cam kết chỉ kết nối các tài khoản mạng xã hội mà bạn sở hữu hoặc được ủy quyền quản lý hợp pháp.</li>
                        <li>Mọi nội dung tải lên hoặc chia sẻ thông qua dịch vụ phải tuân thủ Tiêu chuẩn cộng đồng của TikTok và quy định pháp luật hiện hành.</li>
                        <li>Chúng tôi không chịu trách nhiệm đối với các nội dung vi phạm bản quyền hoặc chính sách của bên thứ ba do người dùng khởi tạo.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">3. Quyền riêng tư và Bảo mật</h2>
                    <p>Chúng tôi tôn trọng quyền riêng tư của bạn. Việc thu thập và xử lý mã ủy quyền (access token), thông tin tài khoản chỉ phục vụ cho việc thực thi tác vụ đăng tải và quản trị nội dung mà bạn yêu cầu. Chi tiết xin tham khảo thêm tại <a href="/privacy" className="text-blue-600 underline">Chính sách quyền riêng tư</a>.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">4. Tuyên bố từ chối trách nhiệm</h2>
                    <p>Ứng dụng hoạt động dựa trên các giao diện lập trình ứng dụng (API) do TikTok cung cấp. Chúng tôi không đảm bảo dịch vụ sẽ không bị gián đoạn nếu nền tảng thứ ba thay đổi cấu trúc API, hạn mức (rate limit) hoặc chính sách vận hành của họ.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">5. Liên hệ</h2>
                    <p>Mọi thắc mắc liên quan đến Điều khoản dịch vụ xin vui lòng liên hệ:</p>
                    <p className="mt-1 font-medium">LYHU Platform</p>
                    <p>Website: <a href="https://lyhu.com.vn" className="text-blue-600 underline">https://lyhu.com.vn</a></p>
                </section>
            </div>
        </div>
    );
}
