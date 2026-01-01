'use client';

import { useState } from "react";
import { Plus, Search, ShoppingBag, X } from "lucide-react";

export default function LiveConsolePage() {
    const [cart, setCart] = useState<any[]>([]);

    // Mock Products
    const products = [
        { id: 1, name: 'Combo 3 Áo Thun', price: 199000, code: 'A01' },
        { id: 2, name: 'Quần Jean Slimfit', price: 350000, code: 'QJ02' },
        { id: 3, name: 'Váy Hoa Nhí', price: 220000, code: 'V03' },
    ];

    const addToCart = (p: any) => setCart([...cart, p]);
    const removeFromCart = (idx: number) => setCart(cart.filter((_, i) => i !== idx));

    return (
        <div className="h-[calc(100vh-6rem)] flex gap-4 p-4">
            {/* Product List Panel */}
            <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-bold text-lg text-slate-800">Sản phẩm Live</h2>
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200" placeholder="Tìm mã sp..." />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {products.map(p => (
                        <div key={p.id} onClick={() => addToCart(p)} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer transition flex justify-between items-center group">
                            <div>
                                <div className="font-bold text-slate-900">{p.code} - {p.name}</div>
                                <div className="text-red-600 font-bold">{p.price.toLocaleString()} đ</div>
                            </div>
                            <Plus className="w-5 h-5 text-slate-300 group-hover:text-red-600" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Creation Panel */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-red-50 rounded-t-xl flex justify-between items-center">
                    <h2 className="font-bold text-lg text-red-700 flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                        Đang Chốt Đơn
                    </h2>
                    <div className="text-sm text-red-600 font-medium">Phiên: Mega Sale Giáng Sinh</div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                            <input className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Nhập SĐT khách..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng</label>
                            <input className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Tự động điền nếu có..." />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                        <input className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Nhập địa chỉ giao hàng..." />
                    </div>

                    {/* Cart Items */}
                    <div className="mt-6">
                        <h3 className="text-sm font-bold text-slate-700 mb-2">Giỏ hàng ({cart.length})</h3>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 h-48 overflow-y-auto space-y-2">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <ShoppingBag className="w-8 h-8 mb-2 opacity-50" />
                                    Chưa có sản phẩm nào
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                                        <span className="font-medium text-sm">{item.code} - {item.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-sm">{item.price.toLocaleString()}</span>
                                            <button onClick={() => removeFromCart(idx)}><X className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50 rounded-b-xl flex justify-between items-center">
                    <div className="text-lg">
                        Tổng tiền: <span className="font-bold text-red-600 text-2xl">{cart.reduce((a, b) => a + b.price, 0).toLocaleString()} đ</span>
                    </div>
                    <button className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition">
                        CHỐT ĐƠN (Enter)
                    </button>
                </div>
            </div>
        </div>
    );
}
