"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient, supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import {
    MapPin, Plus, CheckCircle, Clock, ChevronDown, ChevronUp, X,
    GripVertical, Edit2, Trash2, Play, Loader2, BarChart3, Navigation
} from "lucide-react";

interface Route {
    id: string;
    name: string;
    district: string;
    day_of_week: number[];
    outlet_ids: string[];
    frequency: string;
    status: string;
}

interface Outlet {
    id: string;
    name: string;
    district: string;
    outlet_type: string;
}

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const DISTRICTS = [
    "Hoàn Kiếm", "Ba Đình", "Đống Đa", "Hai Bà Trưng", "Cầu Giấy", "Thanh Xuân",
    "Hoàng Mai", "Long Biên", "Tây Hồ", "Nam Từ Liêm", "Bắc Từ Liêm", "Hà Đông",
    "Gia Lâm", "Đông Anh", "Sóc Sơn", "Thanh Trì"
];

const OUTLET_TYPE_LABELS: Record<string, string> = {
    tap_hoa: "Tạp hóa",
    mini_mart: "Siêu thị mini",
    dai_ly: "Đại lý",
    sieu_thi: "Siêu thị",
    npp: "NPP",
};

export default function RoutesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [todayCheckins, setTodayCheckins] = useState<Set<string>>(new Set());
    const [weekCheckins, setWeekCheckins] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

    // Modal State
    const [showForm, setShowForm] = useState(false);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [saving, setSaving] = useState(false);

    // Active Route Mode
    const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

    // Form
    const [form, setForm] = useState({
        name: "",
        district: "",
        day_of_week: [] as number[],
        frequency: "F4",
        outlet_ids: [] as string[],
    });

    // DnD State
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    const todayDow = new Date().getDay();

    const loadData = useCallback(async () => {
        if (!user) return;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Get start of this week (Monday)
        const weekStart = new Date(todayStart);
        const dayOffset = todayStart.getDay() === 0 ? 6 : todayStart.getDay() - 1;
        weekStart.setDate(weekStart.getDate() - dayOffset);

        const [{ data: routeData }, { data: outletData }, { data: checkinData }, { data: weekCheckinData }] = await Promise.all([
            supabase.from('gt_routes').select('*').eq('assigned_to', user.id).eq('status', 'active').order('name'),
            supabase.from('gt_outlets').select('id, name, district, outlet_type').or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`).eq('status', 'active').order('name'),
            supabase.from('gt_checkins').select('outlet_id').eq('user_id', user.id).gte('check_in_at', todayStart.toISOString()),
            supabase.from('gt_checkins').select('outlet_id').eq('user_id', user.id).gte('check_in_at', weekStart.toISOString()),
        ]);

        setRoutes(routeData || []);
        setOutlets(outletData || []);
        setTodayCheckins(new Set((checkinData || []).map((c: any) => c.outlet_id)));

        // Count weekly checkins per outlet
        const wMap = new Map<string, number>();
        (weekCheckinData || []).forEach((c: any) => {
            wMap.set(c.outlet_id, (wMap.get(c.outlet_id) || 0) + 1);
        });
        setWeekCheckins(wMap);
        setLoading(false);
    }, [user]);

    useEffect(() => { if (user) loadData(); }, [loadData, user]);

    // Open form for edit
    function openEditForm(route: Route) {
        setEditingRoute(route);
        setForm({
            name: route.name,
            district: route.district,
            day_of_week: [...route.day_of_week],
            frequency: route.frequency,
            outlet_ids: [...route.outlet_ids],
        });
        setShowForm(true);
    }

    // Open form for new
    function openNewForm() {
        setEditingRoute(null);
        setForm({ name: "", district: "", day_of_week: [], frequency: "F4", outlet_ids: [] });
        setShowForm(true);
    }

    function toggleDay(day: number) {
        setForm(f => ({
            ...f,
            day_of_week: f.day_of_week.includes(day)
                ? f.day_of_week.filter(d => d !== day)
                : [...f.day_of_week, day].sort(),
        }));
    }

    function toggleOutlet(outletId: string) {
        setForm(f => ({
            ...f,
            outlet_ids: f.outlet_ids.includes(outletId)
                ? f.outlet_ids.filter(id => id !== outletId)
                : [...f.outlet_ids, outletId],
        }));
    }

    async function handleSaveRoute(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        if (editingRoute) {
            // Update
            const { error } = await supabase.from('gt_routes').update({
                name: form.name,
                district: form.district,
                day_of_week: form.day_of_week,
                frequency: form.frequency,
                outlet_ids: form.outlet_ids,
            }).eq('id', editingRoute.id);

            if (error) alert('Lỗi: ' + error.message);
        } else {
            // Insert
            const { error } = await supabase.from('gt_routes').insert({
                ...form,
                assigned_to: user.id,
            });
            if (error) alert('Lỗi: ' + error.message);
        }

        setShowForm(false);
        setEditingRoute(null);
        loadData();
        setSaving(false);
    }

    async function handleDeleteRoute(routeId: string) {
        if (!confirm('Xóa tuyến này? Dữ liệu check-in sẽ không bị ảnh hưởng.')) return;
        const { error } = await supabase.from('gt_routes').delete().eq('id', routeId);
        if (error) {
            alert('Lỗi: ' + error.message);
        } else {
            loadData();
        }
    }

    // Drag & Drop reorder outlets within route
    async function handleDragEnd(routeId: string) {
        if (dragIdx === null || dragOverIdx === null || dragIdx === dragOverIdx) {
            setDragIdx(null);
            setDragOverIdx(null);
            return;
        }

        const route = routes.find(r => r.id === routeId);
        if (!route) return;

        const newIds = [...route.outlet_ids];
        const [removed] = newIds.splice(dragIdx, 1);
        newIds.splice(dragOverIdx, 0, removed);

        // Optimistic update
        setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, outlet_ids: newIds } : r));
        setDragIdx(null);
        setDragOverIdx(null);

        // Save to DB
        await supabase.from('gt_routes').update({ outlet_ids: newIds }).eq('id', routeId);
    }

    function getOutletName(id: string) {
        return outlets.find(o => o.id === id)?.name || "Không rõ";
    }
    function getOutletDistrict(id: string) {
        return outlets.find(o => o.id === id)?.district || "";
    }
    function getOutletType(id: string) {
        const o = outlets.find(o => o.id === id);
        return o ? (OUTLET_TYPE_LABELS[o.outlet_type] || o.outlet_type) : "";
    }

    // Stats
    const totalOutlets = routes.reduce((sum, r) => sum + r.outlet_ids.length, 0);
    const todayRoutes = routes.filter(r => r.day_of_week.includes(todayDow));
    const todayOutletIds = todayRoutes.flatMap(r => r.outlet_ids);
    const todayCheckedCount = todayOutletIds.filter(id => todayCheckins.has(id)).length;
    const todayTotal = todayOutletIds.length;
    const todayPct = todayTotal > 0 ? Math.round((todayCheckedCount / todayTotal) * 100) : 0;

    // Week stats
    const weekOutletIds = routes.flatMap(r => r.outlet_ids);
    const weekCheckedCount = weekOutletIds.filter(id => weekCheckins.has(id)).length;
    const weekTotal = weekOutletIds.length;
    const weekPct = weekTotal > 0 ? Math.round((weekCheckedCount / weekTotal) * 100) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">🗺️ Tuyến bán hàng</h1>
                    <p className="text-sm text-slate-500 mt-1">{routes.length} tuyến • {totalOutlets} điểm bán</p>
                </div>
                <button onClick={openNewForm} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> Tạo tuyến
                </button>
            </div>

            {/* ========== STATS CARDS ========== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">Hôm nay</span>
                        <span className="text-xs font-bold text-teal-600">{todayPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                        <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${todayPct}%` }} />
                    </div>
                    <p className="text-lg font-bold text-slate-900">{todayCheckedCount}<span className="text-sm text-slate-400 font-normal">/{todayTotal}</span></p>
                    <p className="text-xs text-slate-500">điểm đã ghé</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">Tuần này</span>
                        <span className="text-xs font-bold text-blue-600">{weekPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${weekPct}%` }} />
                    </div>
                    <p className="text-lg font-bold text-slate-900">{weekCheckedCount}<span className="text-sm text-slate-400 font-normal">/{weekTotal}</span></p>
                    <p className="text-xs text-slate-500">điểm đã ghé</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-2xl font-bold text-slate-900">{todayRoutes.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Tuyến hôm nay</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-2xl font-bold text-slate-900">{routes.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Tổng tuyến</p>
                </div>
            </div>

            {/* Today highlight */}
            <div className="flex gap-1">
                {DAY_LABELS.map((label, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${i === todayDow ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {label}
                    </div>
                ))}
            </div>

            {/* ========== ROUTES LIST ========== */}
            {routes.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 font-medium">Chưa có tuyến nào</p>
                    <p className="text-sm text-slate-400 mt-1">Nhấn "Tạo tuyến" để bắt đầu phân tuyến</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {routes.map(route => {
                        const isToday = route.day_of_week.includes(todayDow);
                        const isExpanded = expandedRoute === route.id;
                        const checkedCount = route.outlet_ids.filter(id => todayCheckins.has(id)).length;
                        const routePct = route.outlet_ids.length > 0 ? Math.round((checkedCount / route.outlet_ids.length) * 100) : 0;
                        const isActive = activeRouteId === route.id;

                        return (
                            <div key={route.id} className={`bg-white rounded-xl border transition-all ${isActive ? 'border-teal-400 ring-2 ring-teal-100 shadow-md' : isToday ? 'border-teal-200 shadow-sm' : 'border-slate-200'}`}>
                                {/* Route Header */}
                                <div className="flex items-center justify-between p-4">
                                    <button
                                        onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                                        className="flex items-center gap-3 flex-1 text-left"
                                    >
                                        <div className={`p-2 rounded-lg ${isActive ? 'bg-teal-100' : isToday ? 'bg-teal-50' : 'bg-slate-50'}`}>
                                            {isActive ? <Navigation className="w-4 h-4 text-teal-600 animate-pulse" /> : <MapPin className={`w-4 h-4 ${isToday ? 'text-teal-600' : 'text-slate-400'}`} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-sm text-slate-800 truncate">{route.name}</p>
                                                {isToday && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">Hôm nay</span>}
                                                {isActive && <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse shrink-0">Đang đi tuyến</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {route.district} • {route.day_of_week.map(d => DAY_LABELS[d]).join(", ")} • {route.outlet_ids.length} điểm bán
                                            </p>
                                            {/* Mini progress bar */}
                                            {isToday && route.outlet_ids.length > 0 && (
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <div className="flex-1 max-w-[120px] bg-slate-100 rounded-full h-1.5">
                                                        <div className={`h-1.5 rounded-full transition-all ${routePct === 100 ? 'bg-green-500' : 'bg-teal-500'}`} style={{ width: `${routePct}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-medium text-slate-500">{checkedCount}/{route.outlet_ids.length}</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 ml-3">
                                        {isToday && !isActive && (
                                            <button
                                                onClick={() => { setActiveRouteId(route.id); setExpandedRoute(route.id); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors"
                                            >
                                                <Play className="w-3.5 h-3.5" /> Bắt đầu
                                            </button>
                                        )}
                                        {isActive && (
                                            <button
                                                onClick={() => setActiveRouteId(null)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" /> Kết thúc
                                            </button>
                                        )}
                                        <button onClick={() => openEditForm(route)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa tuyến">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteRoute(route.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa tuyến">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                </div>

                                {/* Expanded: Outlet List with DnD */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                                        {route.outlet_ids.length === 0 ? (
                                            <p className="text-sm text-slate-400 text-center py-3">Chưa có điểm bán trong tuyến. Nhấn ✏️ để thêm.</p>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {route.outlet_ids.map((outletId, idx) => {
                                                    const isChecked = todayCheckins.has(outletId);
                                                    const isDragging = dragIdx === idx;
                                                    const isDragOver = dragOverIdx === idx;
                                                    const isNextToVisit = isActive && !isChecked &&
                                                        !route.outlet_ids.slice(0, idx).some(prevId => !todayCheckins.has(prevId));

                                                    return (
                                                        <div
                                                            key={outletId}
                                                            draggable
                                                            onDragStart={() => setDragIdx(idx)}
                                                            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                                                            onDragEnd={() => handleDragEnd(route.id)}
                                                            className={`flex items-center justify-between p-3 rounded-lg text-sm transition-all cursor-move
                                                                ${isDragging ? 'opacity-40 scale-95' : ''}
                                                                ${isDragOver && dragIdx !== null ? 'ring-2 ring-teal-300 bg-teal-50/50' : ''}
                                                                ${isNextToVisit ? 'bg-teal-50 border-2 border-teal-300 shadow-sm' :
                                                                    isChecked ? 'bg-green-50 border border-green-100' :
                                                                        'bg-slate-50 border border-slate-100'}
                                                            `}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <GripVertical className="w-4 h-4 text-slate-300 shrink-0 cursor-grab active:cursor-grabbing" />
                                                                <span className="text-xs text-slate-400 w-5 shrink-0">{idx + 1}.</span>
                                                                {isChecked ? (
                                                                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                                ) : isNextToVisit ? (
                                                                    <Navigation className="w-4 h-4 text-teal-600 shrink-0" />
                                                                ) : (
                                                                    <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                                                                )}
                                                                <div>
                                                                    <span className={`font-medium ${isChecked ? 'text-green-700' : isNextToVisit ? 'text-teal-800' : 'text-slate-700'}`}>
                                                                        {getOutletName(outletId)}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400 ml-2">{getOutletDistrict(outletId)}</span>
                                                                    {getOutletType(outletId) && (
                                                                        <span className="text-[10px] text-slate-400 ml-1.5 px-1.5 py-0.5 bg-slate-100 rounded">{getOutletType(outletId)}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isChecked && <span className="text-xs text-green-600 font-medium">✓ Đã ghé</span>}
                                                                {isNextToVisit && (
                                                                    <button
                                                                        onClick={() => router.push(`/sales-gt/checkin?outletId=${outletId}`)}
                                                                        className="flex items-center gap-1 px-2.5 py-1 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700 transition-colors"
                                                                    >
                                                                        <MapPin className="w-3 h-3" /> Check-in
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ========== ADD/EDIT ROUTE MODAL ========== */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingRoute ? '✏️ Sửa tuyến' : '🗺️ Tạo tuyến mới'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditingRoute(null); }} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveRoute} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên tuyến *</label>
                                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                    placeholder="VD: Tuyến Hoàn Kiếm T2-T4"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quận/Huyện *</label>
                                <select required value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                                    <option value="">Chọn...</option>
                                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Ngày trong tuần *</label>
                                <div className="flex gap-1.5">
                                    {DAY_LABELS.map((label, i) => (
                                        <button key={i} type="button" onClick={() => toggleDay(i)}
                                            className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${form.day_of_week.includes(i) ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Điểm bán trong tuyến ({form.outlet_ids.length} đã chọn)</label>
                                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                                    {outlets.filter(o => !form.district || o.district === form.district).map(outlet => (
                                        <label key={outlet.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer">
                                            <input type="checkbox" checked={form.outlet_ids.includes(outlet.id)}
                                                onChange={() => toggleOutlet(outlet.id)}
                                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-slate-700">{outlet.name}</span>
                                                <span className="text-xs text-slate-400 ml-2">{OUTLET_TYPE_LABELS[outlet.outlet_type] || outlet.outlet_type}</span>
                                            </div>
                                        </label>
                                    ))}
                                    {outlets.filter(o => !form.district || o.district === form.district).length === 0 && (
                                        <p className="text-sm text-slate-400 p-3 text-center">Chưa có điểm bán ở quận này</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button type="button" onClick={() => { setShowForm(false); setEditingRoute(null); }}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                                <button type="submit" disabled={saving || form.day_of_week.length === 0}
                                    className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium transition-colors">
                                    {saving ? "Đang lưu..." : editingRoute ? "Lưu thay đổi" : "Tạo tuyến"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
