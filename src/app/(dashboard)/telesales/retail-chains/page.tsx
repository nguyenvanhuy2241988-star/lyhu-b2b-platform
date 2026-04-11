"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
    Store, Search, Filter, MapPin, Globe, Phone, Mail, ChevronDown, ChevronUp,
    Building2, ShoppingBag, Leaf, Eye, TrendingUp, Landmark, Plus, Pencil, Trash2,
    CheckCircle2, Clock, XCircle, ExternalLink, StickyNote, X, Loader2, Save,
    Settings2, Palette, GripVertical, BarChart3
} from "lucide-react";

// ── Types ──
interface RetailChain {
    id: string;
    name: string;
    logo_url: string | null;
    category: string;
    status: string;
    total_outlets: number;
    entered_outlets: number;
    entered_brands?: string[];
    regions: string[];
    provinces: string[];
    website: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    notes: string | null;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
}

interface Category {
    id: string;
    key: string;
    label: string;
    icon_name: string;
    color: string;
    bg: string;
    sort_order: number;
}

type ChainFormData = Omit<RetailChain, 'id' | 'created_at' | 'updated_at' | 'logo_url'>;

const EMPTY_FORM: ChainFormData = {
    name: "", category: "supermarket", status: "not_entered", total_outlets: 0, entered_outlets: 0,
    entered_brands: [],
    regions: [], provinces: [], website: null, contact_name: null,
    contact_phone: null, contact_email: null, notes: null,
};

