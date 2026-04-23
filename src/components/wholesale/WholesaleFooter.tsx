import React from 'react';
import Link from 'next/link';

export default function WholesaleFooter() {
    return (
        <footer className="bg-white border-t border-gray-200 pt-10 pb-24 md:pb-12 mt-12">
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Về LYHU */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 uppercase mb-4">Về Công ty TNHH LYHU</h3>
                        <p className="text-sm text-gray-600 mb-2">LYHU - Kết nối chân thành, hợp tác bền vững. Phân phối chính hãng các dòng sản phẩm bánh kẹo ăn vặt chất lượng cao, chiết khấu hấp dẫn cho đại lý.</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Địa chỉ:</strong> Số 123 Đường B2B, Quận Cầu Giấy, Hà Nội</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Hotline sỉ:</strong> 1900 xxxx</p>
                        <p className="text-sm text-gray-600"><strong>Email:</strong> b2b@lyhu.vn</p>
                    </div>

                    {/* Các nhãn hàng */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 uppercase mb-4">Nhãn hàng trực thuộc</h3>
                        <ul className="space-y-3">
                            <li>
                                <div className="text-sm font-semibold text-gray-700">CVT - Chuối vắt tay</div>
                                <div className="flex gap-3 text-xs text-primary-600 mt-1">
                                    <a href="#" className="hover:underline">Website</a>
                                    <a href="#" className="hover:underline">Fanpage</a>
                                    <a href="#" className="hover:underline">TikTok</a>
                                </div>
                            </li>
                            <li>
                                <div className="text-sm font-semibold text-gray-700">ABI Snack</div>
                                <div className="flex gap-3 text-xs text-primary-600 mt-1">
                                    <a href="#" className="hover:underline">Website</a>
                                    <a href="#" className="hover:underline">Fanpage</a>
                                    <a href="#" className="hover:underline">TikTok</a>
                                </div>
                            </li>
                            <li>
                                <div className="text-sm font-semibold text-gray-700">BOYO - Đặc sản miền Tây</div>
                                <div className="flex gap-3 text-xs text-primary-600 mt-1">
                                    <a href="#" className="hover:underline">Website</a>
                                    <a href="#" className="hover:underline">Fanpage</a>
                                    <a href="#" className="hover:underline">TikTok</a>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Chính sách & Hướng dẫn */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 uppercase mb-4">Chính sách & Hướng dẫn</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link href="#" className="hover:text-primary-600">Hướng dẫn đăng ký đại lý</Link></li>
                            <li><Link href="#" className="hover:text-primary-600">Hướng dẫn đặt hàng B2B</Link></li>
                            <li><Link href="#" className="hover:text-primary-600">Chính sách chiết khấu bậc thang</Link></li>
                            <li><Link href="#" className="hover:text-primary-600">Chính sách vận chuyển & giao nhận</Link></li>
                            <li><Link href="#" className="hover:text-primary-600">Quy định đổi trả hàng hóa</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                    <p>© 2026 LYHU Company. Tất cả các quyền được bảo lưu.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <Link href="#" className="hover:text-gray-800">Chính sách bảo mật</Link>
                        <Link href="#" className="hover:text-gray-800">Điều khoản dịch vụ</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
