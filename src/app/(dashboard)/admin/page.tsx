import { Users, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";

const stats = [
    {
        label: "Tổng người dùng",
        value: "1,234",
        change: "+12%",
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        label: "Tổng đơn hàng",
        value: "456",
        change: "+8%",
        icon: ShoppingBag,
        color: "text-green-600",
        bg: "bg-green-50",
    },
    {
        label: "Doanh thu",
        value: "12,345,000đ",
        change: "+23%",
        icon: DollarSign,
        color: "text-primary-600",
        bg: "bg-primary-50",
    },
    {
        label: "Tăng trưởng",
        value: "15%",
        change: "+2%",
        icon: TrendingUp,
        color: "text-purple-600",
        bg: "bg-purple-50",
    },
];

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            {/* KPI Cards - CORE APP Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.bg}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-medium mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-sm border-t border-slate-100 pt-3">
                                <span className="text-primary-600 font-semibold">{stat.change}</span>
                                <span className="text-slate-500 ml-2">so với tháng trước</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts & Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Biểu đồ doanh thu</h3>
                    <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                        Chart Placeholder
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Hoạt động gần đây</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">Đơn hàng mới #00{i}</p>
                                    <p className="text-xs text-slate-500 mt-1">{i} phút trước</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Đơn hàng gần đây</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mã đơn</th>
                                <th className="px-6 py-3 font-medium">Khách hàng</th>
                                <th className="px-6 py-3 font-medium">Ngày</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Tổng tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">#ORD-00{i}</td>
                                    <td className="px-6 py-4 text-slate-600">Khách hàng {i}</td>
                                    <td className="px-6 py-4 text-slate-600">30/11/2025</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                            Hoàn thành
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-slate-900">{i * 150},000đ</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
