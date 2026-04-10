"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
    Store, Search, Filter, MapPin, Globe, Phone, Mail, ChevronDown, ChevronUp,
    Building2, ShoppingBag, Leaf, Eye, TrendingUp, Landmark, Plus, Pencil, Trash2,
    CheckCircle2, Clock, XCircle, ExternalLink, StickyNote, X, Loader2, Save
} from "lucide-react";

// ── Types ──
interface RetailChain {
    id: string;
    name: string;
    logo_url: string | null;
    category: string;
    status: string;
    total_outlets: number;
    regions: string[];
    provinces: string[];
    website: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

type ChainFormData = Omit<RetailChain, 'id' | 'created_at' | 'updated_at' | 'logo_url'>;

const EMPTY_FORM: ChainFormData = {
    name: "", category: "supermarket", status: "not_entered", total_outlets: 0,
    regions: [], provinces: [], website: null, contact_name: null,
    contact_phone: null, contact_email: null, notes: null,
};

// ── Constants ──
const CATEGORIES: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    hypermarket: { label: "Đại siêu thị", icon: Building2, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    supermarket: { label: "Siêu thị", icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    minimart: { label: "Cửa hàng tiện lợi", icon: Store, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
    local: { label: "Chuỗi địa phương", icon: Landmark, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
    specialty: { label: "Đặc biệt / Cao cấp", icon: Leaf, color: "text-teal-600", bg: "bg-teal-50 border-teal-200" },
};

const STATUSES: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    entered: { label: "Đã vào", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    approaching: { label: "Đang tiếp cận", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 text-amber-700 border-amber-200" },
    not_entered: { label: "Chưa vào", icon: XCircle, color: "text-slate-400", bg: "bg-slate-50 text-slate-500 border-slate-200" },
};

const REGIONS: Record<string, string> = {
    north: "Miền Bắc",
    central: "Miền Trung",
    south: "Miền Nam",
};

// ── Form Modal Component ──
function ChainFormModal({ chain, onSave, onClose, saving }: {
    chain: ChainFormData & { id?: string };
    onSave: (data: ChainFormData & { id?: string }) => void;
    onClose: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState<ChainFormData & { id?: string }>(chain);
    const [provincesText, setProvincesText] = useState((chain.provinces || []).join(", "));
    const isEdit = !!chain.id;

    const handleSave = () => {
        if (!form.name.trim()) return alert("Vui lòng nhập tên chuỗi");
        onSave({
            ...form,
            provinces: provincesText.split(",").map(p => p.trim()).filter(Boolean),
        });
    };

    const toggleRegion = (r: string) => {
        setForm(prev => ({
            ...prev,
            regions: prev.regions.includes(r) ? prev.regions.filter(x => x !== r) : [...prev.regions, r],
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-lg font-bold text-slate-900">
                        {isEdit ? "Chỉnh sửa chuỗi" : "Thêm chuỗi mới"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Tên chuỗi */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tên chuỗi *</label>
                        <input
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="VD: WinMart+ (Masan)"
                        />
                    </div>

                    {/* Category + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Loại hình</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200">
                                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Trạng thái</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200">
                                {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Outlets + Website */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Số điểm bán</label>
                            <input type="number" min="0"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                                value={form.total_outlets} onChange={e => setForm({ ...form, total_outlets: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Website</label>
                            <input
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                                value={form.website || ""} onChange={e => setForm({ ...form, website: e.target.value || null })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Regions */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Khu vực</label>
                        <div className="flex gap-3">
                            {Object.entries(REGIONS).map(([k, v]) => (
                                <button key={k} type="button" onClick={() => toggleRegion(k)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${form.regions.includes(k)
                                            ? 'bg-teal-50 text-teal-700 border-teal-300 ring-1 ring-teal-200'
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}>
                                    <MapPin className="w-3.5 h-3.5 inline mr-1" />{v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Provinces */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tỉnh/TP (phân cách bằng dấu phẩy)</label>
                        <input
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                            value={provincesText} onChange={e => setProvincesText(e.target.value)}
                            placeholder="Hà Nội, TP.HCM, Đà Nẵng..."
                        />
                    </div>

                    {/* Contact Info */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Liên hệ</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                                value={form.contact_name || ""} onChange={e => setForm({ ...form, contact_name: e.target.value || null })}
                                placeholder="Tên liên hệ"
                            />
                            <input
                                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                                value={form.contact_phone || ""} onChange={e => setForm({ ...form, contact_phone: e.target.value || null })}
                                placeholder="Số điện thoại"
                            />
                            <input
                                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                                value={form.contact_email || ""} onChange={e => setForm({ ...form, contact_email: e.target.value || null })}
                                placeholder="Email"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ghi chú</label>
                        <textarea rows={3}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200 resize-none"
                            value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value || null })}
                            placeholder="Thông tin bổ sung về chuỗi..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200">
                        Hủy
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEdit ? "Lưu thay đổi" : "Thêm chuỗi"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──
export default function RetailChainsPage() {
    const [chains, setChains] = useState<RetailChain[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterRegion, setFilterRegion] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [detailChain, setDetailChain] = useState<RetailChain | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // CRUD state
    const [formChain, setFormChain] = useState<(ChainFormData & { id?: string }) | null>(null);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState<string>("");
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const isAdmin = userRole === "admin";

    // ── Load user role ──
    useEffect(() => {
        (async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
                    setUserRole(data?.role || "");
                }
            } catch { }
        })();
    }, []);

    // ── Load data ──
    const loadChains = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("retail_chains")
                .select("*")
                .order("category")
                .order("total_outlets", { ascending: false });
            if (error) throw error;
            setChains(data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadChains(); }, [loadChains]);

    // ── Save (Create / Update) ──
    const handleSave = async (data: ChainFormData & { id?: string }) => {
        setSaving(true);
        try {
            const supabase = createClient();
            const payload = {
                name: data.name,
                category: data.category,
                status: data.status,
                total_outlets: data.total_outlets,
                regions: data.regions,
                provinces: data.provinces,
                website: data.website,
                contact_name: data.contact_name,
                contact_phone: data.contact_phone,
                contact_email: data.contact_email,
                notes: data.notes,
                updated_at: new Date().toISOString(),
            };

            if (data.id) {
                const { error } = await supabase.from("retail_chains").update(payload).eq("id", data.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("retail_chains").insert(payload);
                if (error) throw error;
            }
            setFormChain(null);
            await loadChains();
        } catch (err: any) {
            alert("Lỗi: " + (err?.message || "Không thể lưu. Chỉ Admin mới có quyền chỉnh sửa."));
        } finally { setSaving(false); }
    };

    // ── Delete ──
    const handleDelete = async (id: string) => {
        try {
            const supabase = createClient();
            const { error } = await supabase.from("retail_chains").delete().eq("id", id);
            if (error) throw error;
            setDeleteConfirm(null);
            setDetailChain(null);
            await loadChains();
        } catch (err: any) {
            alert("Lỗi: " + (err?.message || "Không thể xóa. Chỉ Admin mới có quyền."));
            setDeleteConfirm(null);
        }
    };

    // ── Filter ──
    const filtered = chains.filter(c => {
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterCategory && c.category !== filterCategory) return false;
        if (filterStatus && c.status !== filterStatus) return false;
        if (filterRegion && !c.regions?.includes(filterRegion)) return false;
        return true;
    });

    // ── Stats ──
    const totalChains = chains.length;
    const totalOutlets = chains.reduce((s, c) => s + (c.total_outlets || 0), 0);
    const entered = chains.filter(c => c.status === "entered").length;
    const approaching = chains.filter(c => c.status === "approaching").length;
    const notEntered = chains.filter(c => c.status === "not_entered").length;
    const coveragePercent = totalChains > 0 ? Math.round((entered / totalChains) * 100) : 0;

    // ── Group by category ──
    const grouped: Record<string, RetailChain[]> = {};
    filtered.forEach(c => {
        if (!grouped[c.category]) grouped[c.category] = [];
        grouped[c.category].push(c);
    });

    const resetFilters = () => { setSearch(""); setFilterCategory(""); setFilterStatus(""); setFilterRegion(""); };
    const hasFilters = !!(search || filterCategory || filterStatus || filterRegion);

    const openEdit = (chain: RetailChain) => {
        setFormChain({
            id: chain.id, name: chain.name, category: chain.category, status: chain.status,
            total_outlets: chain.total_outlets, regions: chain.regions || [], provinces: chain.provinces || [],
            website: chain.website, contact_name: chain.contact_name, contact_phone: chain.contact_phone,
            contact_email: chain.contact_email, notes: chain.notes,
        });
        setDetailChain(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Store className="w-7 h-7 text-teal-600" />
                        Chuỗi bán lẻ FMCG Toàn quốc
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Hệ thống chuỗi bán lẻ hàng tiêu dùng nhanh tại Việt Nam</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setFormChain({ ...EMPTY_FORM })}
                        className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-sm transition-colors">
                        <Plus className="w-4 h-4" /> Thêm chuỗi
                    </button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-2xl font-bold text-slate-900">{totalChains}</div>
                    <div className="text-xs text-slate-500 mt-1">Tổng chuỗi</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-2xl font-bold text-slate-900">{totalOutlets.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-1">Tổng điểm bán</div>
                </div>
                <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/50">
                    <div className="text-2xl font-bold text-emerald-600">{entered}</div>
                    <div className="text-xs text-emerald-600 mt-1 font-medium">✅ Đã vào</div>
                </div>
                <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm bg-amber-50/50">
                    <div className="text-2xl font-bold text-amber-600">{approaching}</div>
                    <div className="text-xs text-amber-600 mt-1 font-medium">⏳ Đang tiếp cận</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-2xl font-bold text-slate-400">{notEntered}</div>
                    <div className="text-xs text-slate-500 mt-1">Chưa vào</div>
                </div>
                <div className="bg-white rounded-xl border border-teal-200 p-4 shadow-sm bg-teal-50/50">
                    <div className="text-2xl font-bold text-teal-600">{coveragePercent}%</div>
                    <div className="text-xs text-teal-600 mt-1 font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Phủ sóng
                    </div>
                </div>
            </div>

            {/* Coverage progress bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Tỉ lệ phủ sóng chuỗi</span>
                    <span className="text-sm font-bold text-teal-600">{entered}/{totalChains} chuỗi</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${coveragePercent}%` }} />
                        {approaching > 0 && (
                            <div className="bg-amber-400 h-full" style={{ width: `${Math.round((approaching / totalChains) * 100)}%` }} />
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Đã vào</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Đang tiếp cận</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200 inline-block" /> Chưa vào</span>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                        placeholder="Tìm chuỗi siêu thị..."
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border ${showFilters ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                    <Filter className="w-4 h-4" /> Bộ lọc
                    {hasFilters && <span className="w-2 h-2 rounded-full bg-red-500" />}
                </button>
            </div>

            {showFilters && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Loại hình</label>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-200">
                            <option value="">Tất cả</option>
                            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Trạng thái</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-200">
                            <option value="">Tất cả</option>
                            {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Khu vực</label>
                        <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-200">
                            <option value="">Tất cả</option>
                            {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    {hasFilters && (
                        <div className="sm:col-span-3 flex justify-end">
                            <button onClick={resetFilters} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium border border-red-200">
                                Xóa bộ lọc
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Chain list grouped by category */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500 font-medium">Không tìm thấy chuỗi nào</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([catKey, catChains]) => {
                        const cat = CATEGORIES[catKey] || { label: catKey, icon: Store, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" };
                        const CatIcon = cat.icon;
                        const isExpanded = expandedCategory === null || expandedCategory === catKey;
                        const catOutlets = catChains.reduce((s, c) => s + (c.total_outlets || 0), 0);
                        const catEntered = catChains.filter(c => c.status === "entered").length;

                        return (
                            <div key={catKey} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                {/* Category header */}
                                <button
                                    onClick={() => setExpandedCategory(expandedCategory === catKey ? null : catKey)}
                                    className={`w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg ${cat.bg} border flex items-center justify-center`}>
                                            <CatIcon className={`w-5 h-5 ${cat.color}`} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-sm font-bold text-slate-800">{cat.label}</h3>
                                            <p className="text-[11px] text-slate-400">
                                                {catChains.length} chuỗi · {catOutlets.toLocaleString()} điểm bán · {catEntered} đã vào
                                            </p>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                </button>

                                {/* Chain rows */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50/50 text-xs text-slate-500">
                                                    <th className="px-5 py-2.5 text-left font-medium">Tên chuỗi</th>
                                                    <th className="px-3 py-2.5 text-center font-medium">Trạng thái</th>
                                                    <th className="px-3 py-2.5 text-right font-medium">Điểm bán</th>
                                                    <th className="px-3 py-2.5 text-left font-medium">Khu vực</th>
                                                    <th className="px-3 py-2.5 text-left font-medium hidden lg:table-cell">Tỉnh/TP</th>
                                                    <th className="px-3 py-2.5 text-center font-medium w-24"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {catChains.map(chain => {
                                                    const st = STATUSES[chain.status] || STATUSES.not_entered;
                                                    const StIcon = st.icon;
                                                    return (
                                                        <tr key={chain.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-slate-800">{chain.name}</span>
                                                                    {chain.website && (
                                                                        <a href={chain.website} target="_blank" rel="noopener noreferrer"
                                                                            className="text-slate-300 hover:text-teal-500 transition-colors">
                                                                            <Globe className="w-3.5 h-3.5" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 text-center">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.bg}`}>
                                                                    <StIcon className="w-3 h-3" /> {st.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3 text-right">
                                                                <span className="font-bold text-slate-700">{(chain.total_outlets || 0).toLocaleString()}</span>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    {(chain.regions || []).map(r => (
                                                                        <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                                                            {REGIONS[r] || r}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 hidden lg:table-cell">
                                                                <p className="text-xs text-slate-500 max-w-[200px] truncate" title={(chain.provinces || []).join(", ")}>
                                                                    {(chain.provinces || []).slice(0, 3).join(", ")}
                                                                    {(chain.provinces || []).length > 3 && ` +${chain.provinces.length - 3}`}
                                                                </p>
                                                            </td>
                                                            <td className="px-3 py-3 text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button
                                                                        onClick={() => setDetailChain(chain)}
                                                                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                                        title="Xem chi tiết"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                    {isAdmin && (
                                                                        <button
                                                                            onClick={() => openEdit(chain)}
                                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                            title="Chỉnh sửa"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            {detailChain && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDetailChain(null)}>
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{detailChain.name}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">{CATEGORIES[detailChain.category]?.label || detailChain.category}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {isAdmin && (
                                    <>
                                        <button onClick={() => openEdit(detailChain)}
                                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Chỉnh sửa">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeleteConfirm(detailChain.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setDetailChain(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            {/* Status badge */}
                            {(() => {
                                const st = STATUSES[detailChain.status] || STATUSES.not_entered;
                                const StIcon = st.icon;
                                return (
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${st.bg}`}>
                                        <StIcon className="w-4 h-4" /> {st.label}
                                    </div>
                                );
                            })()}

                            {/* Stats row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-2xl font-bold text-slate-800">{(detailChain.total_outlets || 0).toLocaleString()}</div>
                                    <div className="text-xs text-slate-500 mt-1">Điểm bán toàn quốc</div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-2xl font-bold text-slate-800">{(detailChain.provinces || []).length}</div>
                                    <div className="text-xs text-slate-500 mt-1">Tỉnh/Thành phố</div>
                                </div>
                            </div>

                            {/* Regions */}
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Khu vực hoạt động</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(detailChain.regions || []).map(r => (
                                        <span key={r} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
                                            <MapPin className="w-3 h-3" /> {REGIONS[r] || r}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Provinces */}
                            {(detailChain.provinces || []).length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tỉnh/Thành phố có mặt</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {detailChain.provinces.map(p => (
                                            <span key={p} className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contact Info */}
                            {(detailChain.contact_name || detailChain.contact_phone || detailChain.contact_email) && (
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Liên hệ</h4>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                                        {detailChain.contact_name && (
                                            <p className="text-sm text-slate-800 font-medium">{detailChain.contact_name}</p>
                                        )}
                                        {detailChain.contact_phone && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                <a href={`tel:${detailChain.contact_phone}`} className="hover:text-teal-600">{detailChain.contact_phone}</a>
                                            </div>
                                        )}
                                        {detailChain.contact_email && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                <a href={`mailto:${detailChain.contact_email}`} className="hover:text-teal-600">{detailChain.contact_email}</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Website */}
                            {detailChain.website && (
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Website</h4>
                                    <a href={detailChain.website} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium">
                                        <ExternalLink className="w-3.5 h-3.5" /> {detailChain.website}
                                    </a>
                                </div>
                            )}

                            {/* Notes */}
                            {detailChain.notes && (
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ghi chú</h4>
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
                                        <StickyNote className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="whitespace-pre-wrap">{detailChain.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Form Modal (Add/Edit) */}
            {formChain && (
                <ChainFormModal chain={formChain} onSave={handleSave} onClose={() => setFormChain(null)} saving={saving} />
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Xác nhận xóa</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            Bạn có chắc muốn xóa chuỗi <strong>{chains.find(c => c.id === deleteConfirm)?.name}</strong>? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                                Hủy
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                                Xóa chuỗi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
