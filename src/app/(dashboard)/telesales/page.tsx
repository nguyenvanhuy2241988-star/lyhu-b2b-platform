"use client";

import { useEffect, useState } from "react";
import { Users, Phone, ShoppingBag, TrendingUp, ArrowRight } from "lucide-react";
import { mockLeads, mockOrders } from "@/mocks/data";
import Link from "next/link";
import { getMyTasks, TelesalesTask } from "@/lib/telesalesTasksStore";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN");
    } catch {
        return dateString;
    }
};

export default function TelesalesDashboard() {
    // State for tasks
    const [tasks, setTasks] = useState<TelesalesTask[]>([]);

    // Legacy mock data for tables (until we have real Leads/Orders modules fully linked)
    // We will still display them but KPIs will now come from Tasks where possible.
    const leads = mockLeads.filter(
        (l) => l.channel === "TELESALES" || l.assignedToRole === "TELESALES"
    );
    const orders = mockOrders.filter((o) => o.source === "TELESALES");

    // Load Tasks Logic
    useEffect(() => {
        // Initial load
        setTasks(getMyTasks());

        // Listen for updates
        const handleUpdate = () => setTasks(getMyTasks());
        window.addEventListener("telesales-tasks-updated", handleUpdate);
        return () => window.removeEventListener("telesales-tasks-updated", handleUpdate);
    }, []);

    // --- KPI CALCULATIONS ---

    // 1. Leads to Call (Lead phải gọi)
    // Logic: Tasks that are NOT done/cancelled AND (type is new_lead or follow_up OR just generally open tasks)
    // Let's filter for open tasks generally or specifically call/follow_up tasks that are open.
    // "Lead phải gọi" implies tasks related to calling.
    const leadsToCallCount = tasks.filter(t =>
        (t.type === 'call_new_lead' || t.type === 'follow_up_lead' || t.type === 'care_old_customer') &&
        (t.status !== 'done' && t.status !== 'cancelled')
    ).length;

    // 2. Closed Today (Đã chốt hôm nay)
    // Logic: Tasks matched as 'done' today.
    const closedTodayCount = tasks.filter(t => {
        if (t.status !== 'done') return false;
        // Use completedAt if available, else fallback to updatedAt
        const dateStr = t.completedAt || t.updatedAt;
        if (!dateStr) return false;

        const date = new Date(dateStr);
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    }).length;

    // 3. Monthly Revenue (Doanh số tháng)
    // Logic: Sum of orderAmount for 'done' tasks in current month.
    const monthlyRevenue = tasks
        .filter(t => {
            if (t.status !== 'done') return false;
            const dateStr = t.completedAt || t.updatedAt;
            if (!dateStr) return false;

            const date = new Date(dateStr);
            const today = new Date();
            return (
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
            );
        })
        .reduce((sum, t) => sum + (t.orderAmount || 0), 0);

    // 4. Total Customers (Mock or count unique customers in tasks?)
    // Let's keep distinct customer names count from tasks as a heuristic? Or just legacy logic.
    // Let's use unique customer names from tasks for fun, or fallback to fixed.
    const uniqueCustomers = new Set(tasks.map(t => t.customerName).filter(Boolean)).size;


    const statsCards = [
        {
            label: "Lead phải gọi",
            value: leadsToCallCount.toString(),
            change: "Việc cần xử lý",
            icon: Phone,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Đã chốt hôm nay",
            value: closedTodayCount.toString() + " việc", // Or orders? Let's say "việc" (tasks)
            change: "Hoàn thành",
            icon: ShoppingBag,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Doanh số tháng",
            value: formatPrice(monthlyRevenue),
            change: "Từ nhiệm vụ hoàn thành",
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            label: "Khách hàng",
            value: uniqueCustomers.toString(),
            change: "Đang chăm sóc",
            icon: Users,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
    ];

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {statsCards.map((stat, index) => {
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
                                <span className="text-slate-500">{stat.change}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Performance Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Stats */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">Hiệu suất tuần này</h3>
                            <p className="text-sm text-slate-500">Thống kê cuộc gọi và kết quả làm việc</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Tổng cuộc gọi</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-slate-900">
                                        {tasks.flatMap(t => t.logs || []).filter(l => {
                                            const d = new Date(l.timestamp);
                                            const now = new Date();
                                            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                                            startOfWeek.setHours(0, 0, 0, 0);
                                            return d.getTime() >= startOfWeek.getTime();
                                        }).length}
                                    </span>
                                    <span className="text-xs text-green-600 font-medium mb-1">cuộc gọi</span>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Thời lượng TB</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-bold text-slate-900">
                                        {(() => {
                                            const now = new Date();
                                            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                                            startOfWeek.setHours(0, 0, 0, 0);
                                            const logs = tasks.flatMap(t => t.logs || []).filter(l => new Date(l.timestamp).getTime() >= startOfWeek.getTime());
                                            const total = logs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
                                            return logs.length ? Math.round(total / logs.length) : 0;
                                        })()}
                                    </span>
                                    <span className="text-xs text-slate-500 mb-1">giây/cuộc</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CSS Bar Chart */}
                    <div className="flex-1 flex flex-col justify-end h-[200px]">
                        <div className="flex items-end justify-between h-full gap-2 pt-6">
                            {(() => {
                                const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                const counts = [0, 0, 0, 0, 0, 0, 0];
                                const now = new Date();
                                const startOfWeek = new Date(now);
                                startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
                                startOfWeek.setHours(0, 0, 0, 0);

                                const endOfWeek = new Date(startOfWeek);
                                endOfWeek.setDate(startOfWeek.getDate() + 7);

                                tasks.flatMap(t => t.logs || []).forEach(l => {
                                    const d = new Date(l.timestamp);
                                    if (d >= startOfWeek && d < endOfWeek) {
                                        counts[d.getDay()]++;
                                    }
                                });

                                const max = Math.max(...counts, 5); // Min height scale 5

                                return counts.map((count, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                                        <div className="relative w-full bg-slate-100 rounded-t-md overflow-hidden flex items-end h-[150px]">
                                            <div
                                                className="w-full bg-primary-500 hover:bg-primary-600 transition-all rounded-t-md relative group-hover:opacity-90"
                                                style={{ height: `${(count / max) * 100}%` }}
                                            >
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none transition-opacity">
                                                    {count}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500">{days[i]}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Priority Leads Table - Keeps displaying Mock Leads for now as requested context implies Tasks module enhancements, not full Leads replacement */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-900">Lead ưu tiên hôm nay</h3>
                        <Link href="/telesales/leads-queue" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            Xem tất cả <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Khách hàng</th>
                                    <th className="px-6 py-3 font-medium">Trạng thái</th>
                                    <th className="px-6 py-3 font-medium text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leads.slice(0, 5).map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{lead.storeName}</div>
                                            <div className="text-xs text-slate-500">{lead.contactPerson} • {lead.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                                lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                                                    lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                                                        'bg-slate-100 text-slate-800'
                                                }`}>
                                                {lead.status === 'new' ? 'Mới' :
                                                    lead.status === 'contacted' ? 'Đã liên hệ' :
                                                        lead.status === 'converted' ? 'Đã chốt' : lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary-600 hover:text-primary-700 font-medium">
                                                Gọi
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Orders Table - Keeps displaying Mock Orders */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-900">Đơn mới nhất</h3>
                        <Link href="/telesales/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            Xem tất cả <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Mã đơn</th>
                                    <th className="px-6 py-3 font-medium">Khách hàng</th>
                                    <th className="px-6 py-3 font-medium text-right">Tổng tiền</th>
                                    <th className="px-6 py-3 font-medium text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.slice(0, 5).map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {order.orderNumber}
                                            <div className="text-xs text-slate-500">{formatDate(order.createdAt)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 truncate max-w-[120px]" title={order.customerName}>
                                                {order.customerName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {formatPrice(order.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {order.status === 'pending' ? 'Chờ xác nhận' :
                                                    order.status === 'processing' ? 'Đang xử lý' :
                                                        order.status === 'delivered' ? 'Đã giao' : 'Đã hủy'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            Chưa có đơn hàng nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
