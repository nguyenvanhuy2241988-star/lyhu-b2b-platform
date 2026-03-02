"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { fetchCustomers, Customer, updateCustomer, deleteCustomer } from "@/lib/crmDealsStore";
import { fetchUsers, User } from "@/lib/usersStore";
import {
    Phone, Mail, MapPin, Loader2, Building2,
    Search, Filter, Pencil, Trash2, X, Save,
    UserCircle, AlertCircle, Users, UserPlus, PhoneCall, ShoppingCart, Snowflake, TrendingUp, Crown
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    fetchCustomerDashboardStats, fetchPipelineStats, fetchTopCustomers,
    CustomerDashboardStats, PipelineItem, TopCustomer
} from "@/lib/customerDashboardStore";

import { PROVINCES, fetchDistricts, fetchWards, LocationOption } from "@/lib/vn-locations";

const CUSTOMER_TYPES = ["Tất cả", "Tạp hóa", "Mini mart", "Đại lý", "NPP", "Siêu thị"] as const;

const reverseTypeMap: Record<string, string> = {
    'Tạp hóa': 'tap_hoa',
    'Mini mart': 'mini_mart',
    'Đại lý': 'dai_ly',
    'NPP': 'npp',
    'Siêu thị': 'sieu_thi'
};

const typeMap: Record<string, string> = {
    'tap_hoa': 'Tạp hóa',
    'mini_mart': 'Mini mart',
    'dai_ly': 'Đại lý',
    'npp': 'NPP',
    'sieu_thi': 'Siêu thị'
};

