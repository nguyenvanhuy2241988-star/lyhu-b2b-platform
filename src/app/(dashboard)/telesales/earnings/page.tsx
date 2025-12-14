"use client";

import { DollarSign, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

export default function TelesalesEarningsPage() {
    // Mock Data for Earnings
    const currentMonthRevenue = 45000000;
    const commissionRate = 0.025; // 2.5%
    const estimatedCommission = currentMonthRevenue * commissionRate;
    const successfulOrders = 15;

    // Mock History
    const history = [
        { date: "2024-12-15", calls: 45, orders: 3, revenue: 3500000, commission: 87500 },
        { date: "2024-12-14", calls: 38, orders: 2, revenue: 2200000, commission: 55000 },
        { date: "2024-12-13", calls: 50, orders: 4, revenue: 5600000, commission: 140000 },
        { date: "2024-12-12", calls: 30, orders: 1, revenue: 1200000, commission: 30000 },
        { date: "2024-12-11", calls: 42, orders: 5, revenue: 8900000, commission: 222500 },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Thu nhập & KPI</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                            Tháng 12
                        </span>
                    </div>
                    <div>
                        <p className="text-primary-100 font-medium mb-1">Doanh số Telesales</p>
                        <h3 className="text-3xl font-bold">{formatPrice(currentMonthRevenue)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                        <span className="text-primary-100">{successfulOrders} đơn hàng thành công</span>
                    </div>
                </div>

                {/* Commission Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Hoa hồng ước tính (2.5%)</p>
                        <h3 className="text-3xl font-bold text-slate-900">{formatPrice(estimatedCommission)}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm text-green-600 font-medium">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        +12.5% so với tháng trước
                    </div>
                </div>

                {/* KPI Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Tỷ lệ chốt đơn</p>
                        <h3 className="text-3xl font-bold text-slate-900">8.5%</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm text-slate-500">
                        TB 15 đơn / 176 cuộc gọi
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Lịch sử hiệu quả</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Ngày</th>
                                <th className="px-6 py-3 font-medium text-center">Cuộc gọi</th>
                                <th className="px-6 py-3 font-medium text-center">Đơn thành công</th>
                                <th className="px-6 py-3 font-medium text-right">Doanh số</th>
                                <th className="px-6 py-3 font-medium text-right">Hoa hồng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {row.date}
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-600">
                                        {row.calls}
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-600">
                                        {row.orders}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                                        {formatPrice(row.revenue)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-green-600">
                                        {formatPrice(row.commission)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
