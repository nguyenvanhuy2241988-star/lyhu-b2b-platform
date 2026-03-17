"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { BarChart3, MapPin, ShoppingCart, TrendingUp } from "lucide-react";

interface DistrictReport {
    district: string;
    outletCount: number;
    checkinCount: number;
    orderCount: number;
}

export default function ReportsPage() {
    const supabase = createClient();
    const [reports, setReports] = useState<DistrictReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"today" | "week" | "month">("month");

    const loadReports = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get outlets grouped by district
        const { data: outlets } = await supabase
            .from('gt_outlets')
            .select('id, district')
            .eq('assigned_to', user.id)
            .eq('status', 'active');

        // Get date range
        const now = new Date();
        let dateFrom = new Date();
        if (period === "today") dateFrom.setHours(0, 0, 0, 0);
        else if (period === "week") dateFrom.setDate(now.getDate() - 7);
        else dateFrom.setDate(1); // First of month

        // Get checkins in period
        const { data: checkins } = await supabase
            .from('gt_checkins')
            .select('outlet_id')
            .eq('user_id', user.id)
            .gte('check_in_at', dateFrom.toISOString());

        // Build report by district
        const districtMap = new Map<string, DistrictReport>();
        (outlets || []).forEach((o: any) => {
            if (!districtMap.has(o.district)) {
                districtMap.set(o.district, { district: o.district, outletCount: 0, checkinCount: 0, orderCount: 0 });
            }
            districtMap.get(o.district)!.outletCount++;
        });

        const outletDistrict = new Map<string, string>((outlets || []).map((o: any) => [o.id, o.district]));
        (checkins || []).forEach((c: any) => {
            const d = outletDistrict.get(c.outlet_id);
            if (d && districtMap.has(d)) {
                districtMap.get(d)!.checkinCount++;
            }
        });

        setReports(Array.from(districtMap.values()).sort((a, b) => b.checkinCount - a.checkinCount));
        setLoading(false);
    }, [period]);

    useEffect(() => { loadReports(); }, [loadReports]);

    const totalOutlets = reports.reduce((s, r) => s + r.outletCount, 0);
    const totalCheckins = reports.reduce((s, r) => s + r.checkinCount, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-900">📈 Báo cáo Sales GT</h1>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {([["today", "Hôm nay"], ["week", "Tuần"], ["month", "Tháng"]] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setPeriod(key)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === key ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg"><MapPin className="w-4 h-4 text-blue-600" /></div>
                        <span className="text-sm text-slate-600">Tổng điểm bán</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{totalOutlets}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg"><BarChart3 className="w-4 h-4 text-teal-600" /></div>
                        <span className="text-sm text-slate-600">Lượt check-in</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{totalCheckins}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="w-4 h-4 text-green-600" /></div>
                        <span className="text-sm text-slate-600">Tỷ lệ viếng thăm</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{totalOutlets > 0 ? Math.round((totalCheckins / totalOutlets) * 100) : 0}%</p>
                </div>
            </div>

            {/* District breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800 text-sm">Theo quận/huyện</h3>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Đang tải...</div>
                ) : reports.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Chưa có dữ liệu</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="text-left px-5 py-2.5 font-medium">Quận/Huyện</th>
                                <th className="text-center px-5 py-2.5 font-medium">Điểm bán</th>
                                <th className="text-center px-5 py-2.5 font-medium">Check-in</th>
                                <th className="text-center px-5 py-2.5 font-medium">Tỷ lệ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reports.map(r => (
                                <tr key={r.district} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-medium text-slate-800">{r.district}</td>
                                    <td className="px-5 py-3 text-center text-slate-600">{r.outletCount}</td>
                                    <td className="px-5 py-3 text-center text-slate-600">{r.checkinCount}</td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${r.outletCount > 0 ? Math.min(100, (r.checkinCount / r.outletCount) * 100) : 0}%` }} />
                                            </div>
                                            <span className="text-xs text-slate-500">{r.outletCount > 0 ? Math.round((r.checkinCount / r.outletCount) * 100) : 0}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
