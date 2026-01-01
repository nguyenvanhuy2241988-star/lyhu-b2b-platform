'use client';

import { Truck, CheckCircle, Clock, XCircle, MapPin } from "lucide-react";

export default function ShipperDashboard() {
    const stats = [
        { label: "Cần giao hôm nay", value: "8", icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Đã giao thành công", value: "12", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        { label: "Chờ lấy hàng", value: "3", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Giao thất bại", value: "1", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Shipper Dashboard</h1>
                <p className="text-slate-500 mt-2">Xin chào, chúc bạn một ngày làm việc hiệu quả!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Urgency List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-4">Đơn hàng ưu tiên (Giao ngay)</h3>
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="flex items-center gap-4 p-4 border border-amber-100 bg-amber-50/50 rounded-xl">
                            <div className="p-3 bg-white rounded-full shadow-sm">
                                <MapPin className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Khách hàng: Nguyễn Thị Lan ({i})</h4>
                                <p className="text-sm text-slate-600">Địa chỉ: 123 Đường Láng, Đống Đa, Hà Nội</p>
                                <p className="text-xs text-amber-700 font-medium mt-1">Giao trước 11:00 AM</p>
                            </div>
                            <button className="ml-auto px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700">
                                Nhận đơn
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
