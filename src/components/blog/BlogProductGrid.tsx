import Link from 'next/link';

interface ProductItem {
    id: string;
    name: string;
    price?: number;
    image_url?: string;
    brand?: string;
    unit?: string;
}

export default function BlogProductGrid({ products }: { products: ProductItem[] }) {
    if (!products || products.length === 0) return null;

    const hotlineZalo = '0969153015';

    return (
        <section aria-label="Sản phẩm chủ lực LYHU" className="mt-14 pt-8 border-t-2 border-primary-100">
            {/* Header & Định vị Thương hiệu */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-2 border border-primary-200">
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                        Top Sản Phẩm Bán Chạy Nhất Tại Các Tiệm Tạp Hóa & Siêu Thị Mini
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        4 Dòng Sản Phẩm Chủ Lực Chiến Lược Của LYHU
                    </h3>
                </div>
                <Link 
                    href="/wholesale" 
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 hover:underline whitespace-nowrap"
                >
                    Xem toàn bộ bảng sỉ &rarr;
                </Link>
            </div>

            {/* Banner Chính Sách Đại Lý & Ưu Đãi Mua 10 Tặng 1 */}
            <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-primary-700 text-white rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-yellow-400 text-teal-950 text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                Khuyến Mãi Đại Lý Mới
                            </span>
                            <span className="text-teal-200 text-xs font-medium">Áp dụng cho đơn hàng đầu tiên</span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-bold text-white">
                            🎁 Mua 10 Thùng Tặng 1 Thùng • Vốn Ít Chỉ Từ 500.000đ
                        </h4>
                        <p className="text-teal-100 text-xs sm:text-sm">
                            ✓ Xuất hóa đơn VAT điện tử hợp lệ &nbsp;|&nbsp; ✓ Hỗ trợ 100% đổi trả nếu cận date &nbsp;|&nbsp; ✓ Giao hàng nhanh toàn quốc
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                        <a
                            href={`https://zalo.me/${hotlineZalo}?text=${encodeURIComponent('Xin chào LYHU, tôi là chủ điểm bán cần tư vấn chính sách sỉ Mua 10 Tặng 1')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-yellow-400 hover:bg-yellow-300 text-teal-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-transform active:scale-95 shadow-sm inline-flex items-center gap-2"
                        >
                            <span>Nhận Báo Giá Zalo</span>
                            <span className="text-xs bg-teal-900 text-yellow-300 px-1.5 py-0.5 rounded">0969.153.015</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Danh Sách 4 Sản Phẩm Chủ Lực */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((product) => {
                    const imageUrl = product.image_url || '/placeholder-image.jpg';
                    const price = product.price || 0;
                    const brandTag = product.brand || 'LYHU';
                    const zaloMessage = encodeURIComponent(`Chào LYHU, tôi muốn nhận báo giá sỉ cho sản phẩm: ${product.name}`);

                    return (
                        <div 
                            key={product.id} 
                            className="group flex flex-col bg-white border border-gray-200 hover:border-primary-500 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                            {/* Ảnh sản phẩm + Brand badge */}
                            <div className="aspect-square bg-gray-50 overflow-hidden relative w-full">
                                <span className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                    {brandTag}
                                </span>
                                <img 
                                    src={imageUrl} 
                                    alt={product.name} 
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>

                            {/* Thông tin sản phẩm */}
                            <div className="p-3 flex-1 flex flex-col">
                                <Link 
                                    href={`/wholesale`}
                                    className="text-sm font-semibold text-gray-900 line-clamp-2 leading-[1.3] h-[2.6rem] mb-2 group-hover:text-primary-600 transition-colors"
                                >
                                    {product.name}
                                </Link>

                                <div className="flex items-center justify-between text-xs text-gray-500 mb-2 mt-auto">
                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium text-[11px]">
                                        ✓ Sẵn kho sỉ
                                    </span>
                                    <span className="text-[11px]">Date mới 100%</span>
                                </div>

                                {/* Giá tham khảo & Nút CTA Zalo */}
                                <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-[11px] text-gray-500">Giá lẻ tham khảo:</span>
                                        <div className="text-primary-600 font-bold text-sm">
                                            {price > 0 ? `${new Intl.NumberFormat('vi-VN').format(price)}₫` : 'Liên hệ sỉ'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-1.5 mt-1">
                                        <a
                                            href={`https://zalo.me/${hotlineZalo}?text=${zaloMessage}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-center w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                                        >
                                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.84 7.02-.17.97-.66 2.5-1.95 3.73-.24.23-.07.64.26.62 2.12-.13 4.25-1.07 5.43-1.89.78.14 1.59.22 2.42.22 5.52 0 10-4.03 10-9s-4.48-9-10-9z"/>
                                            </svg>
                                            Báo Giá Sỉ Zalo
                                        </a>
                                        <Link
                                            href="/wholesale"
                                            className="text-center w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[11px] font-semibold transition-colors"
                                        >
                                            Đặt hàng online
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Cam kết B2B của LYHU */}
            <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Cam kết phân phối LYHU:</span>
                <span className="flex items-center gap-1.5">
                    <span className="text-teal-600 font-bold">✔</span> Hàng chính hãng 100%
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="text-teal-600 font-bold">✔</span> Hóa đơn VAT điện tử
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="text-teal-600 font-bold">✔</span> Đổi trả cận date miễn phí
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="text-teal-600 font-bold">✔</span> Hỗ trợ tài liệu hình ảnh bán lẻ
                </span>
            </div>
        </section>
    );
}
