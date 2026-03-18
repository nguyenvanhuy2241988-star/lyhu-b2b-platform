"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { BarChart3, MapPin, ShoppingCart, TrendingUp, Users, Store, CheckCircle, X, Camera, FileText, Clock, ChevronRight, Eye } from "lucide-react";

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

interface CheckinDetail {
    id: string;
    outlet_name: string;
    outlet_address: string;
    outlet_district: string;
    check_in_at: string;
    distance_meters: number | null;
    visit_result: string;
    display_photos: string[];
    market_notes: string | null;
    inventory_notes: string | null;
    check_in_lat: number;
    check_in_lng: number;
}

interface OrderDetail {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    items_count: number;
}

const VISIT_RESULTS: Record<string, { label: string; color: string }> = {
    visited: { label: "Đã ghé", color: "bg-blue-100 text-blue-700" },
    ordered: { label: "Có đơn", color: "bg-green-100 text-green-700" },
    closed: { label: "Đóng cửa", color: "bg-slate-100 text-slate-600" },
    competitor: { label: "Đối thủ", color: "bg-red-100 text-red-700" },
};

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

    // Drill-down state
    const [selectedUser, setSelectedUser] = useState<UserReport | null>(null);
    const [userCheckins, setUserCheckins] = useState<CheckinDetail[]>([]);
    const [userOrders, setUserOrders] = useState<OrderDetail[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const getDateRange = useCallback((): [Date, Date] => {
        const n = new Date();
        switch (period) {
            case "today": {
                const s = new Date(n); s.setHours(0, 0, 0, 0);
                const e = new Date(n); e.setHours(23, 59, 59, 999);
                return [s, e];
            }
            case "week": {
                const day = n.getDay() || 7;
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
            const { data: gtUsers } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('role', 'sales_gt');

            const { data: outlets } = await supabase
                .from('gt_outlets')
                .select('id, district, assigned_to')
                .eq('status', 'active');

            const { data: checkins } = await supabase
                .from('gt_checkins')
                .select('user_id, outlet_id')
                .gte('check_in_at', dateFrom.toISOString())
                .lte('check_in_at', dateTo.toISOString());

            const { data: orders } = await supabase
                .from('orders')
                .select('telesales_user_id, total_amount')
                .eq('source', 'SALES_GT')
                .gte('created_at', dateFrom.toISOString())
                .lte('created_at', dateTo.toISOString())
                .neq('status', 'cancelled');

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

    // Close detail when period changes
    useEffect(() => { setSelectedUser(null); }, [period, customFrom, customTo]);

    // Load user detail: checkins + orders
    const loadUserDetail = useCallback(async (user: UserReport) => {
        if (selectedUser?.userId === user.userId) {
            setSelectedUser(null);
            return;
        }
        setSelectedUser(user);
        setDetailLoading(true);
        const [dateFrom, dateTo] = getDateRange();

        try {
            // Checkins with outlet info
            const { data: checkins } = await supabase
                .from('gt_checkins')
                .select('id, check_in_at, distance_meters, visit_result, display_photos, market_notes, inventory_notes, check_in_lat, check_in_lng, outlet_id')
                .eq('user_id', user.userId)
                .gte('check_in_at', dateFrom.toISOString())
                .lte('check_in_at', dateTo.toISOString())
                .order('check_in_at', { ascending: false });

            // Get outlet details
            const outletIds = Array.from(new Set((checkins || []).map((c: any) => c.outlet_id)));
            let outletMap = new Map<string, { name: string; address: string; district: string }>();
            if (outletIds.length > 0) {
                const { data: outlets } = await supabase
                    .from('gt_outlets')
                    .select('id, name, address, district')
                    .in('id', outletIds);
                (outlets || []).forEach((o: any) => outletMap.set(o.id, { name: o.name, address: o.address, district: o.district }));
            }

            const detailed: CheckinDetail[] = (checkins || []).map((c: any) => {
                const outlet = outletMap.get(c.outlet_id);
                return {
                    id: c.id,
                    outlet_name: outlet?.name || "N/A",
                    outlet_address: outlet?.address || "",
                    outlet_district: outlet?.district || "",
                    check_in_at: c.check_in_at,
                    distance_meters: c.distance_meters,
                    visit_result: c.visit_result || "visited",
                    display_photos: c.display_photos || [],
                    market_notes: c.market_notes,
                    inventory_notes: c.inventory_notes,
                    check_in_lat: c.check_in_lat,
                    check_in_lng: c.check_in_lng,
                };
            });
            setUserCheckins(detailed);

            // Orders
            const { data: orders } = await supabase
                .from('orders')
                .select('id, created_at, total_amount, status, order_items(id)')
                .eq('source', 'SALES_GT')
                .eq('telesales_user_id', user.userId)
                .gte('created_at', dateFrom.toISOString())
                .lte('created_at', dateTo.toISOString())
                .neq('status', 'cancelled')
                .order('created_at', { ascending: false });

            setUserOrders((orders || []).map((o: any) => ({
                id: o.id,
                created_at: o.created_at,
                total_amount: Number(o.total_amount || 0),
                status: o.status,
                items_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
            })));
        } catch (err) {
            console.error("Error loading user detail:", err);
        } finally {
            setDetailLoading(false);
        }
    }, [getDateRange, selectedUser]);

    const totalOutlets = userReports.reduce((s, r) => s + r.outletCount, 0);
    const totalCheckins = userReports.reduce((s, r) => s + r.checkinCount, 0);
    const totalOrders = userReports.reduce((s, r) => s + r.orderCount, 0);
    const totalRevenue = userReports.reduce((s, r) => s + r.orderAmount, 0);
    const visitRate = totalOutlets > 0 ? Math.round((totalCheckins / totalOutlets) * 100) : 0;

    const dateLabel = period === "today" ? fmtDisplay(new Date())
        : period === "week" ? `Tuần này`
        : period === "month" ? `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`
        : period === "year" ? `Năm ${now.getFullYear()}`
        : `${customFrom} → ${customTo}`;

    // Group checkins by date for timeline
    const checkinsByDate = userCheckins.reduce((acc, c) => {
        const dateKey = new Date(c.check_in_at).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(c);
        return acc;
    }, {} as Record<string, CheckinDetail[]>);

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
                            <span className="text-[11px] text-slate-400 ml-auto">Click để xem chi tiết</span>
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
                                            <tr key={r.userId}
                                                onClick={() => loadUserDetail(r)}
                                                className={`cursor-pointer transition-all ${selectedUser?.userId === r.userId ? 'bg-teal-50 ring-1 ring-inset ring-teal-200' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0">
                                                            {r.fullName.charAt(0)}
                                                        </div>
                                                        <span className="font-medium text-slate-800 text-xs truncate">{r.fullName}</span>
                                                        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${selectedUser?.userId === r.userId ? 'rotate-90' : ''}`} />
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

            {/* Detail Panel */}
            {selectedUser && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Detail Header */}
                    <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-bold">
                                {selectedUser.fullName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{selectedUser.fullName}</h3>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[11px] text-slate-500">📍 {selectedUser.outletCount} điểm bán</span>
                                    <span className="text-[11px] text-slate-500">✅ {selectedUser.checkinCount} check-in</span>
                                    <span className="text-[11px] text-slate-500">🛒 {selectedUser.orderCount} đơn</span>
                                    <span className="text-[11px] text-green-600 font-medium">{formatPrice(selectedUser.orderAmount)}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {detailLoading ? (
                        <div className="py-12 text-center text-slate-400">
                            <div className="w-6 h-6 border-2 border-teal-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            Đang tải chi tiết...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                            {/* Checkin Timeline */}
                            <div className="lg:col-span-2 max-h-[600px] overflow-y-auto">
                                <div className="px-5 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
                                    <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-teal-600" />
                                        Check-in ({userCheckins.length})
                                    </h4>
                                </div>
                                {userCheckins.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">Không có check-in trong kỳ này</div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {Object.entries(checkinsByDate).map(([dateKey, checkins]) => (
                                            <div key={dateKey}>
                                                <div className="px-5 py-2 bg-slate-50/80 sticky top-[45px] z-[5]">
                                                    <span className="text-xs font-semibold text-slate-500 uppercase">{dateKey}</span>
                                                </div>
                                                <div className="divide-y divide-slate-50">
                                                    {checkins.map(c => (
                                                        <div key={c.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                                                            <div className="flex items-start gap-3">
                                                                {/* Time column */}
                                                                <div className="flex-shrink-0 text-center pt-0.5">
                                                                    <Clock className="w-4 h-4 text-slate-400 mx-auto" />
                                                                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                                                                        {new Date(c.check_in_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-semibold text-sm text-slate-800">{c.outlet_name}</span>
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${VISIT_RESULTS[c.visit_result]?.color || 'bg-slate-100 text-slate-500'}`}>
                                                                            {VISIT_RESULTS[c.visit_result]?.label || c.visit_result}
                                                                        </span>
                                                                        {c.distance_meters !== null && (
                                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.distance_meters <= 200 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                                📍 {c.distance_meters}m
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-400 mt-0.5">{c.outlet_address} • {c.outlet_district}</p>

                                                                    {/* Notes */}
                                                                    {(c.inventory_notes || c.market_notes) && (
                                                                        <div className="mt-2 space-y-1">
                                                                            {c.inventory_notes && (
                                                                                <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-blue-50 rounded-md px-2.5 py-1.5">
                                                                                    <FileText className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                                                                                    <span><strong className="text-blue-600">Tồn kho:</strong> {c.inventory_notes}</span>
                                                                                </div>
                                                                            )}
                                                                            {c.market_notes && (
                                                                                <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-orange-50 rounded-md px-2.5 py-1.5">
                                                                                    <FileText className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                                                                                    <span><strong className="text-orange-600">Thị trường:</strong> {c.market_notes}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Photos */}
                                                                    {c.display_photos.length > 0 && (
                                                                        <div className="mt-2 flex gap-2 flex-wrap">
                                                                            {c.display_photos.map((url, i) => (
                                                                                <button
                                                                                    key={i}
                                                                                    onClick={(e) => { e.stopPropagation(); setLightboxUrl(url); }}
                                                                                    className="relative group rounded-lg overflow-hidden border border-slate-200 hover:border-teal-300 transition-colors"
                                                                                >
                                                                                    <img src={url} alt={`Ảnh ${i + 1}`} className="w-20 h-20 object-cover" />
                                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                                                        <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                    </div>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Orders sidebar */}
                            <div className="max-h-[600px] overflow-y-auto">
                                <div className="px-5 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
                                    <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4 text-purple-600" />
                                        Đơn hàng ({userOrders.length})
                                    </h4>
                                </div>
                                {userOrders.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm">Không có đơn hàng trong kỳ</div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {userOrders.map(o => (
                                            <div key={o.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-slate-700">{formatPrice(o.total_amount)}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${o.status === 'completed' ? 'bg-green-100 text-green-700' : o.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {o.status === 'completed' ? 'Hoàn tất' : o.status === 'pending' ? 'Chờ duyệt' : o.status}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {new Date(o.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    {o.items_count > 0 && ` • ${o.items_count} SP`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Lightbox */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Ảnh check-in"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
