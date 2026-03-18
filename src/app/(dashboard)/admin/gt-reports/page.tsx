"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { BarChart3, MapPin, ShoppingCart, TrendingUp, Users, Store, CheckCircle } from "lucide-react";

const formatPrice = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtDisplay = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

interface UserReport {
    userId: string;
    fullName: string;
    avatarUrl?: string;
    outletCount: number;
    checkinCount: number;
    orderCount: number;
    orderAmount: number;
}

interface DistrictReport {
    district: string;
    outletCount: number;
    checkinCount: number;
}

type Period = "today" | "week" | "month" | "year" | "custom";

export default function AdminGTReportsPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>("month");

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [customFrom, setCustomFrom] = useState(fmtDate(firstOfMonth));
    const [customTo, setCustomTo] = useState(fmtDate(now));

    const [userReports, setUserReports] = useState<UserReport[]>([]);
    const [districtReports, setDistrictReports] = useState<DistrictReport[]>([]);

    const getDateRange = useCallback((): [Date, Date] => {
        const n = new Date();
        switch (period) {
            case "today": {
                const s = new Date(n); s.setHours(0, 0, 0, 0);
                const e = new Date(n); e.setHours(23, 59, 59, 999);
                return [s, e];
            }
            case "week": {
                const day = n.getDay() || 7; // Mon=1
                const s = new Date(n); s.setDate(n.getDate() - day + 1); s.setHours(0, 0, 0, 0);
                const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23, 59, 59, 999);
                return [s, e];
            }
            case "month": {
                const s = new Date(n.getFullYear(), n.getMonth(), 1);
                const e = new Date(n.getFullYear(), n.getMonth() + 1, 0, 23, 59, 59, 999);
                return [s, e];
            }
            case "year": {
                const s = new Date(n.getFullYear(), 0, 1);
                const e = new Date(n.getFullYear(), 11, 31, 23, 59, 59, 999);
                return [s, e];
            }
            case "custom": {
                const s = new Date(customFrom); s.setHours(0, 0, 0, 0);
                const e = new Date(customTo); e.setHours(23, 59, 59, 999);
                return [s, e];
            }
        }
    }, [period, customFrom, customTo]);

    const loadReports = useCallback(async () => {
        setLoading(true);
        const [dateFrom, dateTo] = getDateRange();

        try {
            // 1. All Sales GT users
            const { data: gtUsers } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('role', 'sales_gt');

            // 2. All active outlets
            const { data: outlets } = await supabase
                .from('gt_outlets')
                .select('id, district, assigned_to')
                .eq('status', 'active');

            // 3. Checkins in range
            const { data: checkins } = await supabase
                .from('gt_checkins')
                .select('user_id, outlet_id')
                .gte('check_in_at', dateFrom.toISOString())
                .lte('check_in_at', dateTo.toISOString());

            // 4. GT orders in range
            const { data: orders } = await supabase
                .from('orders')
                .select('telesales_user_id, total_amount')
                .eq('source', 'SALES_GT')
                .gte('created_at', dateFrom.toISOString())
                .lte('created_at', dateTo.toISOString())
                .neq('status', 'cancelled');

            // Build per-user
            const userMap = new Map<string, UserReport>();
            (gtUsers || []).forEach((u: any) => {
                userMap.set(u.id, {
                    userId: u.id, fullName: u.full_name || "N/A", avatarUrl: u.avatar_url,
                    outletCount: 0, checkinCount: 0, orderCount: 0, orderAmount: 0
                });
            });

            (outlets || []).forEach((o: any) => {
                if (o.assigned_to && userMap.has(o.assigned_to)) userMap.get(o.assigned_to)!.outletCount++;
            });
            (checkins || []).forEach((c: any) => {
                if (userMap.has(c.user_id)) userMap.get(c.user_id)!.checkinCount++;
            });
            (orders || []).forEach((o: any) => {
                if (o.telesales_user_id && userMap.has(o.telesales_user_id)) {
                    userMap.get(o.telesales_user_id)!.orderCount++;
                    userMap.get(o.telesales_user_id)!.orderAmount += Number(o.total_amount || 0);
                }
            });
            setUserReports(Array.from(userMap.values()).sort((a, b) => b.checkinCount - a.checkinCount));

            // Build per-district
            const distMap = new Map<string, DistrictReport>();
            const outletDist = new Map<string, string>();
            (outlets || []).forEach((o: any) => {
                outletDist.set(o.id, o.district);
                if (!distMap.has(o.district)) distMap.set(o.district, { district: o.district, outletCount: 0, checkinCount: 0 });
                distMap.get(o.district)!.outletCount++;
            });
            (checkins || []).forEach((c: any) => {
                const d = outletDist.get(c.outlet_id);
                if (d && distMap.has(d)) distMap.get(d)!.checkinCount++;
            });
            setDistrictReports(Array.from(distMap.values()).sort((a, b) => b.checkinCount - a.checkinCount));
        } catch (err) {
            console.error("Error loading GT reports:", err);
        } finally {
            setLoading(false);
        }
    }, [getDateRange]);

    useEffect(() => { loadReports(); }, [loadReports]);

    const totalOutlets = userReports.reduce((s, r) => s + r.outletCount, 0);
    const totalCheckins = userReports.reduce((s, r) => s + r.checkinCount, 0);
    const totalOrders = userReports.reduce((s, r) => s + r.orderCount, 0);
    const totalRevenue = userReports.reduce((s, r) => s + r.orderAmount, 0);
    const visitRate = totalOutlets > 0 ? Math.round((totalCheckins / totalOutlets) * 100) : 0;

    const [dateFrom] = getDateRange();
    const dateLabel = period === "today" ? fmtDisplay(new Date())
        : period === "week" ? `Tuần này`
        : period === "month" ? `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`
        : period === "year" ? `Năm ${now.getFullYear()}`
        : `${customFrom} → ${customTo}`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">📊 Báo cáo Sales GT</h1>
                    <p className="text-sm text-slate-500 mt-1">Tổng hợp hoạt động tất cả nhân viên Sales GT • {dateLabel}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {([["today", "Ngày"], ["week", "Tuần"], ["month", "Tháng"], ["year", "Năm"], ["custom", "Tùy chỉnh"]] as [Period, string][]).map(([key, label]) => (
                            <button key={key} onClick={() => setPeriod(key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === key ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >{label}</button>
                        ))}
                    </div>
                    {period === "custom" && (
                        <div className="flex items-center gap-2">
                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
                            <span className="text-xs text-slate-400">→</span>
                            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" />
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg"><Store className="w-4 h-4 text-blue-600" /></div>
                        <span className="text-xs text-slate-500">Điểm bán</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{totalOutlets}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-teal-50 rounded-lg"><CheckCircle className="w-4 h-4 text-teal-600" /></div>
                        <span className="text-xs text-slate-500">Check-in</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{totalCheckins}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-emerald-50 rounded-lg"><BarChart3 className="w-4 h-4 text-emerald-600" /></div>
                        <span className="text-xs text-slate-500">Tỷ lệ viếng</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{visitRate}%</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-purple-50 rounded-lg"><ShoppingCart className="w-4 h-4 text-purple-600" /></div>
                        <span className="text-xs text-slate-500">Đơn hàng</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{totalOrders}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-green-50 rounded-lg"><TrendingUp className="w-4 h-4 text-green-600" /></div>
                        <span className="text-xs text-slate-500">Doanh thu</span>
                    </div>
                    <p className="text-lg font-bold text-green-700">{formatPrice(totalRevenue)}</p>
                </div>
            </div>

            {loading && <div className="text-center py-8 text-slate-400">Đang tải...</div>}

            {!loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Per-User */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                            <Users className="w-4 h-4 text-teal-600" />
                            <h3 className="font-semibold text-slate-800 text-sm">Theo nhân viên</h3>
                        </div>
                        {userReports.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Chưa có nhân viên Sales GT</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="text-left px-4 py-2.5 font-medium">Nhân viên</th>
                                            <th className="text-center px-3 py-2.5 font-medium">Điểm bán</th>
                                            <th className="text-center px-3 py-2.5 font-medium">Check-in</th>
                                            <th className="text-center px-3 py-2.5 font-medium">Đơn</th>
                                            <th className="text-right px-4 py-2.5 font-medium">Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {userReports.map(r => (
                                            <tr key={r.userId} className="hover:bg-slate-50">
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0">
                                                            {r.fullName.charAt(0)}
                                                        </div>
                                                        <span className="font-medium text-slate-800 text-xs truncate">{r.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center text-xs text-slate-600">{r.outletCount}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.checkinCount > 0 ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {r.checkinCount}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center text-xs text-slate-600">{r.orderCount}</td>
                                                <td className="px-4 py-2.5 text-right text-xs font-medium text-slate-800">
                                                    {r.orderAmount > 0 ? formatPrice(r.orderAmount) : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-50 font-semibold">
                                            <td className="px-4 py-2.5 text-xs text-slate-700">Tổng cộng</td>
                                            <td className="px-3 py-2.5 text-center text-xs text-slate-700">{totalOutlets}</td>
                                            <td className="px-3 py-2.5 text-center text-xs text-teal-700">{totalCheckins}</td>
                                            <td className="px-3 py-2.5 text-center text-xs text-slate-700">{totalOrders}</td>
                                            <td className="px-4 py-2.5 text-right text-xs text-teal-700">{formatPrice(totalRevenue)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Per-District */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <h3 className="font-semibold text-slate-800 text-sm">Theo quận/huyện</h3>
                        </div>
                        {districtReports.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Chưa có dữ liệu</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="text-left px-4 py-2.5 font-medium">Quận/Huyện</th>
                                            <th className="text-center px-3 py-2.5 font-medium">Điểm bán</th>
                                            <th className="text-center px-3 py-2.5 font-medium">Check-in</th>
                                            <th className="text-center px-3 py-2.5 font-medium">Tỷ lệ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {districtReports.map(r => (
                                            <tr key={r.district} className="hover:bg-slate-50">
                                                <td className="px-4 py-2.5 font-medium text-slate-800 text-xs">{r.district}</td>
                                                <td className="px-3 py-2.5 text-center text-xs text-slate-600">{r.outletCount}</td>
                                                <td className="px-3 py-2.5 text-center text-xs text-slate-600">{r.checkinCount}</td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-teal-500 rounded-full"
                                                                style={{ width: `${r.outletCount > 0 ? Math.min(100, (r.checkinCount / r.outletCount) * 100) : 0}%` }} />
                                                        </div>
                                                        <span className="text-[11px] text-slate-500 w-8 text-right">
                                                            {r.outletCount > 0 ? Math.round((r.checkinCount / r.outletCount) * 100) : 0}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
