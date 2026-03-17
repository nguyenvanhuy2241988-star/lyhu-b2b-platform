"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { MapPin, Plus, Search, Phone, Store, X } from "lucide-react";

interface Outlet {
    id: string;
    name: string;
    owner_name: string;
    phone: string;
    address: string;
    district: string;
    ward: string;
    outlet_type: string;
    visit_frequency: string;
    status: string;
    created_at: string;
}

const DISTRICTS = [
    "Hoàn Kiếm", "Ba Đình", "Đống Đa", "Hai Bà Trưng", "Cầu Giấy", "Thanh Xuân",
    "Hoàng Mai", "Long Biên", "Tây Hồ", "Nam Từ Liêm", "Bắc Từ Liêm", "Hà Đông",
    "Gia Lâm", "Đông Anh", "Sóc Sơn", "Thanh Trì", "Mê Linh", "Phúc Thọ",
    "Đan Phượng", "Hoài Đức", "Thạch Thất", "Quốc Oai", "Chương Mỹ", "Thanh Oai"
];

const OUTLET_TYPES: Record<string, string> = {
    tap_hoa: "🏪 Tạp hóa",
    mini_mart: "🏬 Siêu thị mini",
    dai_ly: "📦 Đại lý",
    sieu_thi: "🛒 Siêu thị",
};

const FREQUENCIES: Record<string, string> = {
    F1: "Hàng tuần",
    F2: "2 tuần/lần",
    F4: "Hàng tháng",
};

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
    active: { label: "Hoạt động", style: "bg-green-100 text-green-700" },
    inactive: { label: "Ngưng", style: "bg-slate-100 text-slate-600" },
    pending: { label: "Chờ duyệt", style: "bg-amber-100 text-amber-700" },
};

export default function OutletsPage() {
    const supabase = createClient();
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [districtFilter, setDistrictFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: "", owner_name: "", phone: "", address: "",
        district: "", ward: "", outlet_type: "tap_hoa", visit_frequency: "F4",
    });

    const loadOutlets = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
            .from('gt_outlets')
            .select('*')
            .eq('assigned_to', user.id)
            .order('created_at', { ascending: false });

        if (districtFilter) query = query.eq('district', districtFilter);
        if (typeFilter) query = query.eq('outlet_type', typeFilter);
        if (search) query = query.or(`name.ilike.%${search}%,owner_name.ilike.%${search}%,phone.ilike.%${search}%`);

        const { data } = await query;
        setOutlets(data || []);
        setLoading(false);
    }, [districtFilter, typeFilter, search]);

    useEffect(() => { loadOutlets(); }, [loadOutlets]);

    async function handleAddOutlet(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get GPS position
        let lat: number | null = null, lng: number | null = null;
        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
            );
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
        } catch { /* GPS optional */ }

        const { error } = await supabase.from('gt_outlets').insert({
            ...form,
            lat, lng,
            assigned_to: user.id,
            created_by: user.id,
            status: 'active',
        });

        if (!error) {
            setShowAddForm(false);
            setForm({ name: "", owner_name: "", phone: "", address: "", district: "", ward: "", outlet_type: "tap_hoa", visit_frequency: "F4" });
            loadOutlets();
        }
        setSaving(false);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">🏪 Điểm bán GT</h1>
                    <p className="text-sm text-slate-500 mt-1">{outlets.length} điểm bán</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> Thêm điểm bán
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên, chủ, SĐT..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>
                <select
                    value={districtFilter}
                    onChange={e => setDistrictFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                >
                    <option value="">Tất cả quận/huyện</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                >
                    <option value="">Tất cả loại</option>
                    {Object.entries(OUTLET_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </div>

            {/* Outlets List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-white h-20 rounded-xl border border-slate-200 animate-pulse" />)}
                </div>
            ) : outlets.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 font-medium">Chưa có điểm bán nào</p>
                    <p className="text-sm text-slate-400 mt-1">Nhấn "Thêm điểm bán" để bắt đầu</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">Cửa hàng</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Quận/Huyện</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Loại</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Tần suất</th>
                                    <th className="text-left px-4 py-3 font-medium text-slate-600">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {outlets.map(outlet => (
                                    <tr key={outlet.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{outlet.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                {outlet.owner_name && <span>{outlet.owner_name}</span>}
                                                {outlet.phone && (
                                                    <a href={`tel:${outlet.phone}`} className="flex items-center gap-0.5 text-teal-600 hover:underline ml-1">
                                                        <Phone className="w-3 h-3" />{outlet.phone}
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{outlet.district}</td>
                                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{OUTLET_TYPES[outlet.outlet_type] || outlet.outlet_type}</td>
                                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{FREQUENCIES[outlet.visit_frequency] || outlet.visit_frequency}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[outlet.status]?.style || 'bg-slate-100'}`}>
                                                {STATUS_LABELS[outlet.status]?.label || outlet.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Outlet Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900">➕ Thêm điểm bán mới</h3>
                            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddOutlet} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên cửa hàng *</label>
                                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="VD: Tạp hóa Minh Chí" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Chủ cửa hàng</label>
                                    <input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="Nguyễn Văn A" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SĐT</label>
                                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="0987654321" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ *</label>
                                <input required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="123 Phố Huế" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quận/Huyện *</label>
                                    <select required value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
                                        <option value="">Chọn...</option>
                                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phường/Xã</label>
                                    <input value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500" placeholder="Phường Đồng Nhân" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại cửa hàng</label>
                                    <select value={form.outlet_type} onChange={e => setForm(f => ({ ...f, outlet_type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
                                        {Object.entries(OUTLET_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tần suất ghé</label>
                                    <select value={form.visit_frequency} onChange={e => setForm(f => ({ ...f, visit_frequency: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
                                        {Object.entries(FREQUENCIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium">
                                    {saving ? "Đang lưu..." : "Thêm điểm bán"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
