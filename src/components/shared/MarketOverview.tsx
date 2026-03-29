"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    Search, Edit2, X, Save, Loader2, MapPin, Store,
    TrendingUp, CheckCircle, XCircle, Filter, ChevronDown, ChevronUp
} from "lucide-react";

interface ProvinceData {
    id: string;
    province: string;
    region: string;
    population: number;
    total_routes: number;
    estimated_outlets: number;
    has_npp: boolean;
    npp_name: string | null;
    npp_brands: string[];
    npp_status: string;
    notes: string | null;
    updated_at: string;
}

interface MarketOverviewProps {
    readOnly?: boolean;
}

const REGIONS = ["Tất cả", "Bắc", "Trung", "Nam"];
const NPP_FILTERS = ["Tất cả", "Có NPP", "Chưa có NPP"];

export default function MarketOverview({ readOnly = true }: MarketOverviewProps) {
    const supabase = createClient();
    const { user } = useAuth();
    const [data, setData] = useState<ProvinceData[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [regionFilter, setRegionFilter] = useState("Tất cả");
    const [nppFilter, setNppFilter] = useState("Tất cả");
    const [search, setSearch] = useState("");

    // Edit modal
    const [editing, setEditing] = useState<ProvinceData | null>(null);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        population: 0,
        total_routes: 0,
        estimated_outlets: 0,
        has_npp: false,
        npp_name: "",
        npp_brands: [] as string[],
        npp_status: "inactive",
        notes: "",
    });
    const [brandsInput, setBrandsInput] = useState("");

    // Expanded rows
    const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        const { data: rows, error } = await supabase
            .from("province_market_data")
            .select("*")
            .order("region")
            .order("province");

        if (!error && rows) setData(rows);
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Derived stats
    const filtered = data.filter(d => {
        if (regionFilter !== "Tất cả" && d.region !== regionFilter) return false;
        if (nppFilter === "Có NPP" && !d.has_npp) return false;
        if (nppFilter === "Chưa có NPP" && d.has_npp) return false;
        if (search && !d.province.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const totalProvinces = data.length;
    const nppCount = data.filter(d => d.has_npp).length;
    const totalRoutes = data.reduce((s, d) => s + d.total_routes, 0);
    const totalOutlets = data.reduce((s, d) => s + d.estimated_outlets, 0);
    const coveragePct = totalProvinces > 0 ? Math.round((nppCount / totalProvinces) * 100) : 0;

    // Group by region
    const grouped = filtered.reduce((acc, d) => {
        if (!acc[d.region]) acc[d.region] = [];
        acc[d.region].push(d);
        return acc;
    }, {} as Record<string, ProvinceData[]>);

    const regionOrder = ["Bắc", "Trung", "Nam"];
    const regionColors: Record<string, string> = {
        "Bắc": "bg-blue-50 border-blue-200 text-blue-700",
        "Trung": "bg-amber-50 border-amber-200 text-amber-700",
        "Nam": "bg-emerald-50 border-emerald-200 text-emerald-700",
    };
    const regionIcons: Record<string, string> = {
        "Bắc": "🏔️", "Trung": "🏖️", "Nam": "🌴"
    };

    function openEdit(item: ProvinceData) {
        setEditing(item);
        setEditForm({
            population: item.population,
            total_routes: item.total_routes,
            estimated_outlets: item.estimated_outlets,
            has_npp: item.has_npp,
            npp_name: item.npp_name || "",
            npp_brands: item.npp_brands || [],
            npp_status: item.npp_status || "inactive",
            notes: item.notes || "",
        });
        setBrandsInput((item.npp_brands || []).join(", "));
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!editing || !user) return;
        setSaving(true);

        const brands = brandsInput.split(",").map(b => b.trim()).filter(Boolean);

        const { error } = await supabase
            .from("province_market_data")
            .update({
                population: editForm.population,
                total_routes: editForm.total_routes,
                estimated_outlets: editForm.estimated_outlets,
                has_npp: editForm.has_npp,
                npp_name: editForm.npp_name || null,
                npp_brands: brands,
                npp_status: editForm.has_npp ? editForm.npp_status : "inactive",
                notes: editForm.notes || null,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", editing.id);

        if (error) {
            alert("Lỗi: " + error.message);
        } else {
            setEditing(null);
            loadData();
        }
        setSaving(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-teal-50 rounded-lg"><MapPin className="w-4 h-4 text-teal-600" /></div>
                        <span className="text-xs text-slate-500">Phủ sóng NPP</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">{nppCount}</span>
                        <span className="text-sm text-slate-400">/ {totalProvinces}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: `${coveragePct}%` }} />
                    </div>
                    <span className="text-[11px] text-teal-600 font-medium">{coveragePct}% tỉnh/thành</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-blue-50 rounded-lg"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
                        <span className="text-xs text-slate-500">Tổng tuyến</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{totalRoutes.toLocaleString('vi-VN')}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-purple-50 rounded-lg"><Store className="w-4 h-4 text-purple-600" /></div>
                        <span className="text-xs text-slate-500">Điểm bán dự trù</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{totalOutlets.toLocaleString('vi-VN')}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-amber-50 rounded-lg"><MapPin className="w-4 h-4 text-amber-600" /></div>
                        <span className="text-xs text-slate-500">Vùng trắng</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{totalProvinces - nppCount}</p>
                    <span className="text-[11px] text-slate-400">tỉnh chưa có NPP</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    {REGIONS.map(r => (
                        <button key={r} onClick={() => setRegionFilter(r)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${regionFilter === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >{r}</button>
                    ))}
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    {NPP_FILTERS.map(f => (
                        <button key={f} onClick={() => setNppFilter(f)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${nppFilter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >{f}</button>
                    ))}
                </div>
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm tỉnh..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                    />
                </div>
                <span className="text-[11px] text-slate-400 ml-auto">{filtered.length} tỉnh/thành</span>
            </div>

            {/* Province Table grouped by region */}
            <div className="space-y-3">
                {regionOrder.filter(r => grouped[r]).map(region => {
                    const provinces = grouped[region];
                    const isExpanded = expandedRegion === null || expandedRegion === region;
                    const regionNpp = provinces.filter(p => p.has_npp).length;
                    const regionRoutes = provinces.reduce((s, p) => s + p.total_routes, 0);
                    const regionPop = provinces.reduce((s, p) => s + p.population, 0);

                    return (
                        <div key={region} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            {/* Region Header */}
                            <button
                                onClick={() => setExpandedRegion(isExpanded && expandedRegion !== null ? null : region)}
                                className={`w-full flex items-center justify-between px-5 py-3 ${regionColors[region]} border-b transition-colors hover:opacity-90`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{regionIcons[region]}</span>
                                    <span className="font-bold text-sm">Miền {region}</span>
                                    <span className="text-[11px] opacity-70">
                                        {provinces.length} tỉnh • {(regionPop / 1000).toFixed(1)}tr dân • {regionNpp} NPP • {regionRoutes} tuyến
                                    </span>
                                </div>
                                {isExpanded ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
                            </button>

                            {/* Province Rows */}
                            {isExpanded && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50/80 text-slate-500">
                                            <tr>
                                                <th className="text-left px-4 py-2 font-medium text-xs">Tỉnh/Thành</th>
                                                <th className="text-right px-3 py-2 font-medium text-xs">Dân số (nghìn)</th>
                                                <th className="text-right px-3 py-2 font-medium text-xs">Số tuyến</th>
                                                <th className="text-right px-3 py-2 font-medium text-xs">Điểm bán DT</th>
                                                <th className="text-center px-3 py-2 font-medium text-xs">NPP</th>
                                                {!readOnly && <th className="text-left px-3 py-2 font-medium text-xs">Tên NPP</th>}
                                                {!readOnly && <th className="text-left px-3 py-2 font-medium text-xs">Nhãn hiệu</th>}
                                                {!readOnly && <th className="text-right px-4 py-2 font-medium text-xs">Sửa</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {provinces.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-2.5">
                                                        <span className="font-medium text-slate-800 text-xs">{p.province}</span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right text-xs text-slate-600">
                                                        {p.population > 0 ? p.population.toLocaleString('vi-VN') : '-'}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right">
                                                        <span className={`text-xs font-medium ${p.total_routes > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                                                            {p.total_routes > 0 ? p.total_routes : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right">
                                                        <span className={`text-xs font-medium ${p.estimated_outlets > 0 ? 'text-purple-600' : 'text-slate-300'}`}>
                                                            {p.estimated_outlets > 0 ? p.estimated_outlets.toLocaleString('vi-VN') : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        {p.has_npp ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                                <CheckCircle className="w-3 h-3" /> Có
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                                <XCircle className="w-3 h-3" /> Chưa
                                                            </span>
                                                        )}
                                                    </td>
                                                    {!readOnly && (
                                                        <td className="px-3 py-2.5 text-xs text-slate-600">
                                                            {p.npp_name || <span className="text-slate-300">-</span>}
                                                        </td>
                                                    )}
                                                    {!readOnly && (
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex flex-wrap gap-1">
                                                                {(p.npp_brands || []).length > 0 ? p.npp_brands.map((brand, i) => (
                                                                    <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                                                                        {brand}
                                                                    </span>
                                                                )) : <span className="text-[10px] text-slate-300">-</span>}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {!readOnly && (
                                                        <td className="px-4 py-2.5 text-right">
                                                            <button
                                                                onClick={() => openEdit(p)}
                                                                className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                                title="Sửa thông tin"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <MapPin className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                        <p className="text-sm text-slate-400">Không tìm thấy tỉnh/thành nào phù hợp</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editing && !readOnly && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">✏️ {editing.province}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Cập nhật thông tin thị trường</p>
                            </div>
                            <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Dân số (nghìn)</label>
                                    <input type="number" value={editForm.population}
                                        onChange={e => setEditForm(f => ({ ...f, population: parseInt(e.target.value) || 0 }))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Số tuyến</label>
                                    <input type="number" value={editForm.total_routes}
                                        onChange={e => setEditForm(f => ({ ...f, total_routes: parseInt(e.target.value) || 0 }))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Điểm bán DT</label>
                                    <input type="number" value={editForm.estimated_outlets}
                                        onChange={e => setEditForm(f => ({ ...f, estimated_outlets: parseInt(e.target.value) || 0 }))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* NPP Section */}
                            <div className="border-t border-slate-100 pt-4">
                                <label className="flex items-center gap-2 cursor-pointer mb-3">
                                    <input type="checkbox" checked={editForm.has_npp}
                                        onChange={e => setEditForm(f => ({ ...f, has_npp: e.target.checked }))}
                                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Đã có NPP</span>
                                </label>

                                {editForm.has_npp && (
                                    <div className="space-y-3 pl-6 border-l-2 border-teal-200">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Tên NPP</label>
                                            <input value={editForm.npp_name}
                                                onChange={e => setEditForm(f => ({ ...f, npp_name: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                                placeholder="VD: NPP Hà Nội ABC"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Nhãn hiệu (cách nhau bởi dấu phẩy)</label>
                                            <input value={brandsInput}
                                                onChange={e => setBrandsInput(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                                placeholder="VD: LYHU, Brand A, Brand B"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Trạng thái NPP</label>
                                            <select value={editForm.npp_status}
                                                onChange={e => setEditForm(f => ({ ...f, npp_status: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                            >
                                                <option value="active">Đang hoạt động</option>
                                                <option value="pending">Đang triển khai</option>
                                                <option value="inactive">Ngưng hoạt động</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Ghi chú</label>
                                <textarea value={editForm.notes}
                                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                                    placeholder="Ghi chú thêm..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button type="button" onClick={() => setEditing(null)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium transition-colors">
                                    <Save className="w-4 h-4" />
                                    {saving ? "Đang lưu..." : "Lưu"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
