'use client';

import { Video, ShoppingBag, Users, Eye } from "lucide-react";
import Link from "next/link";

export default function LivestreamDashboard() {
    const stats = [
        { label: "Đang xem Live", value: "1,204", icon: Eye, color: "text-red-600", bg: "bg-red-50" },
        { label: "Đơn chốt (Live)", value: "85", icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50" },
        { label: "Phiên Live hôm nay", value: "2", icon: Video, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Khách tương tác", value: "350", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Livestream Dashboard</h1>
                    <p className="text-slate-500 mt-2">Tổng quan hoạt động bán hàng trực tiếp</p>
                </div>
                <Link href="/livestream/live" className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 flex items-center gap-2 animate-pulse">
                    <Video className="w-5 h-5" />
                    BẮT ĐẦU LIVE NGAY
                </Link>
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

            {/* Upcoming Schedule Mockup */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-4">Lịch Livestream Sắp tới</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="p-3 bg-white rounded-lg text-red-600 font-bold text-center border border-red-100">
                            <div className="text-xs">THÁNG 12</div>
                            <div className="text-2xl">22</div>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Mega Sale Giáng Sinh - TikTok</h4>
                            <p className="text-sm text-slate-500">20:00 - 23:00 • Host: Lan Anh</p>
                        </div>
                        <button className="ml-auto px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-white">Chi tiết</button>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="p-3 bg-white rounded-lg text-slate-600 font-bold text-center border border-slate-200">
                            <div className="text-xs">THÁNG 12</div>
                            <div className="text-2xl">23</div>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Xả kho cuối năm - Facebook</h4>
                            <p className="text-sm text-slate-500">12:00 - 14:00 • Host: Minh Thu</p>
                        </div>
                        <button className="ml-auto px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-white">Chi tiết</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
