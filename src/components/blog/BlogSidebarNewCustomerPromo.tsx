import Link from 'next/link';

interface NewCustomerOffer {
    id: string;
    title: string;
    discount_price: number;
    product: {
        id: string;
        name: string;
        price: number;
        image_url: string;
    };
}

export default function BlogSidebarNewCustomerPromo({ offer }: { offer: NewCustomerOffer | null }) {
    if (!offer || !offer.product) return null;

    const discountPercent = Math.round((1 - offer.discount_price / offer.product.price) * 100);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6 group relative">
            {/* Top Label */}
            <div className="bg-emerald-50 px-3 py-2 border-b border-emerald-100 flex items-center justify-between">
                <span className="text-emerald-700 text-xs font-bold uppercase tracking-wide">
                    {offer.title}
                </span>
                <span className="text-emerald-400 hover:text-emerald-600 cursor-pointer text-sm">✕</span>
            </div>

            <div className="p-4 flex flex-col items-center text-center">
                {/* Product Image */}
                <div className="w-32 h-32 relative mb-3">
                    {offer.product.image_url ? (
                        <img 
                            src={offer.product.image_url} 
                            alt={offer.product.name} 
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400">
                            LYHU
                        </div>
                    )}
                </div>

                {/* Product Name */}
                <h4 className="text-sm font-medium text-gray-800 line-clamp-2 mb-3 h-10">
                    {offer.product.name}
                </h4>

                {/* Pricing Area */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold text-red-600">
                        {Number(offer.discount_price).toLocaleString()}đ
                    </span>
                    {offer.product.price > offer.discount_price && (
                        <>
                            <span className="text-xs text-gray-400 line-through">
                                {Number(offer.product.price).toLocaleString()}đ
                            </span>
                            <span className="bg-red-600 text-white text-[10px] font-bold px-1 rounded-sm">
                                -{discountPercent}%
                            </span>
                        </>
                    )}
                </div>

                {/* CTA Button */}
                <Link 
                    href={`/wholesale`}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-sm uppercase tracking-wide"
                >
                    NHẬN NGAY
                </Link>
            </div>
            
            {/* Countdown placeholder (Visual only to match design) */}
            <div className="bg-emerald-600 text-white text-[10px] text-center py-1 absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                Kết thúc sau 00:59:59
            </div>
        </div>
    );
}
