import { Users, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const stats = [
    {
        label: "Khách phụ trách",
        value: "24",
        change: "+3 tháng này",
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        label: "Doanh số tháng này",
        value: formatPrice(125500000),
        change: "+15% so tháng trước",
        icon: DollarSign,
        color: "text-primary-600",
        bg: "bg-primary-50",
    },
    {
        label: "Đơn mới tuần này",
        value: "18",
        change: "+6 so tuần trước",
        icon: ShoppingBag,
        color: "text-green-600",
        bg: "bg-green-50",
    },
    {
        label: "Tăng trưởng",
        value: "12.5%",
        change: "+2.3% so tháng trước",
        icon: TrendingUp,
        color: "text-purple-600",
        bg: "bg-purple-50",
    },
];

const topCustomers = [
    {
        id: "1",
        storeName: "NPP Phương Nam",
        type: "NPP",
        area: "Bình Dương",
        totalRevenue: 45000000,
        orders: 12,
    },
    {
        id: "2",
        storeName: "Đại lý Minh Khang",
        type: "Đại lý",
        area: "Quận 5, TP.HCM",
        totalRevenue: 32000000,
        orders: 8,
    },
    {
        id: "3",
        storeName: "Mini Mart Sài Gòn",
        type: "Mini mart",
        area: "Quận 3, TP.HCM",
        totalRevenue: 28500000,
        orders: 15,
    },
    {
        id: "4",
        storeName: "NPP Vạn Lộc",
        type: "NPP",
        area: "Long An",
        totalRevenue: 25000000,
        orders: 10,
    },
    {
        id: "5",
        storeName: "Đại lý Thành Đạt",
        type: "Đại lý",
        area: "Đồng Nai",
        totalRevenue: 18500000,
        orders: 6,
    },
];

export default function SalesDashboard() {
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
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts & Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Performance Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Hiệu suất bán hàng</h3>
                    <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <div className="text-center">
                            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm">Chart Placeholder</p>
                            <p className="text-xs text-slate-400 mt-1">Biểu đồ doanh số theo tháng</p>
                        </div>
                    </div>
                </div>

                {/* Top Customers */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Top khách hàng</h3>
                    <div className="space-y-4">
                        {topCustomers.map((customer, index) => (
                            <div key={customer.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <h4 className="font-medium text-slate-900 text-sm truncate">
                                                {customer.storeName}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 ml-8">
                                            {customer.type} • {customer.area}
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-8 flex items-center justify-between text-xs">
                                    <span className="text-slate-600">{customer.orders} đơn</span>
                                    <span className="font-semibold text-primary-600">
                                        {formatPrice(customer.totalRevenue)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                    href="/sales/my-customers"
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group flex items-center gap-4"
                >
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Khách hàng của tôi</h4>
                        <p className="text-sm text-slate-600">Xem tất cả khách phụ trách</p>
                    </div>
                </a>
                <a
                    href="/sales/create-order"
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group flex items-center gap-4"
                >
                    <div className="p-3 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                        <ShoppingBag className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Tạo đơn hàng</h4>
                        <p className="text-sm text-slate-600">Tạo đơn hộ khách hàng</p>
                    </div>
                </a>
            </div>
        </div>
    );
}
