"use client";

import { useEffect, useState, useMemo } from "react";
import { getCurrentUser } from "@/lib/auth";
import { loadOrders } from "@/lib/ordersStore";
import { loadUsers } from "@/lib/usersStore";
import { getMonthlyCtvLeaderboard, getCtvRankInLeaderboard, type LeaderboardRow } from "@/lib/ctvLeaderboard";
import { Trophy, Medal, TrendingUp, Users, Calendar, MapPin } from "lucide-react";

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

const REGION_LABELS: Record<string, string> = {
    North: "Miền Bắc",
    Central: "Miền Trung",
    South: "Miền Nam",
    Other: "Khác",
};

const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-slate-500">#{rank}</span>;
};

export default function CTVLeaderboardPage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState<"overall" | "region" | "province">("overall");

    useEffect(() => {
        const user = getCurrentUser();
        setCurrentUser(user);
    }, []);

    const leaderboard = useMemo(() => {
        const orders = loadOrders();
        const users = loadUsers();
        return getMonthlyCtvLeaderboard({ year: selectedYear, month: selectedMonth, orders, users });
    }, [selectedYear, selectedMonth]);

    const myRank = useMemo(() => {
        if (!currentUser) return null;
        return getCtvRankInLeaderboard(leaderboard, currentUser.id);
    }, [leaderboard, currentUser]);

    const displayRows = useMemo(() => {
        if (viewMode === "overall") {
            return leaderboard.overall.slice(0, 10);
        }
        if (viewMode === "region" && myRank?.region) {
            return (leaderboard.byRegion[myRank.region] || []).slice(0, 10);
        }
        if (viewMode === "province" && myRank?.province) {
            return (leaderboard.byProvince[myRank.province] || []).slice(0, 10);
        }
        return [];
    }, [leaderboard, viewMode, myRank]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bảng xếp hạng CTV</h1>
                    <p className="text-slate-600">Xem thứ hạng của bạn so với các CTV khác</p>
                </div>
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
            </div>

            {/* My Rank Card */}
            {myRank?.stats && (
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-primary-100 text-sm">Thứ hạng của bạn</p>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-8 h-8" />
                                    <span className="text-4xl font-bold">#{myRank.overallRank}</span>
                                </div>
                                <div className="text-primary-100">
                                    <p>Toàn quốc</p>
                                </div>
                            </div>
                            {myRank.region && myRank.regionRank && (
                                <p className="mt-2 text-primary-100">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    #{myRank.regionRank} {REGION_LABELS[myRank.region]}
                                </p>
                            )}
                            {myRank.province && myRank.provinceRank && (
                                <p className="mt-1 text-primary-100">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    #{myRank.provinceRank} {myRank.province}
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
                            <div>
                                <p className="text-2xl font-bold">{formatPrice(myRank.stats.sales)}</p>
                                <p className="text-primary-100 text-sm">Doanh số</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{myRank.stats.orders}</p>
                                <p className="text-primary-100 text-sm">Đơn hàng</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatPrice(myRank.stats.commission)}</p>
                                <p className="text-primary-100 text-sm">Hoa hồng</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setViewMode("overall")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === "overall" ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                    <Users className="w-4 h-4 inline mr-2" />
                    Toàn quốc
                </button>
                {myRank?.region && (
                    <button
                        onClick={() => setViewMode("region")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === "region" ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                    >
                        <MapPin className="w-4 h-4 inline mr-2" />
                        {REGION_LABELS[myRank.region]}
                    </button>
                )}
                {myRank?.province && (
                    <button
                        onClick={() => setViewMode("province")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === "province" ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                    >
                        <MapPin className="w-4 h-4 inline mr-2" />
                        {myRank.province}
                    </button>
                )}
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Top 10 {viewMode === "overall"
                                ? "Toàn quốc"
                                : viewMode === "region"
                                    ? REGION_LABELS[myRank?.region || "Other"]
                                    : myRank?.province || "Tỉnh/Thành"}
                        </h3>
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium w-16">Hạng</th>
                                <th className="px-6 py-3 font-medium">CTV</th>
                                <th className="px-6 py-3 font-medium">Khu vực</th>
                                <th className="px-6 py-3 font-medium text-right">Doanh số</th>
                                <th className="px-6 py-3 font-medium text-right">Đơn hàng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {displayRows.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="py-12 flex flex-col items-center justify-center text-center">
                                            <div className="bg-slate-50 p-4 rounded-full mb-3">
                                                <Trophy className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-slate-900 font-medium mb-1">Chưa có bảng xếp hạng</h3>
                                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                                Dữ liệu xếp hạng sẽ được cập nhật khi có đơn hàng trong tháng này.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayRows.map((row) => (
                                    <tr
                                        key={row.ctvId}
                                        className={`hover:bg-slate-50 ${row.ctvId === currentUser?.id ? "bg-primary-50" : ""}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getRankBadge(row.rank)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {row.ctvName}
                                            {row.ctvId === currentUser?.id && (
                                                <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Bạn</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {row.province} ({REGION_LABELS[row.region]})
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">{formatPrice(row.sales)}</td>
                                        <td className="px-6 py-4 text-right">{row.orders}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Motivational */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                    <div>
                        <h4 className="font-semibold text-slate-900">Tăng thứ hạng!</h4>
                        <p className="text-sm text-slate-600">Hoàn thành thêm đơn LYHU_SHIP để leo hạng. Top CTV sẽ nhận thưởng đặc biệt!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
