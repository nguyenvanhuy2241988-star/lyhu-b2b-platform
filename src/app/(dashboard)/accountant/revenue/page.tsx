"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { fetchOrders, Order, updateOrderStatus } from "@/lib/ordersStore";
import { fetchCustomers, updateCustomer, Customer } from "@/lib/crmDealsStore";
import {
    FileText, Search, Filter, Loader2,
    CheckCircle2, AlertCircle, ExternalLink,
    Building2, Receipt, Save, X, Pencil
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { exportRevenueToMISA } from "@/lib/misaExportStore";

export default function AccountantRevenuePage() {
    const { session } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("delivered");

    // Edit Customer Modal (for MST/MISA Code)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [ordersData, custData] = await Promise.all([
                fetchOrders(session?.access_token),
                fetchCustomers(undefined, session?.access_token)
            ]);
            setOrders(ordersData);
            setCustomers(custData);
        } catch (err) {
            console.error("Load Revenue error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesStatus = statusFilter === "all" || o.status === statusFilter;
            const matchesSearch = !searchQuery ||
                o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.id.includes(searchQuery);
            return matchesStatus && matchesSearch;
        });
    }, [orders, statusFilter, searchQuery]);

    const handleEditCustomer = (order: Order) => {
        const customer = customers.find(c => c.id === order.customerId);
        if (customer) {
            setEditingCustomer(customer);
        } else {
            // If customer not found in B2B table, maybe it's a legacy or guest order
            alert("Không tìm thấy thông tin khách hàng chi tiết.");
        }
    };

    const saveCustomerInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCustomer) return;

        setIsSaving(true);
        try {
            const success = await updateCustomer(editingCustomer.id, {
                tax_code: editingCustomer.tax_code,
                misa_code: editingCustomer.misa_code,
                address: editingCustomer.address
            }, session?.access_token);

            if (success) {
                setEditingCustomer(null);
                loadData();
            } else {
                alert("Lưu thất bại.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản lý Doanh thu</h1>
                <p className="text-sm text-slate-600 mt-1">Đối soát đơn hàng và chuẩn hóa dữ liệu invoice</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm đơn hàng, khách hàng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                    >
                        <option value="delivered">Đã giao hàng (Chờ MISA)</option>
                        <option value="pending">Chờ xác nhận</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="all">Tất cả trạng thái</option>
                    </select>
                </div>
                <div className="flex justify-end items-center">
                    <button
                        onClick={() => exportRevenueToMISA(filteredOrders, customers)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        Xuất MISA Excel
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-sm text-slate-500 mt-2">Đang lấy dữ liệu hóa đơn...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Receipt className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-slate-500">Không có dữ liệu đơn hàng phù hợp.</p>
                    </div>
                ) : (
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[900px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Mã Đơn</th>
                                    <th className="px-6 py-4">Khách hàng / MST</th>
                                    <th className="px-6 py-4">Giá trị</th>
                                    <th className="px-6 py-4">Ngày tạo</th>
                                    <th className="px-6 py-4">Mã MISA</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredOrders.map((order) => {
                                    const customer = customers.find(c => c.id === order.customerId);
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">#{order.readableId}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{order.id.slice(0, 8)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{order.customerName}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <AlertCircle className={`w-3 h-3 ${customer?.tax_code ? 'text-green-500' : 'text-orange-400'}`} />
                                                    {customer?.tax_code || "Thiếu MST"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                                                </div>
                                                <div className={`text-[10px] font-bold uppercase mt-1 ${order.status === 'delivered' ? 'text-emerald-600' : 'text-slate-400'
                                                    }`}>
                                                    {order.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                {customer?.misa_code ? (
                                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs font-mono font-bold">
                                                        {customer.misa_code}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 italic text-xs">Chưa map</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEditCustomer(order)}
                                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                    title="Cập nhật thông tin xuất hóa đơn"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Mobile Card List View */}
                {!isLoading && filteredOrders.length > 0 && (
                    <div className="lg:hidden divide-y divide-slate-100">
                        {filteredOrders.map((order) => {
                            const customer = customers.find(c => c.id === order.customerId);
                            return (
                                <div key={order.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-slate-900">#{order.readableId}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.id.slice(0, 8)}</div>
                                            <div className="text-xs text-slate-500 mt-1">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                                            </div>
                                            <div className={`text-[10px] font-bold uppercase mt-1 ${order.status === 'delivered' ? 'text-emerald-600' : 'text-slate-400'
                                                }`}>
                                                {order.status}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-medium text-slate-900 text-sm">{order.customerName}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                    <AlertCircle className={`w-3.5 h-3.5 ${customer?.tax_code ? 'text-green-500' : 'text-orange-400'}`} />
                                                    {customer?.tax_code || "Thiếu MST"}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleEditCustomer(order)}
                                                className="p-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg shadow-sm transition-all flex-shrink-0"
                                                title="Cập nhật thông tin xuất hóa đơn"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                            <span className="text-slate-500">Mã MISA:</span>
                                            {customer?.misa_code ? (
                                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-mono font-bold">
                                                    {customer.misa_code}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 italic">Chưa map</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Edit Customer Info Modal */}
            {editingCustomer && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-900">Thông tin xuất hóa đơn</h3>
                            <button onClick={() => setEditingCustomer(null)} className="p-1 hover:bg-slate-200 rounded-lg">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={saveCustomerInfo} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Khách hàng</label>
                                <div className="text-sm font-semibold text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    {editingCustomer.name}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mã số thuế</label>
                                    <input
                                        value={editingCustomer.tax_code || ""}
                                        onChange={(e) => setEditingCustomer({ ...editingCustomer, tax_code: e.target.value })}
                                        placeholder="010xxxxxxx"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mã khách MISA</label>
                                    <input
                                        value={editingCustomer.misa_code || ""}
                                        onChange={(e) => setEditingCustomer({ ...editingCustomer, misa_code: e.target.value })}
                                        placeholder="KH001"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Địa chỉ hóa đơn</label>
                                <textarea
                                    rows={2}
                                    value={editingCustomer.address || ""}
                                    onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingCustomer(null)}
                                    className="flex-1 px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu lại
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
