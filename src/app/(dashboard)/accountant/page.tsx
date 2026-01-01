'use client';

import { DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react";

export default function AccountantDashboard() {
    const stats = [
        { label: "Doanh thu (Tháng)", value: "245.5M", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Chi phí (Tháng)", value: "42.1M", icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
        { label: "Lợi nhuận gộp", value: "203.4M", icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Công nợ phải thu", value: "18.5M", icon: CreditCard, color: "text-orange-600", bg: "bg-orange-50" },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Accountant Dashboard</h1>
                <p className="text-slate-500 mt-2">Tổng quan tình hình tài chính doanh nghiệp</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                    <p className="text-slate-400">Biểu đồ dòng tiền (Placeholder)</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-4">Nhắc nhở thanh toán</h3>
                    <ul className="space-y-4">
                        <li className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Tiền nhà kho (3 tháng)</span>
                            <span className="font-bold text-red-600">15.000.000 đ</span>
                        </li>
                        <li className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Internet & Điện</span>
                            <span className="font-bold text-red-600">2.500.000 đ</span>
                        </li>
                    </ul>
                </div>
            </div>

        </div>
    );
}
