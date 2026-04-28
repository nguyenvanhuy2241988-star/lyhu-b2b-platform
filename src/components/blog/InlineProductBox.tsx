import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function InlineProductBox({ product }: { product: any }) {
    if (!product) return null;
    
    const imageUrl = product.image_url || '/placeholder-image.jpg';
    const price = product.price || 0;

    return (
        <div className="my-8 w-full max-w-2xl mx-auto bg-gradient-to-r from-primary-50 to-white border border-primary-200 rounded-xl overflow-hidden shadow-sm flex items-stretch">
            {/* Image */}
            <div className="w-1/3 shrink-0 bg-white border-r border-primary-100 flex items-center justify-center p-2">
                <div className="aspect-square w-full relative">
                    <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-contain mix-blend-multiply"
                    />
                </div>
            </div>
            
            {/* Info */}
            <div className="w-2/3 p-4 sm:p-6 flex flex-col justify-center">
                <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">Giá sỉ tận xưởng</div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 mb-2 leading-snug">
                    {product.name}
                </h4>
                
                <div className="flex items-end gap-2 mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-primary-600">
                        {price > 0 ? new Intl.NumberFormat('vi-VN').format(price) : 'Liên hệ'}
                    </span>
                    {price > 0 && <span className="text-sm font-medium text-gray-500 mb-1">₫ / thùng</span>}
                </div>
                
                <Link 
                    href="/wholesale" 
                    className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm w-fit"
                >
                    <ShoppingCart className="w-4 h-4" />
                    Đăng ký nhập sỉ ngay
                </Link>
            </div>
        </div>
    );
}
