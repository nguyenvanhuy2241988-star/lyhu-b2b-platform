"use client";

import { useEffect, useState, useMemo } from "react";
import { loadOrders } from "@/lib/ordersStore";
import { loadUsers, Region } from "@/lib/usersStore";
import { getMonthlyCtvLeaderboard, type LeaderboardRow } from "@/lib/ctvLeaderboard";
import { Trophy, Medal, Calendar, Filter, Download } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const MONTHS = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

const REGIONS: { value: Region | "all"; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "North", label: "Miền Bắc" },
    { value: "Central", label: "Miền Trung" },
    { value: "South", label: "Miền Nam" },
    { value: "Other", label: "Khác" },
];

const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-slate-500">#{rank}</span>;
};

export default function AdminLeaderboardPage() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [filterRegion, setFilterRegion] = useState<Region | "all">("all");
    const [filterProvince, setFilterProvince] = useState("");

    const leaderboard = useMemo(() => {
        const orders = loadOrders();
        const users = loadUsers();
        return getMonthlyCtvLeaderboard({ year: selectedYear, month: selectedMonth, orders, users });
    }, [selectedYear, selectedMonth]);

    const allProvinces = useMemo(() => {
        const provinces = new Set<string>();
        leaderboard.overall.forEach(r => provinces.add(r.province));
        return Array.from(provinces).sort();
    }, [leaderboard]);

    const filteredRows = useMemo(() => {
        let rows = leaderboard.overall;

        if (filterRegion !== "all") {
            rows = rows.filter(r => r.region === filterRegion);
        }

        if (filterProvince) {
            rows = rows.filter(r => r.province.toLowerCase().includes(filterProvince.toLowerCase()));
        }

        // Re-rank after filtering
        return rows.map((row, index) => ({ ...row, rank: index + 1 }));
    }, [leaderboard, filterRegion, filterProvince]);

    const stats = useMemo(() => ({
        totalCtv: leaderboard.overall.length,
        totalSales: leaderboard.overall.reduce((sum, r) => sum + r.sales, 0),
        totalOrders: leaderboard.overall.reduce((sum, r) => sum + r.orders, 0),
        totalCommission: leaderboard.overall.reduce((sum, r) => sum + r.commission, 0),
    }), [leaderboard]);

    const handleExportCSV = () => {
        const headers = ["Rank", "CTV Name", "Province", "Region", "Sales", "Orders", "Commission"];
        const rows = filteredRows.map(r => [
            r.rank,
            r.ctvName,
            r.province,
            r.region,
            r.sales,
            r.orders,
            r.commission,
        ]);

        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leaderboard-${selectedYear}-${selectedMonth}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bảng xếp hạng CTV</h1>
                    <p className="text-slate-600">Xem hiệu suất CTV theo tháng và khu vực</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-600">Tổng CTV</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalCtv}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-600">Tổng doanh số</p>
                    <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalSales)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-600">Tổng đơn</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-600">Tổng hoa hồng</p>
                    <p className="text-2xl font-bold text-purple-600">{formatPrice(stats.totalCommission)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-slate-500" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            value={filterRegion}
                            onChange={(e) => setFilterRegion(e.target.value as Region | "all")}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {REGIONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Lọc theo tỉnh..."
                            value={filterProvince}
                            onChange={(e) => setFilterProvince(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium w-16">Hạng</th>
                                <th className="px-6 py-3 font-medium">CTV</th>
                                <th className="px-6 py-3 font-medium">Tỉnh</th>
                                <th className="px-6 py-3 font-medium">Khu vực</th>
                                <th className="px-6 py-3 font-medium text-right">Doanh số</th>
                                <th className="px-6 py-3 font-medium text-right">Đơn</th>
                                <th className="px-6 py-3 font-medium text-right">Hoa hồng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row) => (
                                    <tr key={row.ctvId} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getRankBadge(row.rank)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{row.ctvName}</td>
                                        <td className="px-6 py-4 text-slate-600">{row.province}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                {REGIONS.find(r => r.value === row.region)?.label || row.region}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">{formatPrice(row.sales)}</td>
                                        <td className="px-6 py-4 text-right">{row.orders}</td>
                                        <td className="px-6 py-4 text-right">{formatPrice(row.commission)}</td>
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
