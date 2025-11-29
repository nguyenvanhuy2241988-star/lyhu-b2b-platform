import { Users, CheckCircle, UserPlus, TrendingUp } from "lucide-react";
import { mockLeads } from "@/mocks/data";

const stats = [
    {
        label: "Tổng Leads",
        value: mockLeads?.length.toString() || "0",
        change: "+4 tháng này",
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        label: "Đã chuyển đổi",
        value: mockLeads?.filter((l) => l?.status === "converted")?.length.toString() || "0",
        change: "Thành khách hàng",
        icon: CheckCircle,
        color: "text-green-600",
        bg: "bg-green-50",
    },
    {
        label: "Đang liên hệ",
        value: mockLeads?.filter((l) => l?.status === "contacted")?.length.toString() || "0",
        change: "Cần follow-up",
        icon: UserPlus,
        color: "text-primary-600",
        bg: "bg-primary-50",
    },
    {
        label: "Lead mới",
        value: mockLeads?.filter((l) => l?.status === "new")?.length.toString() || "0",
        change: "Chưa liên hệ",
        icon: TrendingUp,
        color: "text-purple-600",
        bg: "bg-purple-50",
    },
];

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
};

const STATUS_CONFIG = {
    new: { label: "Mới", color: "bg-blue-100 text-blue-700" },
    contacted: { label: "Đã liên hệ", color: "bg-yellow-100 text-yellow-700" },
    converted: { label: "Đã chuyển đổi", color: "bg-green-100 text-green-700" },
};

export default function CTVDashboard() {
    // Get 5 most recent leads
    const recentLeads = [...(mockLeads || [])]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

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
                                <span className="text-slate-600">{stat.change}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Leads Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Leads gần đây</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[768px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tên cửa hàng</th>
                                <th className="px-6 py-3 font-medium">Người liên hệ</th>
                                <th className="px-6 py-3 font-medium">Số điện thoại</th>
                                <th className="px-6 py-3 font-medium">Khu vực</th>
                                <th className="px-6 py-3 font-medium">Loại</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {recentLeads.map((lead) => {
                                const statusConfig = STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG];
                                return (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{lead.storeName}</td>
                                        <td className="px-6 py-4 text-slate-600">{lead.contactPerson}</td>
                                        <td className="px-6 py-4 text-slate-600">{lead.phone}</td>
                                        <td className="px-6 py-4 text-slate-600">{lead.area}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.type === "NPP"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : lead.type === "Đại lý"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : lead.type === "Mini mart"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-orange-100 text-orange-700"
                                                }`}>
                                                {lead.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{formatDate(lead.createdAt)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {recentLeads.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        Chưa có lead nào
                    </div>
                )}

                {/* Mobile hint */}
                <div className="p-4 text-xs text-slate-500 text-center border-t border-slate-200 sm:hidden">
                    Vuốt sang trái/phải để xem thêm
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                    href="/ctv/new-lead"
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group flex items-center gap-4"
                >
                    <div className="p-3 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                        <UserPlus className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Tạo Lead mới</h4>
                        <p className="text-sm text-slate-600">Thêm khách hàng tiềm năng</p>
                    </div>
                </a>
                <a
                    href="/ctv/my-leads"
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group flex items-center gap-4"
                >
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-1">Tất cả Leads</h4>
                        <p className="text-sm text-slate-600">Xem danh sách đầy đủ</p>
                    </div>
                </a>
            </div>
        </div>
    );
}