export default function AdminCustomersPage() {
    const { session } = useAuth();
    const [selectedType, setSelectedType] = useState<string>("Tất cả");
    const [selectedOwner, setSelectedOwner] = useState<string>("Tất cả");
    const [searchQuery, setSearchQuery] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Filter state
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [selectedWard, setSelectedWard] = useState<string>("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    // Location data state
    const [districts, setDistricts] = useState<LocationOption[]>([]);
    const [wards, setWards] = useState<LocationOption[]>([]);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    // Edit state
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [editForm, setEditForm] = useState<Partial<Customer>>({});

    // Dashboard state
    const [dashStats, setDashStats] = useState<CustomerDashboardStats | null>(null);
    const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
    const [dashLoading, setDashLoading] = useState(true);

    // Load districts when province changes
    useEffect(() => {
        if (selectedProvince) {
            const province = PROVINCES.find(p => p.value === selectedProvince);
            if (province) {
                setLoadingDistricts(true);
                fetchDistricts(province.code).then(data => {
                    setDistricts(data);
                    setLoadingDistricts(false);
                });
            }
        } else {
            setDistricts([]);
            setWards([]);
        }
        setSelectedDistrict("");
        setSelectedWard("");
    }, [selectedProvince]);

    // Load wards when district changes
    useEffect(() => {
        if (selectedDistrict) {
            const district = districts.find(d => d.value === selectedDistrict);
            if (district) {
                setLoadingWards(true);
                fetchWards(district.code).then(data => {
                    setWards(data);
                    setLoadingWards(false);
                });
            }
        } else {
            setWards([]);
        }
        setSelectedWard("");
    }, [selectedDistrict, districts]);

    const resetFilters = () => {
        setSelectedType("Tất cả");
        setSelectedOwner("Tất cả");
        setSearchQuery("");
        setSelectedProvince("");
        setSelectedDistrict("");
        setSelectedWard("");
        setFromDate("");
        setToDate("");
        setSortBy("newest");
    };

    // Updated loadData
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const filters = {
                province: selectedProvince,
                district: selectedDistrict,
                ward: selectedWard,
                type: selectedType === "Tất cả" ? "Tất cả" : reverseTypeMap[selectedType] || selectedType,
                search: searchQuery,
                fromDate,
                toDate,
                sortBy: sortBy as any
            };

            const [custData, userData] = await Promise.all([
                fetchCustomers(selectedOwner === "Tất cả" ? undefined : selectedOwner, session?.access_token, filters),
                fetchUsers(session?.access_token)
            ]);
            setCustomers(custData);
            setUsers(userData);
        } catch (err) {
            console.error("Failed to load data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [session, selectedProvince, selectedDistrict, selectedWard, selectedType, selectedOwner, searchQuery, fromDate, toDate, sortBy]);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 500);
        return () => clearTimeout(timer);
    }, [loadData]);

    // Load dashboard data once
    useEffect(() => {
        const loadDashboard = async () => {
            setDashLoading(true);
            try {
                const [stats, pipe, top] = await Promise.all([
                    fetchCustomerDashboardStats(),
                    fetchPipelineStats(),
                    fetchTopCustomers(10)
                ]);
                setDashStats(stats);
                setPipeline(pipe);
                setTopCustomers(top);
            } catch (err) {
                console.error('Dashboard load error:', err);
            } finally {
                setDashLoading(false);
            }
        };
        loadDashboard();
    }, []);

    // Removed filteredCustomers useMemo, use customers directly (as it is now filtered from server)
    const filteredCustomers = customers;

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer);
        setEditForm({
            name: customer.name,
            phone: customer.phone,
            email: customer.email || "",
            address: customer.address || "",
            type: customer.type || "tap_hoa"
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCustomer) return;

        setIsSaving(true);
        try {
            const success = await updateCustomer(editingCustomer.id, editForm, session?.access_token);
            if (success) {
                setEditingCustomer(null);
                loadData();
            } else {
                alert("Cập nhật thất bại.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name}"?`)) return;

        try {
            const success = await deleteCustomer(id, session?.access_token);
            if (success) {
                loadData();
            } else {
                alert("Xóa thất bại.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getOwnerName = (ownerId?: string) => {
        if (!ownerId) return "Chưa phân bổ";
        const user = users.find(u => u.id === ownerId);
        return user ? user.name : "Không xác định";
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
        if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
        return amount.toLocaleString('vi-VN');
    };

    const typeLabels: Record<string, string> = {
        tap_hoa: 'Tạp hóa', mini_mart: 'Mini mart', dai_ly: 'Đại lý', npp: 'NPP', sieu_thi: 'Siêu thị'
    };

    const maxPipelineCount = Math.max(...pipeline.map(p => p.count), 1);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản lý khách hàng</h1>
                <p className="text-sm text-slate-600 mt-1">Danh sách khách hàng toàn hệ thống (Admin)</p>
            </div>

            {/* ===== DASHBOARD ===== */}
            {dashLoading ? (
                <div className="h-32 bg-slate-50 rounded-xl animate-pulse"></div>
            ) : (
                <div className="space-y-4">
                    {/* Row 1: Summary Cards */}
                    {dashStats && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {[
                                { label: 'Tổng KH', value: dashStats.totalCustomers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'Mới tháng này', value: dashStats.newThisMonth, icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Đã liên hệ', value: dashStats.contacted, icon: PhoneCall, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { label: 'Đã mua hàng', value: dashStats.withOrders, icon: ShoppingCart, color: 'text-amber-600', bg: 'bg-amber-50' },
                                { label: 'Chưa liên hệ', value: dashStats.cold, icon: Snowflake, color: 'text-slate-500', bg: 'bg-slate-50' },
                            ].map(card => (
                                <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`p-2.5 rounded-lg ${card.bg}`}>
                                        <card.icon className={`w-5 h-5 ${card.color}`} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-slate-900">{card.value.toLocaleString()}</div>
                                        <div className="text-xs text-slate-500 font-medium">{card.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Row 2: Pipeline + Top Customers */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Pipeline Funnel */}
                        {pipeline.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                    Pipeline CRM (Deal đang mở)
                                </h3>
                                <div className="space-y-2.5">
                                    {pipeline.map(item => {
                                        const widthPercent = Math.max(8, Math.round((item.count / maxPipelineCount) * 100));
                                        return (
                                            <div key={item.stage} className="flex items-center gap-3">
                                                <div className="w-24 text-xs text-slate-600 font-medium truncate" title={item.label}>{item.label}</div>
                                                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${item.color} transition-all duration-700 flex items-center justify-end pr-2`}
                                                        style={{ width: `${widthPercent}%` }}
                                                    >
                                                        <span className="text-[10px] font-bold text-white">{item.count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Top Customers */}
                        {topCustomers.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-amber-500" />
                                    Top KH quan trọng (Doanh thu)
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-slate-500 border-b">
                                                <th className="text-left pb-2 font-semibold">#</th>
                                                <th className="text-left pb-2 font-semibold">Khách hàng</th>
                                                <th className="text-left pb-2 font-semibold">Loại</th>
                                                <th className="text-right pb-2 font-semibold">Đơn</th>
                                                <th className="text-right pb-2 font-semibold">Doanh thu</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topCustomers.map((c, idx) => (
                                                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                                                    <td className="py-2 pr-2">
                                                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' :
                                                                idx === 1 ? 'bg-slate-100 text-slate-600' :
                                                                    idx === 2 ? 'bg-orange-100 text-orange-600' :
                                                                        'bg-slate-50 text-slate-400'
                                                            }`}>{idx + 1}</span>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="font-semibold text-slate-800 truncate max-w-[180px]">{c.name}</div>
                                                        {c.ownerName && <div className="text-[10px] text-slate-400">NV: {c.ownerName}</div>}
                                                    </td>
                                                    <td className="py-2">
                                                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase">
                                                            {typeLabels[c.type] || c.type || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 text-right font-medium text-slate-700">{c.totalOrders}</td>
                                                    <td className="py-2 text-right font-bold text-emerald-600">{formatCurrency(c.totalRevenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Advanced Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm tên, số điện thoại..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {/* Row 1: Type & Owner */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Loại hình</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Người phụ trách</label>
                        <select
                            value={selectedOwner}
                            onChange={(e) => setSelectedOwner(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="Tất cả">Tất cả nhân viên</option>
                            {users.filter(u => ['sales', 'telesales', 'ctv'].includes(u.role)).map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Row 2: Location Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Tỉnh / Thành phố</label>
                        <select
                            value={selectedProvince}
                            onChange={(e) => setSelectedProvince(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Tất cả khu vực</option>
                            {PROVINCES.map(p => <option key={p.code} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Quận / Huyện</label>
                        <div className="relative">
                            <select
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                disabled={!selectedProvince}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
                            >
                                <option value="">Tất cả Quận/Huyện</option>
                                {districts.map(d => <option key={d.code} value={d.value}>{d.label}</option>)}
                            </select>
                            {loadingDistricts && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-primary-500" />}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Phường / Xã</label>
                        <div className="relative">
                            <select
                                value={selectedWard}
                                onChange={(e) => setSelectedWard(e.target.value)}
                                disabled={!selectedDistrict}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
                            >
                                <option value="">Tất cả Phường/Xã</option>
                                {wards.map(w => <option key={w.code} value={w.value}>{w.label}</option>)}
                            </select>
                            {loadingWards && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-primary-500" />}
                        </div>
                    </div>

                    <div className="flex items-end justify-between lg:justify-end gap-3">
                        <button
                            onClick={resetFilters}
                            className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-2 bg-red-50 rounded-lg transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                        <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                            Kết quả: {filteredCustomers.length}
                        </span>
                    </div>
                </div>

                {/* Row 3: Date & Sort */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Từ ngày</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Đến ngày</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Sắp xếp</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="name_asc">Tên A-Z</option>
                            <option value="name_desc">Tên Z-A</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-sm text-slate-500 mt-2">Đang tải dữ liệu khách hàng...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <Building2 className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-slate-500">Không tìm thấy khách hàng nào phù hợp.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[1000px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Tên khách hàng</th>
                                    <th className="px-6 py-4">Loại hình</th>
                                    <th className="px-6 py-4">Địa chỉ / Khu vực</th>
                                    <th className="px-6 py-4">Liên hệ</th>
                                    <th className="px-6 py-4">Người phụ trách</th>
                                    <th className="px-6 py-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{customer.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">{customer.id.split('-')[0]}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase">
                                                {typeMap[customer.type || ''] || customer.type || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="max-w-[250px] truncate leading-relaxed">
                                                {customer.address || "Chưa cập nhật"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="font-medium">{customer.phone}</span>
                                                </div>
                                                {customer.email && (
                                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <UserCircle className="w-5 h-5" />
                                                </div>
                                                <span className="text-slate-700 font-medium">{getOwnerName(customer.owner_user_id)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => handleEditClick(customer)}
                                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id, customer.name)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingCustomer && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Chi tiết khách hàng</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Cập nhật thông tin định danh và liên hệ</p>
                            </div>
                            <button onClick={() => setEditingCustomer(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-8 space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tên hiển thị</label>
                                    <input
                                        required
                                        value={editForm.name || ""}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Điện thoại</label>
                                        <input
                                            required
                                            value={editForm.phone || ""}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phân loại</label>
                                        <select
                                            value={editForm.type || "tap_hoa"}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        >
                                            <option value="tap_hoa">Tạp hóa</option>
                                            <option value="mini_mart">Mini mart</option>
                                            <option value="dai_ly">Đại lý</option>
                                            <option value="npp">NPP</option>
                                            <option value="sieu_thi">Siêu thị</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Địa chỉ email</label>
                                    <input
                                        type="email"
                                        value={editForm.email || ""}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        placeholder="ví dụ: contact@store.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Địa chỉ chi tiết</label>
                                    <textarea
                                        rows={3}
                                        value={editForm.address || ""}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                        placeholder="Số nhà, tên đường, phường/xã..."
                                    />
                                </div>
                            </div>
                            <div className="pt-6 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingCustomer(null)}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-200 transition-all active:scale-95"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Cập nhật ngay
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
