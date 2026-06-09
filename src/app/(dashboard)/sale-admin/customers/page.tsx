"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { fetchCustomers, Customer, updateCustomer, deleteCustomer } from "@/lib/crmDealsStore";
import { useRouter } from "next/navigation";
import {
    Phone, Mail, MapPin, Loader2, Building2,
    MoreHorizontal, Pencil, Trash2, X, Save,
    UserCircle, Search, Filter, AlertCircle, ShoppingCart
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const CUSTOMER_TYPES = ["Tất cả", "Tạp hóa", "Mini mart", "Đại lý", "NPP", "Siêu thị"] as const;

const typeMap: Record<string, string> = {
    'tap_hoa': 'Tạp hóa',
    'mini_mart': 'Mini mart',
    'dai_ly': 'Đại lý',
    'npp': 'NPP',
    'sieu_thi': 'Siêu thị'
};

const reverseTypeMap: Record<string, string> = {
    'Tạp hóa': 'tap_hoa',
    'Mini mart': 'mini_mart',
    'Đại lý': 'dai_ly',
    'NPP': 'npp',
    'Siêu thị': 'sieu_thi'
};

export default function SaleAdminCustomersPage() {
    const { session } = useAuth();
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<string>("Tất cả");
    const [searchQuery, setSearchQuery] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Edit state
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [editForm, setEditForm] = useState<Partial<Customer>>({});

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchCustomers(undefined, session?.access_token);
            setCustomers(data);
        } catch (err) {
            console.error("Failed to load customers:", err);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredCustomers = useMemo(() => {
        if (!customers) return [];
        return customers.filter((c) => {
            const typeMatch = selectedType === "Tất cả" || c.type === reverseTypeMap[selectedType] || c.type === selectedType;
            const searchMatch = !searchQuery ||
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.phone.includes(searchQuery);
            return typeMatch && searchMatch;
        });
    }, [selectedType, searchQuery, customers]);

    // Pagination
    const PAGE_SIZE = 50;
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedType, searchQuery]);

    const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
                alert("Cập nhật thất bại. Vui lòng thử lại.");
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý khách hàng</h1>
                    <p className="text-sm text-slate-600 mt-1">Dành cho Sale Admin</p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên, SĐT..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="flex items-center justify-end">
                    <span className="text-sm text-slate-500 font-medium">
                        Tổng cộng: {filteredCustomers.length}
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-sm text-slate-500 mt-2">Đang tải danh sách...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <Building2 className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-slate-500">Không tìm thấy khách hàng nào.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[800px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Khách hàng</th>
                                    <th className="px-6 py-4">Loại hình</th>
                                    <th className="px-6 py-4">Địa chỉ</th>
                                    <th className="px-6 py-4">Thông tin liên hệ</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {paginatedCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{customer.name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">ID: {customer.id.slice(0, 8)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                                {typeMap[customer.type || ''] || customer.type || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="max-w-[200px] truncate" title={customer.address || customer.old_address}>
                                                {customer.address || customer.old_address || "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    <span>{customer.phone}</span>
                                                </div>
                                                {customer.email && (
                                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span>{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => router.push(`/sale-admin/create-order?customer_id=${customer.id}`)}
                                                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                    title="Tạo đơn hàng"
                                                >
                                                    <ShoppingCart className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(customer)}
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id, customer.name)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    
                    {/* Mobile Card List View */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {paginatedCustomers.map((customer) => (
                            <div key={customer.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 pr-2">
                                        <div className="font-bold text-slate-900 line-clamp-2">{customer.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-1">ID: {customer.id.slice(0, 8)}</div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold flex-shrink-0">
                                        {typeMap[customer.type || ''] || customer.type || '-'}
                                    </span>
                                </div>
                                
                                <div className="bg-slate-50 p-3 rounded-lg space-y-2 mb-3">
                                    <div className="flex items-start gap-2 text-xs text-slate-600">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2">{customer.address || customer.old_address || "Chưa có địa chỉ"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        {customer.phone}
                                    </div>
                                    {customer.email && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="truncate">{customer.email}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                                    <button
                                        onClick={() => router.push(`/sale-admin/create-order?customer_id=${customer.id}`)}
                                        className="px-3 py-1.5 text-xs font-bold text-teal-600 bg-teal-50 border border-teal-100 hover:bg-teal-100 rounded-lg transition-colors flex items-center gap-1.5"
                                    >
                                        <ShoppingCart className="w-3.5 h-3.5" /> Tạo đơn
                                    </button>
                                    <button
                                        onClick={() => handleEditClick(customer)}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 rounded-lg transition-colors flex items-center gap-1.5"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(customer.id, customer.name)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                            <span className="text-xs text-slate-500">
                                Hiển thị {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} / {filteredCustomers.length} KH
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Trước
                                </button>
                                <span className="px-3 py-1.5 text-xs font-bold text-slate-700">
                                    Trang {currentPage}/{totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Sau →
                                </button>
                            </div>
                        </div>
                    )}
                </>
                )}
            </div>

            {/* Edit Modal */}
            {editingCustomer && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-900">Chỉnh sửa khách hàng</h3>
                            <button onClick={() => setEditingCustomer(null)} className="p-1 hover:bg-slate-200 rounded-lg">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tên khách hàng</label>
                                <input
                                    required
                                    value={editForm.name || ""}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Số điện thoại</label>
                                    <input
                                        required
                                        value={editForm.phone || ""}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Loại hình</label>
                                    <select
                                        value={editForm.type || "tap_hoa"}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
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
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editForm.email || ""}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Địa chỉ</label>
                                <textarea
                                    rows={2}
                                    value={editForm.address || ""}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingCustomer(null)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
