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
                        <p className="text-sm text-gray-600 mb-2">LYHU – Công ty phân phối FMCG giúp bạn có nguồn hàng snack & gia vị độc – lạ – dễ bán trên toàn quốc.</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Mã số thuế:</strong> 0110560692</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Địa chỉ:</strong> Tầng 6, V11-B09, KĐT mới An Hưng, Phường Dương Nội, TP Hà Nội, Việt Nam</p>
                        <div className="flex gap-3 text-xs text-primary-600 mt-3 flex-wrap">
                            <a href="https://lyhu.vn" target="_blank" rel="noreferrer" className="hover:underline">lyhu.vn</a>
                            <a href="https://lyhu.com.vn" target="_blank" rel="noreferrer" className="hover:underline">lyhu.com.vn</a>
                            <a href="https://fb.com/lyhu.vn" target="_blank" rel="noreferrer" className="hover:underline">Fanpage</a>
                            <a href="https://tiktok.com/@lyhu2026" target="_blank" rel="noreferrer" className="hover:underline">TikTok</a>
                        </div>
                    </div>

                    {/* Các nhãn hàng */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 uppercase mb-4">Nhãn hàng trực thuộc</h3>
                        <ul className="space-y-4">
                            <li>
                                <div className="text-sm font-semibold text-gray-700">CVT - Khoai môn tẩm vị</div>
                                <div className="flex gap-3 text-xs text-primary-600 mt-1">
                                    <a href="https://cvt.com.vn" target="_blank" rel="noreferrer" className="hover:underline">Website</a>
                                    <a href="https://fb.com/khoaimontamvi.vn" target="_blank" rel="noreferrer" className="hover:underline">Fanpage</a>
                                </div>
                            </li>
                            <li>
                                <div className="text-sm font-semibold text-gray-700">UHi - Kẹo dẻo siêu chua</div>
                                <div className="flex gap-3 text-xs text-primary-600 mt-1">
                                    <a href="https://uhi.vn" target="_blank" rel="noreferrer" className="hover:underline">Website</a>
                                    <a href="https://fb.com/uhi.vn" target="_blank" rel="noreferrer" className="hover:underline">Fanpage</a>
                                    <a href="https://tiktok.com/@uhi.vn" target="_blank" rel="noreferrer" className="hover:underline">TikTok</a>
                                </div>
                            </li>
                            <li>
                                <div className="text-sm font-semibold text-gray-700">Abi Snack - Bánh tráng</div>
                                <div className="flex gap-3 text-xs text-primary-600 mt-1">
                                    <a href="https://abisnack.com" target="_blank" rel="noreferrer" className="hover:underline">Website</a>
                                    <a href="https://fb.com/banhtrangabichinhchu" target="_blank" rel="noreferrer" className="hover:underline">Fanpage</a>
                                </div>
                            </li>
                            <li>
                                <div className="text-sm font-semibold text-gray-700">BOYO - Bột phô mai</div>
                                <div className="flex gap-3 text-xs text-primary-600 mt-1">
                                    <a href="https://boyo.vn" target="_blank" rel="noreferrer" className="hover:underline">Website</a>
                                    <a href="https://fb.com/boyo.vn" target="_blank" rel="noreferrer" className="hover:underline">Fanpage</a>
                                    <a href="https://tiktok.com/@boyo.vn_official" target="_blank" rel="noreferrer" className="hover:underline">TikTok</a>
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
                        
                        <div className="mt-8">
                            <h3 className="text-sm font-bold text-gray-800 uppercase mb-4">Dành cho Nhân sự</h3>
                            <Link href="/portal" className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-800 bg-primary-50 px-4 py-2 rounded-lg transition-colors">
                                🔐 Cổng Thông Tin Nội Bộ
                            </Link>
                        </div>
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
