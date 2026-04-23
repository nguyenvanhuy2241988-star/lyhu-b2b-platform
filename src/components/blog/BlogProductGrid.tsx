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
                        <Link key={product.id} href={`/wholesale`} className="group flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                            <div className="aspect-square bg-gray-50 overflow-hidden relative">
                                <img 
                                    src={imageUrl} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                                <h4 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                                    {product.name}
                                </h4>
                                <div className="mt-auto">
                                    {price > 0 ? (
                                        <p className="text-primary-600 font-bold">
                                            {price.toLocaleString('vi-VN')}đ
                                        </p>
                                    ) : (
                                        <p className="text-primary-600 font-bold text-xs uppercase">Liên hệ giá sỉ</p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