// ── Icon map ──
const ICON_MAP: Record<string, any> = {
    Store, Building2, ShoppingBag, Leaf, Landmark, MapPin, Globe, BarChart3,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

// ── Constants ──
const STATUSES: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    entered: { label: "Đã vào", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    approaching: { label: "Đang tiếp cận", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 text-amber-700 border-amber-200" },
    not_entered: { label: "Chưa vào", icon: XCircle, color: "text-slate-400", bg: "bg-slate-50 text-slate-500 border-slate-200" },
};

const REGIONS: Record<string, string> = { north: "Miền Bắc", central: "Miền Trung", south: "Miền Nam" };

const COLOR_PRESETS = [
    { color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Xanh dương" },
    { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Xanh lá" },
    { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", label: "Cam" },
    { color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200", label: "Tím" },
    { color: "text-teal-600", bg: "bg-teal-50 border-teal-200", label: "Teal" },
    { color: "text-rose-600", bg: "bg-rose-50 border-rose-200", label: "Hồng" },
    { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Vàng" },
    { color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-200", label: "Cyan" },
];

// ── Category Form Modal ──
function CategoryFormModal({ category, onSave, onClose, saving }: {
    category: Partial<Category> & { key: string; label: string };
    onSave: (data: any) => void;
    onClose: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState(category);
    const isEdit = !!category.id;
    const CatIcon = ICON_MAP[form.icon_name || 'Store'] || Store;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Sửa loại hình" : "Thêm loại hình"}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Tên loại hình *</label>
                        <input className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                            value={form.label} onChange={e => setForm({ ...form, label: e.target.value, key: form.id ? form.key : e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_') })}
                            placeholder="VD: Đại siêu thị"
                        />
                    </div>
                    {!isEdit && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Key (mã)</label>
                            <input className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200 font-mono"
                                value={form.key} onChange={e => setForm({ ...form, key: e.target.value })}
                                placeholder="hypermarket"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Icon</label>
                        <div className="flex gap-2 flex-wrap">
                            {ICON_OPTIONS.map(name => {
                                const Icon = ICON_MAP[name];
                                return (
                                    <button key={name} type="button" onClick={() => setForm({ ...form, icon_name: name })}
                                        className={`p-2.5 rounded-lg border transition-all ${form.icon_name === name ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-200' : 'border-slate-200 hover:bg-slate-50'}`}
                                        title={name}>
                                        <Icon className="w-4 h-4" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Màu sắc</label>
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_PRESETS.map((preset, i) => (
                                <button key={i} type="button" onClick={() => setForm({ ...form, color: preset.color, bg: preset.bg })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${form.color === preset.color ? 'ring-2 ring-offset-1 ring-teal-400' : ''} ${preset.bg} ${preset.color}`}>
                                    <CatIcon className="w-3 h-3" />{preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Thứ tự</label>
                        <input type="number" min="0" className="w-24 px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                            value={form.sort_order || 0} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                </div>
                <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200">Hủy</button>
                    <button onClick={() => { if (!form.label.trim() || !form.key.trim()) return alert("Vui lòng nhập tên và key"); onSave(form); }} disabled={saving}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 flex items-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEdit ? "Lưu" : "Thêm"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Chain Form Modal ──
function ChainFormModal({ chain, categories, onSave, onClose, saving }: {
    chain: ChainFormData & { id?: string };
    categories: Category[];
    onSave: (data: ChainFormData & { id?: string }) => void;
    onClose: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState<ChainFormData & { id?: string }>(chain);
    const [brandsText, setBrandsText] = useState((chain.entered_brands || []).join(", "));
    const [provincesText, setProvincesText] = useState((chain.provinces || []).join(", "));
    const isEdit = !!chain.id;

    const handleSave = () => {
        if (!form.name.trim()) return alert("Vui lòng nhập tên chuỗi");
        onSave({ 
            ...form, 
            provinces: provincesText.split(",").map(p => p.trim()).filter(Boolean),
            entered_brands: brandsText.split(",").map(b => b.trim()).filter(Boolean)
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
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Chỉnh sửa chuỗi" : "Thêm chuỗi mới"}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="px-6 py-5 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tên chuỗi *</label>
                        <input className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: WinMart+ (Masan)" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Loại hình</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200">
                                {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
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
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tổng điểm bán</label>
                            <input type="number" min="0" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                                value={form.total_outlets} onChange={e => setForm({ ...form, total_outlets: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Đã vào (điểm)</label>
                            <input type="number" min="0" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                                value={form.entered_outlets} onChange={e => setForm({ ...form, entered_outlets: Math.min(parseInt(e.target.value) || 0, form.total_outlets) })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Website</label>
                            <input className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                                value={form.website || ""} onChange={e => setForm({ ...form, website: e.target.value || null })} placeholder="https://..." />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Khu vực</label>
                        <div className="flex gap-3">
                            {Object.entries(REGIONS).map(([k, v]) => (
                                <button key={k} type="button" onClick={() => toggleRegion(k)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${form.regions.includes(k) ? 'bg-teal-50 text-teal-700 border-teal-300 ring-1 ring-teal-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                                    <MapPin className="w-3.5 h-3.5 inline mr-1" />{v}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tỉnh/TP (phân cách bằng dấu phẩy)</label>
                        <input className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                            value={provincesText} onChange={e => setProvincesText(e.target.value)} placeholder="Hà Nội, TP.HCM, Đà Nẵng..." />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nhãn hàng đã vào (phân cách bằng dấu phẩy)</label>
                        <input className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                            value={brandsText} onChange={e => setBrandsText(e.target.value)} placeholder="VD: Trà Olong, Trà Vị đào..." />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Liên hệ</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                                value={form.contact_name || ""} onChange={e => setForm({ ...form, contact_name: e.target.value || null })} placeholder="Tên liên hệ" />
                            <input className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                                value={form.contact_phone || ""} onChange={e => setForm({ ...form, contact_phone: e.target.value || null })} placeholder="Số điện thoại" />
                            <input className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                                value={form.contact_email || ""} onChange={e => setForm({ ...form, contact_email: e.target.value || null })} placeholder="Email" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ghi chú</label>
                        <textarea rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200 resize-none"
                            value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value || null })} placeholder="Thông tin bổ sung..." />
                    </div>
                </div>
                <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200">Hủy</button>
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
    const [categories, setCategories] = useState<Category[]>([]);
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
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>("");
    const [userId, setUserId] = useState<string>("");

    // Category CRUD
    const [catForm, setCatForm] = useState<(Partial<Category> & { key: string; label: string }) | null>(null);
    const [showCatManager, setShowCatManager] = useState(false);
    const [catDeleteConfirm, setCatDeleteConfirm] = useState<string | null>(null);

    const isAdmin = userRole === "admin";

    const catMap = useMemo(() => {
        const map: Record<string, Category> = {};
        categories.forEach(c => { map[c.key] = c; });
        return map;
    }, [categories]);

    // ── Load user role ──
    useEffect(() => {
        (async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);
                    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
                    setUserRole(data?.role || "");
                }
            } catch { }
        })();
    }, []);

    // ── Load data ──
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const [chainsRes, catsRes] = await Promise.all([
                supabase.from("retail_chains").select("*").order("category").order("total_outlets", { ascending: false }),
                supabase.from("retail_chain_categories").select("*").order("sort_order"),
            ]);
            if (chainsRes.error) throw chainsRes.error;
            if (catsRes.error) throw catsRes.error;
            setChains(chainsRes.data || []);
            setCategories(catsRes.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Chain CRUD ──
    const handleSaveChain = async (data: ChainFormData & { id?: string }) => {
        setSaving(true);
        try {
            const supabase = createClient();
            const payload = {
                name: data.name, category: data.category, status: data.status,
                total_outlets: data.total_outlets, entered_outlets: data.entered_outlets,
                entered_brands: data.entered_brands,
                regions: data.regions, provinces: data.provinces, website: data.website,
                contact_name: data.contact_name, contact_phone: data.contact_phone,
                contact_email: data.contact_email, notes: data.notes,
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
            await loadData();
        } catch (err: any) {
            alert("Lỗi: " + (err?.message || "Không thể lưu. Chỉ Admin mới có quyền."));
        } finally { setSaving(false); }
    };

    const handleDeleteChain = async (id: string) => {
        try {
            const supabase = createClient();
            const { error } = await supabase.from("retail_chains").delete().eq("id", id);
            if (error) throw error;
            setDeleteConfirm(null); setDetailChain(null);
            await loadData();
        } catch (err: any) { alert("Lỗi: " + (err?.message || "Không thể xóa.")); setDeleteConfirm(null); }
    };

    // ── Category CRUD ──
    const handleSaveCat = async (data: any) => {
        setSaving(true);
        try {
            const supabase = createClient();
            const payload = { key: data.key, label: data.label, icon_name: data.icon_name || 'Store', color: data.color, bg: data.bg, sort_order: data.sort_order || 0 };
            if (data.id) {
                const { error } = await supabase.from("retail_chain_categories").update(payload).eq("id", data.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("retail_chain_categories").insert(payload);
                if (error) throw error;
            }
            setCatForm(null);
            await loadData();
        } catch (err: any) { alert("Lỗi: " + (err?.message || "Không thể lưu.")); } finally { setSaving(false); }
    };

    const handleDeleteCat = async (id: string) => {
        try {
            const supabase = createClient();
            const { error } = await supabase.from("retail_chain_categories").delete().eq("id", id);
            if (error) throw error;
            setCatDeleteConfirm(null);
            await loadData();
        } catch (err: any) { alert("Lỗi: " + (err?.message || "Không thể xóa.")); setCatDeleteConfirm(null); }
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
    const totalEntered = chains.reduce((s, c) => s + (c.entered_outlets || 0), 0);
    const entered = chains.filter(c => c.status === "entered").length;
    const approaching = chains.filter(c => c.status === "approaching").length;
    const notEntered = chains.filter(c => c.status === "not_entered").length;
    const coveragePercent = totalChains > 0 ? Math.round((entered / totalChains) * 100) : 0;
    const outletCoverage = totalOutlets > 0 ? Math.round((totalEntered / totalOutlets) * 100) : 0;

    // ── Group by category ──
    const categoryOrder = categories.map(c => c.key);
    const grouped: Record<string, RetailChain[]> = {};
    filtered.forEach(c => {
        if (!grouped[c.category]) grouped[c.category] = [];
        grouped[c.category].push(c);
    });
    const sortedGroups = categoryOrder.filter(k => grouped[k]).map(k => [k, grouped[k]] as [string, RetailChain[]]);
    // Add any ungrouped
    Object.keys(grouped).filter(k => !categoryOrder.includes(k)).forEach(k => sortedGroups.push([k, grouped[k]]));

    const resetFilters = () => { setSearch(""); setFilterCategory(""); setFilterStatus(""); setFilterRegion(""); };
    const hasFilters = !!(search || filterCategory || filterStatus || filterRegion);

    const openEdit = (chain: RetailChain) => {
        setFormChain({
            id: chain.id, name: chain.name, category: chain.category, status: chain.status,
            total_outlets: chain.total_outlets, entered_outlets: chain.entered_outlets || 0,
            entered_brands: chain.entered_brands || [],
            regions: chain.regions || [], provinces: chain.provinces || [],
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
                {(isAdmin || userRole === "telesales") && (
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <button onClick={() => setShowCatManager(!showCatManager)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${showCatManager ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                <Settings2 className="w-4 h-4" /> Loại hình
                            </button>
                        )}
                        <button onClick={() => setFormChain({ ...EMPTY_FORM, category: categories[0]?.key || 'supermarket' })}
                            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-sm transition-colors">
                            <Plus className="w-4 h-4" /> Thêm chuỗi
                        </button>
                    </div>
                )}
            </div>

            {/* Category Manager (Admin) */}
            {showCatManager && isAdmin && (
                <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2"><Palette className="w-4 h-4" /> Quản lý loại hình</h3>
                        <button onClick={() => setCatForm({ key: '', label: '', icon_name: 'Store', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', sort_order: categories.length + 1 })}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
                            <Plus className="w-3 h-3" /> Thêm
                        </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {categories.map(cat => {
                            const CatIcon = ICON_MAP[cat.icon_name] || Store;
                            const catChains = chains.filter(c => c.category === cat.key);
                            return (
                                <div key={cat.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg ${cat.bg} border flex items-center justify-center`}>
                                            <CatIcon className={`w-4 h-4 ${cat.color}`} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-slate-800">{cat.label}</span>
                                            <span className="text-[10px] text-slate-400 ml-2 font-mono">{cat.key}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{catChains.length} chuỗi</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCatForm(cat)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setCatDeleteConfirm(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-2xl font-bold text-slate-900">{totalChains}</div>
                    <div className="text-xs text-slate-500 mt-1">Tổng chuỗi</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-2xl font-bold text-slate-900">{totalOutlets.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-1">Tổng điểm bán</div>
                </div>
                <div className="bg-white rounded-xl border border-teal-200 p-4 shadow-sm bg-teal-50/50">
                    <div className="text-2xl font-bold text-teal-600">{totalEntered.toLocaleString()}</div>
                    <div className="text-xs text-teal-600 mt-1 font-medium">Điểm đã vào</div>
                </div>
                <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/50">
                    <div className="text-2xl font-bold text-emerald-600">{entered}</div>
                    <div className="text-xs text-emerald-600 mt-1 font-medium">✅ Chuỗi đã vào</div>
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
                    <div className="text-2xl font-bold text-teal-600">{outletCoverage}%</div>
                    <div className="text-xs text-teal-600 mt-1 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Phủ điểm bán</div>
                </div>
            </div>

            {/* Coverage bars */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-medium text-slate-600">Phủ sóng chuỗi</span>
                        <span className="text-xs font-bold text-teal-600">{entered}/{totalChains}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="h-full rounded-full flex">
                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${coveragePercent}%` }} />
                            {approaching > 0 && <div className="bg-amber-400 h-full" style={{ width: `${Math.round((approaching / totalChains) * 100)}%` }} />}
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-medium text-slate-600">Phủ sóng điểm bán</span>
                        <span className="text-xs font-bold text-teal-600">{totalEntered.toLocaleString()}/{totalOutlets.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${outletCoverage}%` }} />
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-200"
                        placeholder="Tìm chuỗi siêu thị..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border ${showFilters ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    <Filter className="w-4 h-4" /> Bộ lọc {hasFilters && <span className="w-2 h-2 rounded-full bg-red-500" />}
                </button>
            </div>

            {showFilters && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Loại hình</label>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg">
                            <option value="">Tất cả</option>
                            {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Trạng thái</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg">
                            <option value="">Tất cả</option>
                            {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Khu vực</label>
                        <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg">
                            <option value="">Tất cả</option>
                            {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    {hasFilters && (
                        <div className="sm:col-span-3 flex justify-end">
                            <button onClick={resetFilters} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium border border-red-200">Xóa bộ lọc</button>
                        </div>
                    )}
                </div>
            )}

            {/* Chain list grouped by category */}
            {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500 font-medium">Không tìm thấy chuỗi nào</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedGroups.map(([catKey, catChains]) => {
                        const cat = catMap[catKey];
                        const CatIcon = cat ? (ICON_MAP[cat.icon_name] || Store) : Store;
                        const catColor = cat?.color || "text-slate-600";
                        const catBg = cat?.bg || "bg-slate-50 border-slate-200";
                        const catLabel = cat?.label || catKey;
                        const isExpanded = expandedCategory === null || expandedCategory === catKey;

                        // Category stats
                        const catTotalOutlets = catChains.reduce((s, c) => s + (c.total_outlets || 0), 0);
                        const catEnteredOutlets = catChains.reduce((s, c) => s + (c.entered_outlets || 0), 0);
                        const catEnteredChains = catChains.filter(c => c.status === "entered").length;
                        const catOutletPercent = catTotalOutlets > 0 ? Math.round((catEnteredOutlets / catTotalOutlets) * 100) : 0;

                        return (
                            <div key={catKey} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <button onClick={() => setExpandedCategory(expandedCategory === catKey ? null : catKey)}
                                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg ${catBg} border flex items-center justify-center`}>
                                            <CatIcon className={`w-5 h-5 ${catColor}`} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-sm font-bold text-slate-800">{catLabel}</h3>
                                            <p className="text-[11px] text-slate-400">
                                                {catChains.length} chuỗi · {catTotalOutlets.toLocaleString()} điểm bán · {catEnteredChains} chuỗi đã vào
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* Mini stats */}
                                        <div className="hidden sm:flex items-center gap-3 mr-2">
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-teal-600">{catEnteredOutlets.toLocaleString()}<span className="text-slate-400 font-normal">/{catTotalOutlets.toLocaleString()}</span></div>
                                                <div className="text-[9px] text-slate-400">điểm đã vào</div>
                                            </div>
                                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${catOutletPercent}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-teal-600 min-w-[30px]">{catOutletPercent}%</span>
                                        </div>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-slate-100">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50/50 text-xs text-slate-500">
                                                    <th className="px-5 py-2.5 text-left font-medium">Tên chuỗi</th>
                                                    <th className="px-3 py-2.5 text-center font-medium">Trạng thái</th>
                                                    <th className="px-3 py-2.5 text-center font-medium">Đã vào / Tổng</th>
                                                    <th className="px-3 py-2.5 text-left font-medium">Khu vực</th>
                                                    <th className="px-3 py-2.5 text-left font-medium hidden lg:table-cell">Tỉnh/TP</th>
                                                    <th className="px-3 py-2.5 text-left font-medium hidden xl:table-cell">Nhãn hàng</th>
                                                    <th className="px-3 py-2.5 text-center font-medium w-24"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {catChains.map(chain => {
                                                    const st = STATUSES[chain.status] || STATUSES.not_entered;
                                                    const StIcon = st.icon;
                                                    const pct = chain.total_outlets > 0 ? Math.round(((chain.entered_outlets || 0) / chain.total_outlets) * 100) : 0;
                                                    return (
                                                        <tr key={chain.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-slate-800">{chain.name}</span>
                                                                    {chain.website && (
                                                                        <a href={chain.website} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-teal-500">
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
                                                            <td className="px-3 py-3">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="text-xs">
                                                                        <span className="font-bold text-teal-600">{(chain.entered_outlets || 0).toLocaleString()}</span>
                                                                        <span className="text-slate-400"> / {(chain.total_outlets || 0).toLocaleString()}</span>
                                                                    </span>
                                                                    {chain.total_outlets > 0 && (
                                                                        <div className="w-16 bg-slate-100 rounded-full h-1 overflow-hidden">
                                                                            <div className="bg-teal-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    {(chain.regions || []).map(r => (
                                                                        <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{REGIONS[r] || r}</span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 hidden lg:table-cell">
                                                                <p className="text-xs text-slate-500 max-w-[200px] truncate" title={(chain.provinces || []).join(", ")}>
                                                                    {(chain.provinces || []).slice(0, 3).join(", ")}
                                                                    {(chain.provinces || []).length > 3 && ` +${chain.provinces.length - 3}`}
                                                                </p>
                                                            </td>
                                                            <td className="px-3 py-3 hidden xl:table-cell">
                                                                {chain.entered_brands && chain.entered_brands.length > 0 ? (
                                                                    <div className="flex gap-1 flex-wrap">
                                                                        {chain.entered_brands.slice(0, 2).map(b => (
                                                                            <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-medium whitespace-nowrap">{b}</span>
                                                                        ))}
                                                                        {chain.entered_brands.length > 2 && (
                                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">+{chain.entered_brands.length - 2}</span>
                                                                        )}
                                                                    </div>
                                                                ) : <span className="text-xs text-slate-400">-</span>}
                                                            </td>
                                                            <td className="px-3 py-3 text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button onClick={() => setDetailChain(chain)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Xem chi tiết"><Eye className="w-4 h-4" /></button>
                                                                    {(isAdmin || (userRole === "telesales" && chain.created_by === userId)) && <button onClick={() => openEdit(chain)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Chỉnh sửa"><Pencil className="w-3.5 h-3.5" /></button>}
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
            {detailChain && (() => {
                const st = STATUSES[detailChain.status] || STATUSES.not_entered;
                const StIcon = st.icon;
                const pct = detailChain.total_outlets > 0 ? Math.round(((detailChain.entered_outlets || 0) / detailChain.total_outlets) * 100) : 0;
                return (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDetailChain(null)}>
                        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">{detailChain.name}</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">{catMap[detailChain.category]?.label || detailChain.category}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {(isAdmin || (userRole === "telesales" && detailChain.created_by === userId)) && (
                                        <>
                                            <button onClick={() => openEdit(detailChain)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg" title="Chỉnh sửa"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={() => setDeleteConfirm(detailChain.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                                        </>
                                    )}
                                    <button onClick={() => setDetailChain(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <div className="px-6 py-5 space-y-5">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${st.bg}`}>
                                    <StIcon className="w-4 h-4" /> {st.label}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                                        <div className="text-2xl font-bold text-slate-800">{(detailChain.total_outlets || 0).toLocaleString()}</div>
                                        <div className="text-xs text-slate-500 mt-1">Tổng điểm bán</div>
                                    </div>
                                    <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 text-center">
                                        <div className="text-2xl font-bold text-teal-700">{(detailChain.entered_outlets || 0).toLocaleString()}</div>
                                        <div className="text-xs text-teal-600 mt-1">Đã vào</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                                        <div className="text-2xl font-bold text-slate-800">{pct}%</div>
                                        <div className="text-xs text-slate-500 mt-1">Phủ sóng</div>
                                    </div>
                                </div>
                                {detailChain.total_outlets > 0 && (
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Khu vực</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(detailChain.regions || []).map(r => (
                                            <span key={r} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
                                                <MapPin className="w-3 h-3" /> {REGIONS[r] || r}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {(detailChain.provinces || []).length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tỉnh/TP</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {detailChain.provinces.map(p => <span key={p} className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">{p}</span>)}
                                        </div>
                                    </div>
                                )}
                                {(detailChain.entered_brands || []).length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nhãn hàng đã vào</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {detailChain.entered_brands!.map(b => (
                                                <span key={b} className="px-2.5 py-1 rounded bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200">{b}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(detailChain.contact_name || detailChain.contact_phone || detailChain.contact_email) && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Liên hệ</h4>
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                                            {detailChain.contact_name && <p className="text-sm text-slate-800 font-medium">{detailChain.contact_name}</p>}
                                            {detailChain.contact_phone && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /><a href={`tel:${detailChain.contact_phone}`} className="hover:text-teal-600">{detailChain.contact_phone}</a></div>}
                                            {detailChain.contact_email && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" /><a href={`mailto:${detailChain.contact_email}`} className="hover:text-teal-600">{detailChain.contact_email}</a></div>}
                                        </div>
                                    </div>
                                )}
                                {detailChain.website && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Website</h4>
                                        <a href={detailChain.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium">
                                            <ExternalLink className="w-3.5 h-3.5" /> {detailChain.website}
                                        </a>
                                    </div>
                                )}
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
                );
            })()}

            {/* Form Modals */}
            {formChain && <ChainFormModal chain={formChain} categories={categories} onSave={handleSaveChain} onClose={() => setFormChain(null)} saving={saving} />}
            {catForm && <CategoryFormModal category={catForm} onSave={handleSaveCat} onClose={() => setCatForm(null)} saving={saving} />}

            {/* Delete Confirmations */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center"><Trash2 className="w-6 h-6 text-red-500" /></div>
                        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Xác nhận xóa chuỗi</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">Bạn có chắc muốn xóa <strong>{chains.find(c => c.id === deleteConfirm)?.name}</strong>?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Hủy</button>
                            <button onClick={() => handleDeleteChain(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Xóa</button>
                        </div>
                    </div>
                </div>
            )}
            {catDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setCatDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center"><Trash2 className="w-6 h-6 text-red-500" /></div>
                        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Xác nhận xóa loại hình</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">Các chuỗi thuộc loại hình này sẽ không bị xóa nhưng sẽ không hiển thị đúng nhóm.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setCatDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Hủy</button>
                            <button onClick={() => handleDeleteCat(catDeleteConfirm)} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
