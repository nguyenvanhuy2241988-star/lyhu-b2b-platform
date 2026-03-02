"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MapPin, Phone, Mail, MoreHorizontal, Building, UserPlus, Loader2, X, Save, Filter, TrendingUp, Trophy, Map, Tag, Calendar } from "lucide-react";
import { fetchCustomers, createCustomer, deleteCustomer, Customer, DEAL_STAGE_LABELS } from "@/lib/crmDealsStore";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    PipelineItem, TopCustomer, DistributionItem, DateRange,
    fetchPipelineStats, fetchTopCustomers, fetchProvinceDistribution, fetchTypeDistribution
} from "@/lib/customerDashboardStore";

import { PROVINCES, fetchDistricts, fetchWards, LocationOption } from "@/lib/vn-locations";

const CUSTOMER_TYPES = [
    { value: 'tap_hoa', label: 'Tạp hóa' },
    { value: 'mini_mart', label: 'Mini mart' },
    { value: 'dai_ly', label: 'Đại lý' },
    { value: 'npp', label: 'NPP' },
    { value: 'sieu_thi', label: 'Siêu thị' },
];

import AddCustomerModal from "@/components/telesales/AddCustomerModal";

export default function TelesalesCustomersPage() {
    const { user, session, isLoading: authIsLoading } = useAuth();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

    // Close menu on click outside or scroll/resize
    useEffect(() => {
        const handleClose = () => {
            console.log("Closing menu (clicked outside or scroll)");
            setOpenMenuId(null);
        };
        document.addEventListener('click', handleClose);
        window.addEventListener('scroll', handleClose, true); // Capture phase for all scrollables
        window.addEventListener('resize', handleClose);

        return () => {
            document.removeEventListener('click', handleClose);
            window.removeEventListener('scroll', handleClose, true);
            window.removeEventListener('resize', handleClose);
        };
    }, []);


    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [selectedType, setSelectedType] = useState("");
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedWard, setSelectedWard] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    // Location Data
    const [districts, setDistricts] = useState<LocationOption[]>([]);
    const [wards, setWards] = useState<LocationOption[]>([]);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    // Dashboard state
    const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
    const [provinceDist, setProvinceDist] = useState<DistributionItem[]>([]);
    const [typeDist, setTypeDist] = useState<DistributionItem[]>([]);
    const [dashLoading, setDashLoading] = useState(true);
    const [showDashboard, setShowDashboard] = useState(true);

    // Location Effects
    useEffect(() => {
        if (selectedProvince) {
            const p = PROVINCES.find(x => x.value === selectedProvince);
            if (p) {
                setLoadingDistricts(true);
                fetchDistricts(p.code).then(d => { setDistricts(d); setLoadingDistricts(false); });
            }
        } else {
            setDistricts([]);
            setWards([]);
        }
        setSelectedDistrict("");
        setSelectedWard("");
    }, [selectedProvince]);

    useEffect(() => {
        if (selectedDistrict) {
            const d = districts.find(x => x.value === selectedDistrict);
            if (d) {
                setLoadingWards(true);
                fetchWards(d.code).then(w => { setWards(w); setLoadingWards(false); });
            }
        } else {
            setWards([]);
        }
        setSelectedWard("");
    }, [selectedDistrict, districts]);


    const resetFilters = () => {
        setSearchTerm("");
        setSelectedType("");
        setSelectedProvince("");
        setSelectedDistrict("");
        setSelectedWard("");
        setFromDate("");
        setToDate("");
        setSortBy("newest");
    };


    const [isLoading, setIsLoading] = useState(true);

    // Updated loadData
    const loadData = useCallback(async () => {
        if (!user || !session?.access_token) return;
        setIsLoading(true);

        const filters = {
            province: selectedProvince,
            district: selectedDistrict,
            ward: selectedWard,
            type: selectedType,
            search: searchTerm,
            fromDate,
            toDate,
            sortBy: sortBy as any
        };

        const data = await fetchCustomers(user.id, session.access_token, filters);
        setCustomers(data);
        setIsLoading(false);
    }, [user, session?.access_token, selectedProvince, selectedDistrict, selectedWard, selectedType, searchTerm, fromDate, toDate, sortBy]);

    // Debounce effect
    useEffect(() => {
        if (!user || !session?.access_token) return;

        const timer = setTimeout(() => {
            loadData();
        }, 500);

        return () => clearTimeout(timer);
    }, [loadData]); // loadData changes when filters change due to dependency array

    // Realtime subscription
    useEffect(() => {
        const supabase = createClient();
        console.log("Setting up realtime subscription for customers...");

        const channel = supabase
            .channel('telesales-customers-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'customers'
                },
                (payload: any) => {
                    console.log('Realtime update received:', payload);
                    // Invalidate simple cache if exists (optional, but good practice)
                    // Then reload data
                    loadData();
                }
            )
            .subscribe((status: any) => {
                console.log("Realtime subscription status:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadData]);

    // Initial load handled by effect above or explicit mounting if needed. 
    // Actually the effect above depends on loadData which depends on all filters. 
    // On mount, filters are empty, loadData is created, effect runs.

    // Removed client-side filtering
    const filteredCustomers = customers;

    // Dashboard data
    useEffect(() => {
        if (!user?.id) return;
        const loadDash = async () => {
            setDashLoading(true);
            try {
                const now = new Date();
                const yearRange: DateRange = { startDate: new Date(now.getFullYear(), 0, 1), endDate: now };
                const [pipe, top, prov, type] = await Promise.all([
                    fetchPipelineStats(user.id),
                    fetchTopCustomers(5, yearRange, user.id),
                    fetchProvinceDistribution(user.id),
                    fetchTypeDistribution(user.id),
                ]);
                setPipeline(pipe);
                setTopCustomers(top);
                setProvinceDist(prov);
                setTypeDist(type);
            } catch (e) { console.error('Dashboard load error:', e); }
            finally { setDashLoading(false); }
        };
        loadDash();
    }, [user?.id]);

    const formatCurrency = (amount: number) => {
        if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
        if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
        return amount.toLocaleString('vi-VN');
    };

    const typeLabelsMap: Record<string, string> = {
        tap_hoa: 'Tạp hóa', mini_mart: 'Mini mart', dai_ly: 'Đại lý', npp: 'NPP', sieu_thi: 'Siêu thị'
    };

    const maxPipelineCount = Math.max(...pipeline.map(p => p.count), 1);

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer);
        setShowAddForm(true);
    };

    const handleCreateDeal = (customer: Customer) => {
        // Navigate to CRM with customer selected
        router.push(`/telesales/crm?create_for=${customer.id}`);
    };

    const handleModalSuccess = () => {
        loadData();
    };

    const handleCloseModal = () => {
        setShowAddForm(false);
        setEditingCustomer(null);
    };

    if (isLoading) {
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
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Thêm khách</span>
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
                        {(selectedType || selectedProvince) && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                    </button>
                </div>

                {showFilters && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Loại hình</label>
                                <select
                                    value={selectedType}
                                    onChange={e => setSelectedType(e.target.value)}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20"
                                >
                                    <option value="">Tất cả</option>
                                    {CUSTOMER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Tỉnh / Thành</label>
                                <select
                                    value={selectedProvince}
                                    onChange={e => setSelectedProvince(e.target.value)}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20"
                                >
                                    <option value="">Tất cả</option>
                                    {PROVINCES.map(p => <option key={p.code} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Quận / Huyện</label>
                                <select
                                    value={selectedDistrict}
                                    onChange={e => setSelectedDistrict(e.target.value)}
                                    disabled={!selectedProvince}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-50"
                                >
                                    <option value="">Tất cả</option>
                                    {districts.map(d => <option key={d.code} value={d.value}>{d.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Phường / Xã</label>
                                <select
                                    value={selectedWard}
                                    onChange={e => setSelectedWard(e.target.value)}
                                    disabled={!selectedDistrict}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-50"
                                >
                                    <option value="">Tất cả</option>
                                    {wards.map(w => <option key={w.code} value={w.value}>{w.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* More Filters Row 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Từ ngày</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={e => setFromDate(e.target.value)}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Đến ngày</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={e => setToDate(e.target.value)}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Sắp xếp</label>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20"
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                    <option value="name_asc">Tên A-Z</option>
                                    <option value="name_desc">Tên Z-A</option>
                                </select>
                            </div>
                            <div className="flex items-end justify-end">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-red-200 hover:border-red-300 transition-colors w-full sm:w-auto"
                                >
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
                    <div className="text-2xl font-bold text-slate-900">{customers.length}</div>
                    <div className="text-sm text-slate-500">Tổng khách hàng</div>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <div className="text-2xl font-bold text-green-600">{customers.filter(c => c.type === 'tap_hoa').length}</div>
                    <div className="text-sm text-slate-500">Tạp hóa</div>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <div className="text-2xl font-bold text-purple-600">{customers.filter(c => c.type === 'mini_mart').length}</div>
                    <div className="text-sm text-slate-500">Mini mart</div>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <div className="text-2xl font-bold text-orange-600">{customers.filter(c => c.type === 'npp' || c.type === 'dai_ly').length}</div>
                    <div className="text-sm text-slate-500">NPP/Đại lý</div>
                </div>
            </div>

            {/* Dashboard Toggle */}
            <div className="flex justify-end">
                <button onClick={() => setShowDashboard(!showDashboard)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showDashboard ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <TrendingUp className="w-3.5 h-3.5" /> Dashboard
                </button>
            </div>

            {/* Dashboard Sections */}
            {showDashboard && (
                <div className="space-y-4">
                    {dashLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <>
                            {/* Row 1: Pipeline + Top KH */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Pipeline CRM */}
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-indigo-500" /> Pipeline CRM (Deal đang mở)
                                    </h3>
                                    {pipeline.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-4 text-center">Chưa có deal nào</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {pipeline.map(item => {
                                                const w = Math.max((item.count / maxPipelineCount) * 100, 8);
                                                return (
                                                    <div key={item.stage} className="flex items-center gap-2">
                                                        <div className="w-24 text-[11px] text-slate-600 font-medium truncate" title={item.label}>{item.label}</div>
                                                        <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                                                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${w}%` }}></div>
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-700 min-w-[28px] text-right">{item.count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Top KH */}
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-amber-500" /> Top KH quan trọng (Năm nay)
                                    </h3>
                                    {topCustomers.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {topCustomers.map((c, idx) => (
                                                <div key={c.id} className="flex items-center gap-3 py-1.5">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                                                        }`}>{idx + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-semibold text-slate-800 truncate">{c.name}</div>
                                                        <div className="text-[10px] text-slate-400">{c.totalOrders} đơn</div>
                                                    </div>
                                                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(c.totalRevenue)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Khu vực + Phân loại */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Phân bổ Khu vực */}
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <Map className="w-4 h-4 text-teal-500" /> Phân bổ Khu vực
                                    </h3>
                                    {provinceDist.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {provinceDist.map(item => {
                                                const maxCount = Math.max(...provinceDist.map(d => d.count), 1);
                                                const w = Math.max((item.count / maxCount) * 100, 8);
                                                return (
                                                    <div key={item.key} className="flex items-center gap-2">
                                                        <div className="w-24 text-[11px] text-slate-600 font-medium truncate" title={item.label}>{item.label}</div>
                                                        <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                                                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${w}%` }}></div>
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
                                        <Tag className="w-4 h-4 text-violet-500" /> Phân loại khách hàng
                                    </h3>
                                    {typeDist.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {typeDist.map(item => {
                                                const maxCount = Math.max(...typeDist.map(d => d.count), 1);
                                                const w = Math.max((item.count / maxCount) * 100, 8);
                                                return (
                                                    <div key={item.key} className="flex items-center gap-2">
                                                        <div className="w-24 text-[11px] text-slate-600 font-medium truncate" title={item.label}>{item.label}</div>
                                                        <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                                                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${w}%` }}></div>
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-700 min-w-[28px] text-right">{item.count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Customers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Cửa hàng / Khách hàng</th>
                                <th className="px-6 py-3 font-medium">Liên hệ</th>
                                <th className="px-6 py-3 font-medium">Địa chỉ</th>
                                <th className="px-6 py-3 font-medium">Loại</th>
                                <th className="px-6 py-3 font-medium text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                                <Building className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{customer.name}</div>
                                                <div className="text-xs text-slate-500">ID: {customer.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600 mb-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            <a href={`tel:${customer.phone}`} className="hover:text-primary-600">{customer.phone}</a>
                                        </div>
                                        {customer.email && (
                                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span>{customer.email}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-2 text-slate-600">
                                            <MapPin className="w-3.5 h-3.5 mt-0.5" />
                                            <span className="max-w-[200px] truncate" title={customer.address}>
                                                {customer.address || "-"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${customer.type === 'tap_hoa' ? 'bg-green-100 text-green-700' :
                                            customer.type === 'mini_mart' ? 'bg-purple-100 text-purple-700' :
                                                customer.type === 'npp' ? 'bg-orange-100 text-orange-700' :
                                                    customer.type === 'dai_ly' ? 'bg-blue-100 text-blue-700' :
                                                        customer.type === 'sieu_thi' ? 'bg-pink-100 text-pink-700' :
                                                            'bg-slate-100 text-slate-600'
                                            }`}>
                                            {CUSTOMER_TYPES.find(t => t.value === customer.type)?.label || customer.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleCreateDeal(customer)}
                                                className="px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded text-xs font-medium transition-colors"
                                            >
                                                <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                                                Tạo cơ hội
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(customer)}
                                                className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
                                            >
                                                Sửa
                                            </button>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.nativeEvent.stopImmediatePropagation(); // Prevent document listener from firing
                                                        e.preventDefault();
                                                        console.log("Opening menu for:", customer.id);
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        console.log("Button rect:", rect);
                                                        setMenuPos({
                                                            top: rect.bottom + 4,
                                                            right: window.innerWidth - rect.right
                                                        });
                                                        setOpenMenuId(openMenuId === customer.id ? null : customer.id);
                                                    }}
                                                    className={`cursor-pointer p-1.5 rounded-full transition-colors ${openMenuId === customer.id ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <Building className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                        <p className="font-medium">Chưa có khách hàng nào</p>
                                        <p className="text-sm mt-1">Thêm khách hàng mới hoặc tạo cơ hội từ CRM</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Global Dropdown Menu */}
            {openMenuId && (console.log("Rendering menu at:", menuPos),
                <div
                    className="fixed bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-[9999] w-48 animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: `${menuPos.top}px`,
                        right: `${menuPos.right}px`
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/telesales/create-order?customerId=${openMenuId}`);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo đơn hàng
                    </button>
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
                                try {
                                    const success = await deleteCustomer(openMenuId, session?.access_token);
                                    if (success) {
                                        setOpenMenuId(null);
                                        loadData(); // Refresh list
                                    } else {
                                        alert('Không thể xóa khách hàng này. Vui lòng thử lại.');
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
                        Xóa khách hàng
                    </button>
                </div>
            )}

            {/* Add Customer Modal */}
            <AddCustomerModal
                isOpen={showAddForm}
                onClose={handleCloseModal}
                onSuccess={handleModalSuccess}
                initialData={editingCustomer}
            />
        </div>
    );
}
