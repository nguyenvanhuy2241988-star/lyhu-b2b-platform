'use client';

import { RefreshCw, Search, Box, Edit, ExternalLink } from 'lucide-react';

const PRODUCTS = [
    { id: 1, name: 'Áo Thun Basic (White/L)', sku: 'AT-BAS-W-L', stock: { total: 100, shopee: 20, tiktok: 30, web: 50 }, price: 250000, sync: true },
    { id: 2, name: 'Quần Jeans Slim (Blue/32)', sku: 'QJ-SLI-B-32', stock: { total: 45, shopee: 10, tiktok: 15, web: 20 }, price: 450000, sync: true },
    { id: 3, name: 'Áo Khoác Hoodie (Black/XL)', sku: 'AK-HOO-B-XL', stock: { total: 12, shopee: 0, tiktok: 2, web: 10 }, price: 350000, sync: false },
    { id: 4, name: 'Tất cổ cao (Pack 3)', sku: 'ACC-SOCK-3', stock: { total: 200, shopee: 80, tiktok: 80, web: 40 }, price: 99000, sync: true },
];

export default function EcommerceProductsSyncPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Liên kết Kho & Sản phẩm</h1>
                    <p className="text-slate-500">Đồng bộ tồn kho giữa Website và các sàn TMĐT</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-sm font-medium">
                    <RefreshCw className="w-4 h-4" />
                    Đồng bộ tất cả
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200" placeholder="Tìm theo tên sản phẩm hoặc SKU..." />
                </div>
                <select className="px-4 py-2 border border-slate-200 rounded-lg bg-white">
                    <option>Tất cả trạng thái</option>
                    <option>Đã đồng bộ</option>
                    <option>Lỗi đồng bộ</option>
                </select>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-6 py-4 font-medium">Sản phẩm</th>
                            <th className="px-6 py-4 font-medium text-center">Tổng Tồn</th>
                            <th className="px-6 py-4 font-medium text-center text-orange-600">Shopee</th>
                            <th className="px-6 py-4 font-medium text-center text-black">TikTok</th>
                            <th className="px-6 py-4 font-medium text-center text-violet-600">Web</th>
                            <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
                            <th className="px-6 py-4 font-medium text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {PRODUCTS.map(prod => (
                            <tr key={prod.id} className="hover:bg-slate-50 transition">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                            <Box className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{prod.name}</div>
                                            <div className="text-xs text-slate-500">SKU: {prod.sku}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-slate-800 text-lg">{prod.stock.total}</td>
                                <td className="px-6 py-4 text-center font-medium bg-orange-50/50">{prod.stock.shopee}</td>
                                <td className="px-6 py-4 text-center font-medium bg-slate-100/50">{prod.stock.tiktok}</td>
                                <td className="px-6 py-4 text-center font-medium bg-violet-50/50">{prod.stock.web}</td>
                                <td className="px-6 py-4 text-center">
                                    {prod.sync ? (
                                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">
                                            Đã đồng bộ
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs font-bold">
                                            Chưa bật
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-violet-600 p-2"><Edit className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
