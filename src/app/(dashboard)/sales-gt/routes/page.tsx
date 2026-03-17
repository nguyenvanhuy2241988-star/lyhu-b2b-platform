"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { MapPin, Plus, CheckCircle, Clock, ChevronDown, ChevronUp, X } from "lucide-react";

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
};

export default function RoutesPage() {
    const supabase = createClient();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [todayCheckins, setTodayCheckins] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form
    const [form, setForm] = useState({
        name: "",
        district: "",
        day_of_week: [] as number[],
        frequency: "F4",
        outlet_ids: [] as string[],
    });

    const todayDow = new Date().getDay();

    const loadData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: routeData }, { data: outletData }, { data: checkinData }] = await Promise.all([
            supabase.from('gt_routes').select('*').eq('assigned_to', user.id).eq('status', 'active').order('name'),
            supabase.from('gt_outlets').select('id, name, district, outlet_type').eq('assigned_to', user.id).eq('status', 'active').order('name'),
            supabase.from('gt_checkins').select('outlet_id').eq('user_id', user.id).gte('check_in_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        ]);

        setRoutes(routeData || []);
        setOutlets(outletData || []);
        setTodayCheckins(new Set((checkinData || []).map((c: any) => c.outlet_id)));
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

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

    async function handleAddRoute(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('gt_routes').insert({
            ...form,
            assigned_to: user.id,
        });

        if (!error) {
            setShowAddForm(false);
            setForm({ name: "", district: "", day_of_week: [], frequency: "F4", outlet_ids: [] });
            loadData();
        }
        setSaving(false);
    }

    function getOutletName(id: string) {
        return outlets.find(o => o.id === id)?.name || "Không rõ";
    }

    function getOutletDistrict(id: string) {
        return outlets.find(o => o.id === id)?.district || "";
    }

    if (loading) {
        return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-white h-20 rounded-xl border animate-pulse" />)}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">🗺️ Tuyến bán hàng</h1>
                    <p className="text-sm text-slate-500 mt-1">{routes.length} tuyến</p>
                </div>
                <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">
                    <Plus className="w-4 h-4" /> Tạo tuyến
                </button>
            </div>

            {/* Today highlight */}
            <div className="flex gap-1">
                {DAY_LABELS.map((label, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${i === todayDow ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {label}
                    </div>
                ))}
            </div>

            {/* Routes list */}
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

                        return (
                            <div key={route.id} className={`bg-white rounded-xl border transition-all ${isToday ? 'border-teal-200 shadow-sm' : 'border-slate-200'}`}>
                                <button
                                    onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                                    className="w-full flex items-center justify-between p-4 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isToday ? 'bg-teal-50' : 'bg-slate-50'}`}>
                                            <MapPin className={`w-4 h-4 ${isToday ? 'text-teal-600' : 'text-slate-400'}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm text-slate-800">{route.name}</p>
                                                {isToday && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">Hôm nay</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {route.district} • {route.day_of_week.map(d => DAY_LABELS[d]).join(", ")} • {route.outlet_ids.length} điểm bán
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isToday && (
                                            <span className="text-xs font-medium text-slate-600">
                                                {checkedCount}/{route.outlet_ids.length}
                                            </span>
                                        )}
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                                        {route.outlet_ids.length === 0 ? (
                                            <p className="text-sm text-slate-400 text-center py-3">Chưa có điểm bán trong tuyến</p>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {route.outlet_ids.map((outletId, idx) => {
                                                    const isChecked = todayCheckins.has(outletId);
                                                    return (
                                                        <div key={outletId} className={`flex items-center justify-between p-2.5 rounded-lg text-sm ${isChecked ? 'bg-green-50' : 'bg-slate-50'}`}>
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="text-xs text-slate-400 w-4">{idx + 1}.</span>
                                                                {isChecked ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-slate-300" />}
                                                                <div>
                                                                    <span className="font-medium text-slate-700">{getOutletName(outletId)}</span>
                                                                    <span className="text-xs text-slate-400 ml-2">{getOutletDistrict(outletId)}</span>
                                                                </div>
                                                            </div>
                                                            {isChecked && <span className="text-xs text-green-600">✓</span>}
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

            {/* Add Route Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900">🗺️ Tạo tuyến mới</h3>
                            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddRoute} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên tuyến *</label>
                                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="VD: Tuyến Hoàn Kiếm T2-T4" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quận/Huyện *</label>
                                <select required value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
                                    <option value="">Chọn...</option>
                                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Ngày trong tuần *</label>
                                <div className="flex gap-1.5">
                                    {DAY_LABELS.map((label, i) => (
                                        <button
                                            key={i} type="button"
                                            onClick={() => toggleDay(i)}
                                            className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${form.day_of_week.includes(i) ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
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
                                            <input
                                                type="checkbox"
                                                checked={form.outlet_ids.includes(outlet.id)}
                                                onChange={() => toggleOutlet(outlet.id)}
                                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-slate-700">{outlet.name}</span>
                                                <span className="text-xs text-slate-400 ml-2">{OUTLET_TYPE_LABELS[outlet.outlet_type]}</span>
                                            </div>
                                        </label>
                                    ))}
                                    {outlets.filter(o => !form.district || o.district === form.district).length === 0 && (
                                        <p className="text-sm text-slate-400 p-3 text-center">Chưa có điểm bán ở quận này</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                                <button type="submit" disabled={saving || form.day_of_week.length === 0} className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium">
                                    {saving ? "Đang lưu..." : "Tạo tuyến"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
