"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MapPin, Phone, MoreHorizontal, Building, Loader2, X, Filter, TrendingUp, Map, Tag, Calendar } from "lucide-react";
import { createClient, supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";

interface GTOutlet {
    id: string;
    name: string;
    owner_name?: string;
    phone?: string;
    address: string;
    district: string;
    ward?: string;
    outlet_type: string;
    channel?: string;
    status: string;
    assigned_to?: string;
    created_by?: string;
    notes?: string;
    created_at: string;
}

const OUTLET_TYPES = [
    { value: 'tap_hoa', label: 'Tạp hóa' },
    { value: 'mini_mart', label: 'Mini mart' },
    { value: 'dai_ly', label: 'Đại lý' },
    { value: 'npp', label: 'NPP' },
    { value: 'sieu_thi', label: 'Siêu thị' },
];

export default function GTCustomersPage() {
    const { user, session, isLoading: authIsLoading } = useAuth();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

    useEffect(() => {
        const handleClose = () => setOpenMenuId(null);
        document.addEventListener('click', handleClose);
        window.addEventListener('scroll', handleClose, true);
        window.addEventListener('resize', handleClose);
        return () => {
            document.removeEventListener('click', handleClose);
            window.removeEventListener('scroll', handleClose, true);
            window.removeEventListener('resize', handleClose);
        };
    }, []);

    const [outlets, setOutlets] = useState<GTOutlet[]>([]);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [selectedType, setSelectedType] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    // Dashboard state
    const [showDashboard, setShowDashboard] = useState(true);

    // Dashboard time filter
    type TimePreset = 'today' | '7days' | 'month' | 'quarter' | 'year' | 'custom';
    const [timePreset, setTimePreset] = useState<TimePreset>('year');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    const resetFilters = () => {
        setSearchTerm("");
        setSelectedType("");
        setSelectedDistrict("");
        setFromDate("");
        setToDate("");
        setSortBy("newest");
    };

    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!user || !session?.access_token) return;
        setIsLoading(true);

        try {
            let query = supabase
                .from('gt_outlets')
                .select('*')
                .order('created_at', { ascending: sortBy === 'oldest' || sortBy === 'name_asc' ? true : false });

            // Apply filters
            if (selectedType) query = query.eq('outlet_type', selectedType);
            if (selectedDistrict) query = query.ilike('district', `%${selectedDistrict}%`);
            if (fromDate) query = query.gte('created_at', `${fromDate}T00:00:00`);
            if (toDate) query = query.lte('created_at', `${toDate}T23:59:59`);
            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,owner_name.ilike.%${searchTerm}%`);
            }

            if (sortBy === 'name_asc') query = query.order('name', { ascending: true });
            if (sortBy === 'name_desc') query = query.order('name', { ascending: false });

            const { data, error } = await query.limit(500);

            if (error) {
                console.error('[GT Customers] Error:', error);
                setOutlets([]);
            } else {
                setOutlets(data || []);
            }
        } catch (err) {
            console.error('[GT Customers] Exception:', err);
            setOutlets([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, session?.access_token, selectedType, selectedDistrict, searchTerm, fromDate, toDate, sortBy]);

    // Debounce effect
    useEffect(() => {
        if (!user || !session?.access_token) return;
        const timer = setTimeout(() => { loadData(); }, 500);
        return () => clearTimeout(timer);
    }, [loadData]);

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('gt-outlets-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gt_outlets' }, () => loadData())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [loadData]);

    // Dashboard computed stats
    const districts = Array.from(new Set(outlets.map(o => o.district).filter(Boolean)));
    const typeCounts = OUTLET_TYPES.map(t => ({
        ...t,
        count: outlets.filter(o => o.outlet_type === t.value).length
    }));
    const districtCounts = districts.map(d => ({
        key: d,
        label: d,
        count: outlets.filter(o => o.district === d).length
    })).sort((a, b) => b.count - a.count).slice(0, 8);

    const maxDistrictCount = Math.max(...districtCounts.map(d => d.count), 1);
    const maxTypeCount = Math.max(...typeCounts.map(t => t.count), 1);

    const districtColors = ['bg-teal-500', 'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-violet-500', 'bg-green-500', 'bg-sky-500'];
    const typeColors = ['bg-green-500', 'bg-purple-500', 'bg-blue-500', 'bg-orange-500', 'bg-pink-500'];

    if (isLoading && outlets.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Khách hàng của tôi</h1>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tên, SĐT..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => router.push('/sales-gt/outlets')}
                        className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Thêm điểm bán</span>
                    </button>
                </div>
            </div>

            {/* Filter Toggle & Panel */}
            <div className="space-y-3">
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Filter className="w-4 h-4" />
                        Bộ lọc nâng cao
                        {(selectedType || selectedDistrict) && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                    </button>
                </div>

                {showFilters && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Loại hình</label>
                                <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20">
                                    <option value="">Tất cả</option>
                                    {OUTLET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Quận / Huyện</label>
                                <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20">
                                    <option value="">Tất cả</option>
                                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Từ ngày</label>
                                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Đến ngày</label>
                                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Sắp xếp</label>
                                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20">
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                    <option value="name_asc">Tên A-Z</option>
                                    <option value="name_desc">Tên Z-A</option>
                                </select>
                            </div>
                            <div className="flex items-end justify-end lg:col-start-4">
                                <button onClick={resetFilters}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-red-200 hover:border-red-300 transition-colors w-full sm:w-auto">
                                    Xóa bộ lọc
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border">
                    <div className="text-2xl font-bold text-slate-900">{outlets.length}</div>
                    <div className="text-sm text-slate-500">Tổng điểm bán</div>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <div className="text-2xl font-bold text-green-600">{outlets.filter(c => c.outlet_type === 'tap_hoa').length}</div>
                    <div className="text-sm text-slate-500">Tạp hóa</div>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <div className="text-2xl font-bold text-purple-600">{outlets.filter(c => c.outlet_type === 'mini_mart').length}</div>
                    <div className="text-sm text-slate-500">Mini mart</div>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <div className="text-2xl font-bold text-orange-600">{outlets.filter(c => c.outlet_type === 'npp' || c.outlet_type === 'dai_ly').length}</div>
                    <div className="text-sm text-slate-500">NPP/Đại lý</div>
                </div>
            </div>

            {/* Dashboard Toggle + Time Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {[
                        { key: 'today' as TimePreset, label: 'Hôm nay' },
                        { key: '7days' as TimePreset, label: '7 ngày' },
                        { key: 'month' as TimePreset, label: 'Tháng này' },
                        { key: 'quarter' as TimePreset, label: 'Quý này' },
                        { key: 'year' as TimePreset, label: 'Năm nay' },
                        { key: 'custom' as TimePreset, label: 'Tùy chọn' },
                    ].map(p => (
                        <button key={p.key} onClick={() => setTimePreset(p.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timePreset === p.key
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}>
                            {p.label}
                        </button>
                    ))}
                    {timePreset === 'custom' && (
                        <div className="flex items-center gap-2 ml-2">
                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs" />
                            <span className="text-xs text-slate-400">→</span>
                            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs" />
                        </div>
                    )}
                </div>
                <button onClick={() => setShowDashboard(!showDashboard)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showDashboard ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <TrendingUp className="w-3.5 h-3.5" /> Dashboard
                </button>
            </div>

            {/* Dashboard Sections */}
            {showDashboard && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Phân bổ Khu vực */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Map className="w-4 h-4 text-teal-500" /> Phân bổ Khu vực
                        </h3>
                        {districtCounts.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu</p>
                        ) : (
                            <div className="space-y-2">
                                {districtCounts.map((item, idx) => {
                                    const w = Math.max((item.count / maxDistrictCount) * 100, 8);
                                    return (
                                        <div key={item.key} className="flex items-center gap-2">
                                            <div className="w-24 text-[11px] text-slate-600 font-medium truncate" title={item.label}>{item.label}</div>
                                            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                                                <div className={`h-full rounded-full ${districtColors[idx % districtColors.length]}`} style={{ width: `${w}%` }}></div>
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-700 min-w-[28px] text-right">{item.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Phân loại KH */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-violet-500" /> Phân loại điểm bán
                        </h3>
                        {typeCounts.filter(t => t.count > 0).length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu</p>
                        ) : (
                            <div className="space-y-2">
                                {typeCounts.map((item, idx) => {
                                    const w = Math.max((item.count / maxTypeCount) * 100, 8);
                                    return (
                                        <div key={item.value} className="flex items-center gap-2">
                                            <div className="w-24 text-[11px] text-slate-600 font-medium truncate" title={item.label}>{item.label}</div>
                                            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                                                <div className={`h-full rounded-full ${typeColors[idx % typeColors.length]}`} style={{ width: `${w}%` }}></div>
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-700 min-w-[28px] text-right">{item.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Outlets Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Điểm bán</th>
                                <th className="px-6 py-3 font-medium">Liên hệ</th>
                                <th className="px-6 py-3 font-medium">Địa chỉ</th>
                                <th className="px-6 py-3 font-medium">Loại</th>
                                <th className="px-6 py-3 font-medium text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {outlets.map((outlet) => (
                                <tr key={outlet.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                                <Building className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{outlet.name}</div>
                                                {outlet.owner_name && (
                                                    <div className="text-xs text-slate-500">Chủ: {outlet.owner_name}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {outlet.phone ? (
                                            <div className="flex items-center gap-2 text-slate-600 mb-1">
                                                <Phone className="w-3.5 h-3.5" />
                                                <a href={`tel:${outlet.phone}`} className="hover:text-teal-600">{outlet.phone}</a>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-2 text-slate-600">
                                            <MapPin className="w-3.5 h-3.5 mt-0.5" />
                                            <div>
                                                <div className="max-w-[200px] truncate" title={outlet.address}>{outlet.address || "-"}</div>
                                                <div className="text-xs text-slate-400">{outlet.district}{outlet.ward ? ` • ${outlet.ward}` : ''}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${outlet.outlet_type === 'tap_hoa' ? 'bg-green-100 text-green-700' :
                                            outlet.outlet_type === 'mini_mart' ? 'bg-purple-100 text-purple-700' :
                                                outlet.outlet_type === 'npp' ? 'bg-orange-100 text-orange-700' :
                                                    outlet.outlet_type === 'dai_ly' ? 'bg-blue-100 text-blue-700' :
                                                        outlet.outlet_type === 'sieu_thi' ? 'bg-pink-100 text-pink-700' :
                                                            'bg-slate-100 text-slate-600'
                                            }`}>
                                            {OUTLET_TYPES.find(t => t.value === outlet.outlet_type)?.label || outlet.outlet_type || 'Khác'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => router.push(`/sales-gt/create-order?outletId=${outlet.id}`)}
                                                className="px-3 py-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded text-xs font-medium transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5 inline mr-1" />
                                                Tạo đơn
                                            </button>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.nativeEvent.stopImmediatePropagation();
                                                        e.preventDefault();
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                                        setOpenMenuId(openMenuId === outlet.id ? null : outlet.id);
                                                    }}
                                                    className={`cursor-pointer p-1.5 rounded-full transition-colors ${openMenuId === outlet.id ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {outlets.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <Building className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                        <p className="font-medium">Chưa có điểm bán nào</p>
                                        <p className="text-sm mt-1">Thêm điểm bán mới từ mục Điểm bán</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Global Dropdown Menu */}
            {openMenuId && (
                <div
                    className="fixed bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-[9999] w-48 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: `${menuPos.top}px`, right: `${menuPos.right}px` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/sales-gt/create-order?outletId=${openMenuId}`);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo đơn hàng
                    </button>
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Bạn có chắc chắn muốn xóa điểm bán này?')) {
                                try {
                                    const { error } = await supabase.from('gt_outlets').delete().eq('id', openMenuId);
                                    if (error) {
                                        alert('Không thể xóa điểm bán: ' + error.message);
                                    } else {
                                        setOpenMenuId(null);
                                        loadData();
                                    }
                                } catch (err) {
                                    console.error('Delete error:', err);
                                    alert('Đã có lỗi xảy ra.');
                                }
                            }
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-50"
                    >
                        <X className="w-4 h-4" />
                        Xóa điểm bán
                    </button>
                </div>
            )}
        </div>
    );
}
