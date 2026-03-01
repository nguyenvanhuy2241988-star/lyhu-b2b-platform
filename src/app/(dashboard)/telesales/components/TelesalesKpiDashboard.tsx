"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { fetchActiveKpiMetrics, KpiMetricDefinition, getKpiActualsForRange } from "@/lib/kpiSalaryStore";
import { updateTelesalesKpiSettings } from "@/lib/telesalesDailyStore";
import { Settings, X, Save, TrendingUp, Phone, Users, MessageSquare, Share2, Database, PlusCircle, DollarSign, ShoppingCart, Store, Target, BarChart3, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Map icon key strings from DB to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
    Phone, Users, MessageSquare, Share2, Database, PlusCircle,
    DollarSign, ShoppingCart, Store, Target, BarChart3, TrendingUp, Settings, Save,
};

// Cycle color palette for dynamic cards
const COLOR_PALETTE = [
    { color: "text-blue-600", bg: "bg-blue-50", bar: "bg-blue-500" },
    { color: "text-teal-600", bg: "bg-teal-50", bar: "bg-teal-500" },
    { color: "text-indigo-600", bg: "bg-indigo-50", bar: "bg-indigo-500" },
    { color: "text-purple-600", bg: "bg-purple-50", bar: "bg-purple-500" },
    { color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500" },
    { color: "text-orange-600", bg: "bg-orange-50", bar: "bg-orange-500" },
    { color: "text-rose-600", bg: "bg-rose-50", bar: "bg-rose-500" },
    { color: "text-cyan-600", bg: "bg-cyan-50", bar: "bg-cyan-500" },
];

interface TelesalesKpiDashboardProps {
    date: string;
    userId: string;
    toDate?: string;
    targetDivisor?: number; // Divide monthly targets by this (26=daily, 4=weekly, 1=monthly)
}

export default function TelesalesKpiDashboard({ date, userId, toDate, targetDivisor = 1 }: TelesalesKpiDashboardProps) {
    const { user, role } = useAuth();
    const router = useRouter();

    const [metricDefs, setMetricDefs] = useState<KpiMetricDefinition[]>([]);
    const [actuals, setActuals] = useState<Record<string, number>>({});
    const [targets, setTargets] = useState<Record<string, number>>({});

    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savingSettings, setSavingSettings] = useState(false);

    // Editable targets in settings modal
    const [editTargets, setEditTargets] = useState<Record<string, number>>({});

    const isAdmin = role === 'admin' || role === 'manager' || role === 'telesales_manager';

    // Use ref to avoid stale closure in realtime callbacks
    const loadDataRef = useRef<() => Promise<void>>();

    const loadData = useCallback(async () => {
        if (!userId) return;
        try {
            // 1. Load active metric definitions
            const metrics = await fetchActiveKpiMetrics();
            setMetricDefs(metrics);

            // 2. Load targets from user_kpi_settings (monthly values)
            let userTargets: Record<string, number> = {};
            if (userId !== 'ALL') {
                const { data: kpiData } = await supabase
                    .from('user_kpi_settings')
                    .select('kpi_targets')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (kpiData?.kpi_targets) {
                    userTargets = kpiData.kpi_targets as Record<string, number>;
                }
            } else {
                // For ALL: aggregate targets from all telesales users
                const { data: usersData } = await supabase
                    .from('profiles')
                    .select('id')
                    .in('role', ['telesales', 'sale_admin']);

                const userIds = (usersData || []).map((u: any) => u.id);
                if (userIds.length > 0) {
                    const { data: allKpi } = await supabase
                        .from('user_kpi_settings')
                        .select('kpi_targets')
                        .in('user_id', userIds);

                    for (const row of (allKpi || [])) {
                        const kt = (row as any).kpi_targets as Record<string, number> || {};
                        for (const [k, v] of Object.entries(kt)) {
                            userTargets[k] = (userTargets[k] || 0) + (v || 0);
                        }
                    }
                }
            }

            // Fill targets per metric; fall back to metric definition's monthly_target
            const resolvedTargets: Record<string, number> = {};
            for (const m of metrics) {
                const raw = userTargets[m.key] || m.monthly_target || 0;
                resolvedTargets[m.key] = Math.round(raw / targetDivisor);
            }
            setTargets(resolvedTargets);
            setEditTargets(Object.fromEntries(metrics.map(m => [m.key, userTargets[m.key] || m.monthly_target || 0])));

            // 3. Load actuals
            const startDate = new Date(`${date}T00:00:00`);
            const endDateStr = toDate || date;
            const endDate = new Date(`${endDateStr}T23:59:59.999`);

            if (userId !== 'ALL') {
                const acts = await getKpiActualsForRange(userId, startDate, endDate);
                setActuals(acts);
            } else {
                // Aggregate actuals for all telesales users
                const { data: usersData } = await supabase
                    .from('profiles')
                    .select('id')
                    .in('role', ['telesales', 'sale_admin']);

                const userIds = (usersData || []).map((u: any) => u.id);
                const aggActuals: Record<string, number> = {};
                for (const uid of userIds) {
                    const acts = await getKpiActualsForRange(uid, startDate, endDate);
                    for (const [k, v] of Object.entries(acts)) {
                        aggActuals[k] = (aggActuals[k] || 0) + (v || 0);
                    }
                }
                setActuals(aggActuals);
            }
        } catch (err: any) {
            console.error("Error loading KPI data:", err);
            setError(err.message || JSON.stringify(err) || "Lỗi không xác định");
        } finally {
            setLoading(false);
        }
    }, [userId, date, toDate, targetDivisor]);

    // Keep ref in sync
    useEffect(() => {
        loadDataRef.current = loadData;
    }, [loadData]);

    useEffect(() => {
        loadData();

        // Realtime for daily activities
        const actChannel = supabase
            .channel(`kpi-dash-act-${userId}-${date}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'telesales_daily_activities',
                ...(userId !== 'ALL' ? { filter: `user_id=eq.${userId}` } : {})
            }, () => { loadDataRef.current?.(); })
            .subscribe();

        // Realtime for KPI settings changes
        const setChannel = supabase
            .channel(`kpi-dash-set-${userId}-${date}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'user_kpi_settings',
                ...(userId !== 'ALL' ? { filter: `user_id=eq.${userId}` } : {})
            }, () => { loadDataRef.current?.(); })
            .subscribe();

        // Realtime for metric definitions changes (admin adds/removes metrics)
        const defChannel = supabase
            .channel(`kpi-dash-def-${userId}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'kpi_metric_definitions'
            }, () => {
                console.log("KPI metric definitions changed!");
                loadDataRef.current?.();
            })
            .subscribe();

        // Realtime for CRM activities (calls)
        const crmChannel = supabase
            .channel(`kpi-dash-crm-${userId}-${date}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'crm_activities',
                ...(userId !== 'ALL' ? { filter: `user_id=eq.${userId}` } : {})
            }, () => { loadDataRef.current?.(); })
            .subscribe();

        return () => {
            supabase.removeChannel(actChannel);
            supabase.removeChannel(setChannel);
            supabase.removeChannel(defChannel);
            supabase.removeChannel(crmChannel);
        };
    }, [userId, date, toDate, targetDivisor, loadData]);

    const handleSaveSettings = async () => {
        if (!userId || userId === 'ALL' || !isAdmin) return;
        setSavingSettings(true);
        try {
            // Save targets to user_kpi_settings
            const { data: existing } = await supabase
                .from('user_kpi_settings')
                .select('user_id')
                .eq('user_id', userId)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from('user_kpi_settings')
                    .update({ kpi_targets: editTargets })
                    .eq('user_id', userId);
            } else {
                await supabase
                    .from('user_kpi_settings')
                    .insert([{ user_id: userId, kpi_targets: editTargets }]);
            }

            // Also sync to legacy telesales_kpi_settings for backward compatibility
            await updateTelesalesKpiSettings({
                user_id: userId,
                calls_target: Math.round((editTargets.calls || 0) / 26),
                self_sourced_data_target: Math.round((editTargets.self_sourced || 0) / 26),
                fb_group_posts_target: Math.round((editTargets.fb_group_posts || 0) / 26),
                fb_comments_target: Math.round((editTargets.fb_comments || 0) / 26),
                fb_friends_target: Math.round((editTargets.fb_friends || 0) / 26),
                fb_personal_posts_target: Math.round((editTargets.fb_personal_posts || 0) / 26),
                zalo_posts_target: Math.round((editTargets.zalo_posts || 0) / 26),
            });

            setShowSettings(false);
            loadData();
        } catch (err: any) {
            console.error(err);
            alert("Lỗi lưu cài đặt: " + (err.message || JSON.stringify(err)));
        } finally {
            setSavingSettings(false);
        }
    };

    if (loading) return <div className="h-24 animate-pulse bg-slate-100 rounded-xl mb-6"></div>;
    if (error) return (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 mb-6 text-sm flex flex-col gap-1">
            <span className="font-bold">Lỗi tải dữ liệu KPI:</span>
            <span>{error}</span>
            <span className="text-red-500 text-xs mt-1">(Vui lòng kiểm tra xem Database đã được cập nhật chưa hoặc báo lỗi này cho Dev)</span>
        </div>
    );

    // Build items from metric definitions
    const items = metricDefs.map((m, idx) => {
        const IconComp = ICON_MAP[m.icon] || Target;
        const palette = COLOR_PALETTE[idx % COLOR_PALETTE.length];
        const count = actuals[m.key] || 0;
        const target = targets[m.key] || 0;
        return {
            key: m.key,
            label: m.label,
            icon: IconComp,
            count,
            target,
            fieldType: m.field_type,
            ...palette
        };
    });

    if (items.length === 0) return null;

    const formatValue = (value: number, fieldType: string) => {
        if (fieldType === 'currency') return new Intl.NumberFormat('vi-VN').format(value);
        return value.toLocaleString();
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 relative">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    {userId === 'ALL' ? 'Tiến độ Target Toàn Bộ Team' : 'Tiến độ Thực hiện Target KPI'}
                </h2>
                <div className="flex gap-2">
                    {userId !== 'ALL' && (
                        <button
                            onClick={() => router.push(`/telesales/daily?date=${date}&userId=${userId}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            title="Trang Báo cáo Chi tiết"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Nhập báo cáo</span>
                        </button>
                    )}
                    {isAdmin && userId !== 'ALL' && (
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                            title="Cấu hình KPI Target"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className={cn(
                "grid gap-3",
                items.length <= 4 ? "grid-cols-2 md:grid-cols-4" :
                    items.length <= 7 ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-7" :
                        "grid-cols-2 md:grid-cols-4 lg:grid-cols-9"
            )}>
                {items.map((item, idx) => {
                    const percent = item.target > 0 ? Math.min(100, Math.round((item.count / item.target) * 100)) : 0;
                    return (
                        <div key={item.key} className="border border-slate-100 rounded-lg p-3 relative overflow-hidden flex flex-col justify-between min-h-[100px] hover:border-blue-100 hover:shadow-sm transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div className={cn("p-1.5 rounded-lg", item.bg)}>
                                    <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-slate-900 leading-none">
                                        {item.fieldType === 'currency'
                                            ? formatValue(item.count, item.fieldType)
                                            : item.count
                                        }
                                        <span className="text-[10px] font-normal text-slate-400 ml-0.5">
                                            /{item.fieldType === 'currency' ? formatValue(item.target, item.fieldType) : item.target}
                                        </span>
                                    </div>
                                    <p className={cn("text-[10px] font-bold mt-0.5",
                                        percent >= 100 ? "text-green-600" : "text-slate-500"
                                    )}>
                                        {percent}%
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-600 font-semibold mb-1.5 line-clamp-2 leading-tight" title={item.label}>{item.label}</p>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-700 ease-out", item.bar)}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Settings Modal - Dynamic from metric definitions */}
            {showSettings && isAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-slate-800">Cấu hình Mục tiêu tháng (KPI)</h3>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
                            {metricDefs.map((m, idx) => {
                                const IconComp = ICON_MAP[m.icon] || Target;
                                const palette = COLOR_PALETTE[idx % COLOR_PALETTE.length];
                                return (
                                    <div key={m.key} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
                                        <div className={cn("p-2 rounded-lg shrink-0", palette.bg)}>
                                            <IconComp className={cn("w-4 h-4", palette.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1 truncate">{m.label}</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                    value={editTargets[m.key] || 0}
                                                    onChange={(e) => setEditTargets(prev => ({ ...prev, [m.key]: parseInt(e.target.value) || 0 }))}
                                                    placeholder="Target/tháng"
                                                />
                                                <span className="text-[10px] text-slate-400 font-medium shrink-0">/tháng</span>
                                            </div>
                                            {m.description && <p className="text-[10px] text-slate-400 mt-1 truncate">{m.description}</p>}
                                        </div>
                                        {m.data_source === 'auto' && (
                                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full shrink-0">Tự động</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 rounded-b-xl">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                                className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                            >
                                {savingSettings ? "Đang lưu..." : <><Save className="w-4 h-4" /> Lưu cấu hình</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
