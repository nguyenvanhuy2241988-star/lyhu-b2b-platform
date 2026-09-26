"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { MapPin, Plus, Search, Phone, Store, X, ShoppingCart, ExternalLink } from "lucide-react";
import Link from "next/link";

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
    active: { label: "Hoạt động", style: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    inactive: { label: "Ngưng", style: "bg-slate-100 text-slate-600 border border-slate-200" },
    pending: { label: "Chờ duyệt", style: "bg-amber-50 text-amber-700 border border-amber-200" },
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
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Store className="w-6 h-6 text-[#00AFA9]" />
                        Điểm bán GT
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Quản lý danh sách {outlets.length} điểm bán trên tuyến phụ trách</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 bg-[#00AFA9] hover:bg-[#009b95] text-white px-4 py-2.5 rounded-xl transition-colors text-xs sm:text-sm font-bold shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Thêm điểm bán mới
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên cửa hàng, chủ tiệm, SĐT..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#00AFA9] transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={districtFilter}
                        onChange={e => setDistrictFilter(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#00AFA9] bg-white text-slate-700 flex-1 sm:flex-none"
                    >
                        <option value="">Tất cả quận/huyện</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#00AFA9] bg-white text-slate-700 flex-1 sm:flex-none"
                    >
                        <option value="">Tất cả mô hình</option>
                        {Object.entries(OUTLET_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>
            </div>

            {/* Outlets List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-white h-24 rounded-xl border border-slate-200 animate-pulse" />)}
                </div>
            ) : outlets.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-800 font-bold text-sm">Chưa có điểm bán nào</p>
                    <p className="text-xs text-slate-400 mt-1">Nhấn "Thêm điểm bán mới" để mở rộng tuyến bán hàng</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Cửa hàng</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Địa chỉ / Khu vực</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Mô hình</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Tần suất</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">Trạng thái</th>
                                    <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {outlets.map(outlet => (
                                    <tr key={outlet.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="font-bold text-slate-900">{outlet.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                {outlet.owner_name && <span>Chủ: {outlet.owner_name}</span>}
                                                {outlet.phone && (
                                                    <a href={`tel:${outlet.phone}`} className="flex items-center gap-0.5 text-[#00AFA9] hover:underline font-semibold ml-1">
                                                        <Phone className="w-3 h-3" />{outlet.phone}
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-600">
                                            <p className="font-medium text-slate-800">{outlet.district}</p>
                                            <p className="text-slate-400 mt-0.5 line-clamp-1">{outlet.address}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-700">{OUTLET_TYPES[outlet.outlet_type] || outlet.outlet_type}</td>
                                        <td className="px-4 py-3.5 text-xs text-slate-600">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                                                {FREQUENCIES[outlet.visit_frequency] || outlet.visit_frequency}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_LABELS[outlet.status]?.style || 'bg-slate-100'}`}>
                                                {STATUS_LABELS[outlet.status]?.label || outlet.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <Link
                                                href={`/sales-gt/create-order?outlet=${outlet.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00AFA9] hover:bg-[#009b95] text-white text-xs font-bold rounded-xl transition-colors"
                                            >
                                                <ShoppingCart className="w-3.5 h-3.5" /> Lên đơn
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List View with 1-Touch Actions */}
                    <div className="lg:hidden space-y-3">
                        {outlets.map(outlet => (
                            <div key={outlet.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-slate-900 text-sm truncate">{outlet.name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                            📍 {outlet.address}, {outlet.district}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_LABELS[outlet.status]?.style || 'bg-slate-100'}`}>
                                        {STATUS_LABELS[outlet.status]?.label || outlet.status}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs flex-wrap">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                        {OUTLET_TYPES[outlet.outlet_type] || outlet.outlet_type}
                                    </span>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                        Tần suất: {FREQUENCIES[outlet.visit_frequency] || outlet.visit_frequency}
                                    </span>
                                    {outlet.owner_name && (
                                        <span className="text-slate-500">Chủ: {outlet.owner_name}</span>
                                    )}
                                </div>

                                {/* 1-Touch Mobile Actions */}
                                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                                    {outlet.phone && (
                                        <a
                                            href={`tel:${outlet.phone}`}
                                            className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <Phone className="w-3.5 h-3.5 text-[#00AFA9]" /> Gọi điện
                                        </a>
                                    )}
                                    <a
                                        href={`https://maps.google.com/?q=${encodeURIComponent(outlet.address + ', ' + outlet.district + ', Hà Nội')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                                        title="Chỉ đường"
                                    >
                                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                    </a>
                                    <Link
                                        href={`/sales-gt/create-order?outlet=${outlet.id}`}
                                        className="flex-[1.5] py-2 px-3 bg-[#00AFA9] hover:bg-[#009b95] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                    >
                                        <ShoppingCart className="w-3.5 h-3.5" /> Lên đơn ngay
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Outlet Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-200">
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Store className="w-5 h-5 text-[#00AFA9]" />
                                Thêm điểm bán mới
                            </h3>
                            <button onClick={() => setShowAddForm(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddOutlet} className="p-4 sm:p-5 space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên cửa hàng / Tạp hóa *</label>
                                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#00AFA9]" placeholder="VD: Tạp hóa Minh Trí" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Chủ cửa hàng</label>
                                    <input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#00AFA9]" placeholder="Nguyễn Văn A" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#00AFA9]" placeholder="0987654321" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ chi tiết *</label>
                                <input required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#00AFA9]" placeholder="123 Phố Huế" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Quận/Huyện *</label>
                                    <select required value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#00AFA9] bg-white">
                                        <option value="">Chọn quận/huyện...</option>
                                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Phường/Xã</label>
                                    <input value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#00AFA9]" placeholder="Phường Đồng Nhân" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mô hình cửa hàng</label>
                                    <select value={form.outlet_type} onChange={e => setForm(f => ({ ...f, outlet_type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#00AFA9] bg-white">
                                        {Object.entries(OUTLET_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Tần suất ghé</label>
                                    <select value={form.visit_frequency} onChange={e => setForm(f => ({ ...f, visit_frequency: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#00AFA9] bg-white">
                                        {Object.entries(FREQUENCIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Hủy</button>
                                <button type="submit" disabled={saving} className="px-5 py-2 text-xs font-bold bg-[#00AFA9] text-white rounded-xl hover:bg-[#009b95] disabled:opacity-50 transition-colors">
                                    {saving ? "Đang lưu..." : "Xác nhận thêm"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
