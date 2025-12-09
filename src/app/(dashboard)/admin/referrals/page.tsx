"use client";

import { useEffect, useState, useMemo } from "react";
import { loadOrders, type Order } from "@/lib/ordersStore";
import { loadUsers, type User } from "@/lib/usersStore";
import { getChildActivationStatus } from "@/lib/referralAnalytics";
import { getCtvLevel, LEVEL_COLORS } from "@/lib/ctvLevels";
import { ROLES } from "@/lib/constants";
import { Users, Search, Filter, AlertTriangle } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN");
};

interface CtvReferralInfo {
    id: string;
    name: string;
    email: string;
    referralCode: string;
    referredByCode: string | null;
    referredByCtvName: string | null;
    activatedAt: string | null;
    isActivated: boolean;
    totalOrders: number;
    totalSales: number;
    totalCommission: number;
    flaggedOrders: number;
    level: string;
}

type FilterType = "all" | "has_parent" | "no_parent" | "activated" | "not_activated" | "has_flagged";

export default function AdminReferralsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<FilterType>("all");

    useEffect(() => {
        const allUsers = loadUsers();
        const allOrders = loadOrders();
        setUsers(allUsers);
        setOrders(allOrders);
    }, []);

    const ctvData = useMemo(() => {
        const ctvUsers = users.filter(u => u.role === ROLES.CTV);

        return ctvUsers.map(ctv => {
            const { isActivated, activatedAt } = getChildActivationStatus(ctv.id, orders);
            const levelInfo = getCtvLevel(orders, ctv.id);

            // Find parent CTV name
            let referredByCtvName = null;
            if (ctv.referredByCtvId) {
                const parent = users.find(u => u.id === ctv.referredByCtvId);
                referredByCtvName = parent?.name || null;
            }

            // Calculate order stats
            const ctvOrders = orders.filter(o => o.source === "CTV" && o.ctvId === ctv.id && o.status !== "cancelled");
            const totalOrders = ctvOrders.length;
            const totalSales = ctvOrders.reduce((sum, o) => sum + o.totalAmount, 0);
            const totalCommission = ctvOrders.reduce((sum, o) => sum + (o.ctvCommission || 0), 0);
            const flaggedOrders = ctvOrders.filter(o => o.flagged).length;

            return {
                id: ctv.id,
                name: ctv.name,
                email: ctv.email,
                referralCode: ctv.referralCode || "",
                referredByCode: ctv.referredByCode || null,
                referredByCtvName,
                activatedAt: activatedAt || ctv.activatedAt || null,
                isActivated,
                totalOrders,
                totalSales,
                totalCommission,
                flaggedOrders,
                level: levelInfo.level,
            } as CtvReferralInfo;
        });
    }, [users, orders]);

    const filteredData = useMemo(() => {
        let result = ctvData;

        // Apply filter
        switch (filterType) {
            case "has_parent":
                result = result.filter(c => c.referredByCode);
                break;
            case "no_parent":
                result = result.filter(c => !c.referredByCode);
                break;
            case "activated":
                result = result.filter(c => c.isActivated);
                break;
            case "not_activated":
                result = result.filter(c => !c.isActivated);
                break;
            case "has_flagged":
                result = result.filter(c => c.flaggedOrders > 0);
                break;
        }

        // Apply search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(lowerTerm) ||
                c.email.toLowerCase().includes(lowerTerm) ||
                c.referralCode.toLowerCase().includes(lowerTerm)
            );
        }

        return result;
    }, [ctvData, filterType, searchTerm]);

    const stats = useMemo(() => ({
        totalCtvs: ctvData.length,
        withParent: ctvData.filter(c => c.referredByCode).length,
        activated: ctvData.filter(c => c.isActivated).length,
        withFlagged: ctvData.filter(c => c.flaggedOrders > 0).length,
    }), [ctvData]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý giới thiệu CTV</h1>
                    <p className="text-slate-600">Theo dõi cây giới thiệu, kích hoạt và đơn flagged</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Tổng CTV</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.totalCtvs}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Có người giới thiệu</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.withParent}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Đã kích hoạt</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.activated}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">CTV có đơn flagged</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.withFlagged}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email, mã..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as FilterType)}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">Tất cả</option>
                            <option value="has_parent">Có người giới thiệu</option>
                            <option value="no_parent">Không có người giới thiệu</option>
                            <option value="activated">Đã kích hoạt</option>
                            <option value="not_activated">Chưa kích hoạt</option>
                            <option value="has_flagged">Có đơn flagged</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">CTV</th>
                                <th className="px-6 py-3 font-medium">Level</th>
                                <th className="px-6 py-3 font-medium">Mã giới thiệu</th>
                                <th className="px-6 py-3 font-medium">Người giới thiệu</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Đơn</th>
                                <th className="px-6 py-3 font-medium text-right">Flagged</th>
                                <th className="px-6 py-3 font-medium text-right">Doanh số</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                                        Không tìm thấy CTV nào
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((ctv) => (
                                    <tr key={ctv.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-900">{ctv.name}</p>
                                                <p className="text-xs text-slate-500">{ctv.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[ctv.level as keyof typeof LEVEL_COLORS].bg} ${LEVEL_COLORS[ctv.level as keyof typeof LEVEL_COLORS].text}`}>
                                                {ctv.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-600">{ctv.referralCode}</td>
                                        <td className="px-6 py-4">
                                            {ctv.referredByCtvName ? (
                                                <div>
                                                    <p className="text-slate-900">{ctv.referredByCtvName}</p>
                                                    <p className="text-xs text-slate-500">{ctv.referredByCode}</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ctv.isActivated
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                {ctv.isActivated ? "Đã kích hoạt" : "Chưa kích hoạt"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-900">{ctv.totalOrders}</td>
                                        <td className="px-6 py-4 text-right">
                                            {ctv.flaggedOrders > 0 ? (
                                                <span className="inline-flex items-center gap-1 text-red-600">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    {ctv.flaggedOrders}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">0</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {formatPrice(ctv.totalSales)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
