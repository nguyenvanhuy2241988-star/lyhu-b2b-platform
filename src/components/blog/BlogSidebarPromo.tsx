import Link from 'next/link';

export default function BlogSidebarPromo({ promo }: { promo: any }) {
    // Use dynamic promo data if available, fallback to default UI
    const title = promo?.name || 'Đại Hội Nhập Sỉ\nLớn Nhất Năm';
    
    return (
        <div className="bg-white rounded-xl p-6 border border-primary-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-[100px] -z-10"></div>
            <div className="relative z-10">
                <span className="inline-block bg-primary-50 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-md mb-4 border border-primary-100">
                    KHUYẾN MÃI SỈ
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug whitespace-pre-line">
                    {title}
                </h3>
                
                {promo?.description ? (
                    <ul className="text-sm space-y-2.5 mb-6 text-gray-600">
                        {promo.description.split('\n').map((line: string, i: number) => line.trim() && (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-primary-500 mt-0.5">•</span> {line.trim()}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="text-sm space-y-2.5 mb-6 text-gray-600">
                        <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">•</span> Đơn từ 500K: Tặng 1 lốc bia</li>
                        <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">•</span> Đơn từ 1 Triệu: Chiết khấu 5%</li>
                        <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">•</span> Giảm 15.000đ phí vận chuyển</li>
                    </ul>
                )}
                
                <Link 
                    href="/wholesale"
                    className="block w-full bg-primary-600 text-white text-center font-bold text-sm py-3 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                    ĐẶT HÀNG NGAY
                </Link>
            </div>
        </div>
    );
}
