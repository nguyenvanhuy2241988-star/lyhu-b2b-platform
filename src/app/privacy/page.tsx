
export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto p-8 font-sans">
            <h1 className="text-3xl font-bold mb-6">Chính sách quyền riêng tư (Privacy Policy)</h1>

            <p className="mb-4">Ngày hiệu lực: 15/01/2026</p>

            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-2">1. Giới thiệu</h2>
                    <p>Chào mừng bạn đến với LYHU B2B Platform (sau đây gọi là "Ứng dụng"). Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn và tuân thủ các quy định pháp luật về bảo vệ dữ liệu.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">2. Dữ liệu chúng tôi thu thập</h2>
                    <p>Khi bạn sử dụng tính năng "Social Care" liên kết với Facebook, chúng tôi chỉ thu thập và xử lý các dữ liệu sau:</p>
                    <ul className="list-disc pl-6 list-inside mt-2">
                        <li>Tên và ID của khách hàng nhắn tin hoặc bình luận trên Fanpage.</li>
                        <li>Nội dung tin nhắn và bình luận công khai.</li>
                        <li>Các sự kiện tương tác cơ bản (Postback, Deliveries).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">3. Mục đích sử dụng dữ liệu</h2>
                    <p>Chúng tôi sử dụng dữ liệu này duy nhất cho mục đích:</p>
                    <ul className="list-disc pl-6 list-inside mt-2">
                        <li>Hỗ trợ nhân viên CSKH trả lời tin nhắn và bình luận của khách hàng trên Fanpage thông qua hệ thống quản lý tập trung.</li>
                        <li>Lưu trữ lịch sử hội thoại để nâng cao chất lượng dịch vụ.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">4. Chia sẻ dữ liệu</h2>
                    <p>Chúng tôi cam kết KHÔNG bán, trao đổi hoặc chia sẻ dữ liệu cá nhân của khách hàng cho bất kỳ bên thứ ba nào, trừ khi có yêu cầu từ cơ quan pháp luật.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">5. Hướng dẫn xóa dữ liệu (User Data Deletion)</h2>
                    <p>Theo chính sách Facebook, người dùng có quyền yêu cầu xóa dữ liệu của mình. Để thực hiện:</p>
                    <ul className="list-disc pl-6 list-inside mt-2">
                        <li>Gửi email đến <strong>admin@lyhu.com</strong> với tiêu đề "Yêu cầu xóa dữ liệu Facebook".</li>
                        <li>Chúng tôi sẽ thực hiện xóa dữ liệu và phản hồi trong vòng 24h.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">6. Liên hệ</h2>
                    <p>Nếu có thắc mắc, vui lòng liên hệ: admin@lyhu.com</p>
                </section>
            </div>
        </div>
    );
}
