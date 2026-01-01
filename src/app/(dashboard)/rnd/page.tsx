'use client';

import { FlaskConical, Package, CheckCircle, Clock } from "lucide-react";

export default function RndDashboard() {
    const stats = [
        { label: "Dự án đang chạy", value: "3", icon: FlaskConical, color: "text-cyan-600", bg: "bg-cyan-50" },
        { label: "Mẫu chờ duyệt", value: "5", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
        { label: "Mẫu đã duyệt (Tháng)", value: "12", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        { label: "Tổng số mẫu", value: "48", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">R&D Dashboard</h1>
                <p className="text-slate-500 mt-2">Tổng quan hoạt động Nghiên cứu & Phát triển sản phẩm</p>
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

            {/* Recent Activity Mockup */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-4">Hoạt động gần đây</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition">
                            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">Cập nhật trạng thái mẫu <span className="font-bold">SMP-2025-{i}</span></p>
                                <p className="text-xs text-slate-500">Vừa xong bởi Nguyễn Văn A</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
