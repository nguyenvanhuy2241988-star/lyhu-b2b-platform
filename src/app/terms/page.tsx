export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto p-8 font-sans text-gray-800 leading-relaxed">
            <h1 className="text-3xl font-bold mb-4">Điều khoản dịch vụ (Terms of Service)</h1>
            <p className="mb-6 text-sm text-gray-500">Cập nhật lần cuối: 24/10/2026</p>

            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-2">1. Giới thiệu & Phạm vi dịch vụ</h2>
                    <p>
                        Chào mừng bạn đến với nền tảng phần mềm SaaS và dịch vụ sáng tạo nội dung số <strong>LYHU</strong> (sau đây gọi là "Dịch vụ" hoặc "Nền tảng"). 
                        LYHU cung cấp công cụ hỗ trợ người dùng, các nhà sáng tạo nội dung (Creators), các thương hiệu và nhà bán hàng quản trị, lên lịch và tự động đăng tải nội dung video lên các mạng xã hội đối tác, bao gồm TikTok.
                    </p>
                    <p className="mt-2">
                        Khi sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ toàn bộ các điều khoản và quy định được nêu trong văn bản này.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">2. Sử dụng dịch vụ & Quyền sở hữu nội dung</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Bạn cam kết chỉ ủy quyền và kết nối các tài khoản mạng xã hội mà bạn sở hữu hợp pháp hoặc được ủy quyền quản lý rõ ràng.</li>
                        <li>Mọi nội dung video, hình ảnh, văn bản tải lên hoặc xuất bản thông qua Nền tảng phải tuân thủ nghiêm ngặt Tiêu chuẩn cộng đồng của TikTok và các quy định pháp luật sở tại.</li>
                        <li>Người dùng chịu hoàn toàn trách nhiệm đối với bản quyền âm thanh, hình ảnh và nội dung do chính mình sáng tạo và xuất bản.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">3. Tích hợp TikTok & Giới hạn kỹ thuật</h2>
                    <p>
                        Dịch vụ sử dụng giao diện lập trình ứng dụng chính thức (Official TikTok APIs) để hỗ trợ tính năng đăng video và quản lý tài khoản. Chúng tôi tuân thủ các chính sách bảo vệ dữ liệu và hạn ngạch (rate limit) của TikTok.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">4. Bảo mật dữ liệu & Quyền riêng tư</h2>
                    <p>
                        Quyền riêng tư của bạn là ưu tiên hàng đầu của chúng tôi. Việc xử lý thông tin tài khoản và mã token ủy quyền chỉ phục vụ cho việc thực thi tác vụ mà bạn yêu cầu. 
                        Chi tiết xin tham khảo thêm tại <a href="/privacy" className="text-blue-600 underline">Chính sách quyền riêng tư</a>.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">5. Thông tin liên hệ</h2>
                    <p>Mọi thắc mắc hoặc yêu cầu hỗ trợ liên quan đến Điều khoản dịch vụ xin vui lòng liên hệ:</p>
                    <p className="mt-1 font-medium">LYHU Platform - Hỗ trợ dịch vụ</p>
                    <p>Website: <a href="https://lyhu.com.vn" className="text-blue-600 underline" target="_blank" rel="noreferrer">https://lyhu.com.vn</a></p>
                    <p>Email: <a href="mailto:support@lyhu.com" className="text-blue-600 underline">support@lyhu.com</a> / <a href="mailto:admin@lyhu.com.vn" className="text-blue-600 underline">admin@lyhu.com.vn</a></p>
                </section>
            </div>
        </div>
    );
}
