'use client';

import { ClipboardCheck, FileText, AlertCircle, ShoppingCart } from "lucide-react";

export default function SaleAdminDashboard() {
    const stats = [
        { label: "Đơn chờ duyệt", value: "15", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
        { label: "Đơn đã xử lý (Ngày)", value: "48", icon: ClipboardCheck, color: "text-green-600", bg: "bg-green-50" },
        { label: "Báo giá mới", value: "3", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Tổng đơn tháng", value: "1,205", icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-50" },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Sale Admin Dashboard</h1>
                <p className="text-slate-500 mt-2">Hỗ trợ vận hành và xử lý đơn hàng</p>
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

            {/* Pending Orders Mockup */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-4">Danh sách Đơn cần duyệt gấp</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-rose-200 transition">
                            <div>
                                <h4 className="font-bold text-slate-900">#ORD-PENDING-{i}</h4>
                                <p className="text-sm text-slate-500">Sales: Nguyễn Văn Sales • KH: Công ty TNHH ABC</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded hover:bg-slate-50">Xem chi tiết</button>
                                <button className="px-3 py-1.5 bg-rose-600 text-white text-sm font-bold rounded hover:bg-rose-700">Duyệt ngay</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
