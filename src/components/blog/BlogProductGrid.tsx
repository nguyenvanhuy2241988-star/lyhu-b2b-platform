import Link from 'next/link';

export default function BlogProductGrid({ products }: { products: any[] }) {
    if (!products || products.length === 0) return null;

    return (
        <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Sản phẩm đang bán</h3>
                <Link href="/wholesale" className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                    Xem tất cả cửa hàng &rarr;
                </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map(product => {
                    const imageUrl = product.image_url || '/placeholder-image.jpg';
                    const price = product.price || 0;
                    return (
                        <Link key={product.id} href={`/wholesale`} className="group flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-primary-500 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300">
                            <div className="aspect-square bg-gray-50 overflow-hidden relative w-full">
                                <img 
                                    src={imageUrl} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-2.5 flex-1 flex flex-col">
                                <h3 className="text-sm text-gray-800 line-clamp-2 leading-[1.2rem] h-[2.4rem] break-words mb-1 group-hover:text-primary-600 transition-colors">
                                    {product.name}
                                </h3>
                                <div className="flex items-center justify-between mb-2 mt-auto">
                                    <div className="flex bg-primary-50 px-1 py-0.5 rounded-sm items-center border border-primary-100">
                                        <span className="text-[10px] text-primary-600 font-bold mr-0.5">5.0</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500 fill-primary-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                        Đã bán {Math.floor(Math.random() * 100) + 10}
                                    </div>
                                </div>
                                <div className="flex flex-col pt-1 border-t border-gray-100 border-dashed">
                                    <div className="flex items-baseline text-primary-600">
                                        <span className="text-xs font-bold mr-[2px]">₫</span>
                                        <span className="text-base font-medium">
                                            {price > 0 ? new Intl.NumberFormat('vi-VN').format(price) : 'Liên hệ'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <span className="block text-center w-full py-1.5 border border-primary-500 rounded-sm text-sm font-medium text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                        Thêm vào giỏ
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
