'use client';

import { useState } from "react";
import { Search, MapPin, Phone, MessageSquare } from "lucide-react";

const DELIVERIES = [
    { id: 'ORD-7721', customer: 'Trần Văn A', phone: '0912345678', address: 'Số 10, Ngõ 5, Cầu Giấy, HN', cod: 250000, status: 'PENDING' },
    { id: 'ORD-8812', customer: 'Lê Thị B', phone: '0987654321', address: 'Tòa nhà Landmark 72, Nam Từ Liêm', cod: 0, status: 'DELIVERING' },
    { id: 'ORD-9911', customer: 'Hoàng Văn C', phone: '0901112233', address: 'Chung cư Time City, Hai Bà Trưng', cod: 1200000, status: 'PENDING' },
];

export default function ShipperDeliveriesPage() {
    const [deliveries, setDeliveries] = useState(DELIVERIES);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Danh sách cần giao</h1>

            {/* Filter */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-200" placeholder="Tìm đơn hàng, số điện thoại..." />
            </div>

            <div className="space-y-4">
                {deliveries.map(dev => (
                    <div key={dev.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">{dev.customer}</h3>
                                <p className="text-sm text-slate-500 font-mono">{dev.id}</p>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${dev.status === 'PENDING' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                                    {dev.status === 'PENDING' ? 'Chưa giao' : 'Đang giao'}
                                </span>
                                <div className="mt-1 font-bold text-slate-900">
                                    COD: {new Intl.NumberFormat('vi-VN').format(dev.cod)} đ
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 text-slate-600 text-sm mb-4">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                            {dev.address}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <a href={`tel:${dev.phone}`} className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium text-slate-700 transition">
                                <Phone className="w-4 h-4" /> Gọi điện
                            </a>
                            <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition">
                                Giao thành công
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
