"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    fetchPurchases, createPurchase, updatePurchaseStatus, PurchaseOrder, PurchaseStatus
} from "@/lib/purchasesStore";
import {
    Plus, Search, Filter, Loader2, Package,
    ShoppingCart, Truck, CheckCircle2, XCircle,
    Building2, Calendar, FileText, ChevronRight,
    ArrowDownCircle, DollarSign, Wallet
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AccountantPurchasesPage() {
    const { session } = useAuth();
    const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchPurchases(session?.access_token);
            setPurchases(data);
        } catch (err) {
            console.error("Load Purchases error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => { loadData(); }, [loadData]);

    const filteredPurchases = useMemo(() => {
        return purchases.filter(p =>
            p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [purchases, searchQuery]);

    const getStatusStyle = (status: PurchaseStatus) => {
        switch (status) {
            case 'received': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'ordered': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    const getStatusLabel = (status: PurchaseStatus) => {
        switch (status) {
            case 'received': return 'Đã nhập kho';
            case 'ordered': return 'Đang giao hàng';
            case 'cancelled': return 'Đã hủy';
            default: return 'Đơn nháp';
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Nhập hàng</h1>
                    <p className="text-sm text-slate-600 mt-1">Theo dõi đơn mua hàng (PO) và công nợ nhà cung cấp</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Tạo đơn mua hàng
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Đơn hàng hiện tại</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {purchases.filter(p => p.status === 'ordered').length} Đơn
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <ArrowDownCircle className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Giá trị nhập tháng này</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(purchases.filter(p => p.status === 'received').reduce((sum, p) => sum + p.totalAmount, 0))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Nợ Phải trả (331)</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(purchases.filter(p => p.status === 'received').reduce((sum, p) => sum + p.totalAmount, 0) * 0.3)} {/* Mock unpaid */}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm nhà cung cấp, mã PO..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div className="hidden lg:block overflow-x-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        </div>
                    ) : filteredPurchases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Package className="w-12 h-12 text-slate-200 mb-4" />
                            <p className="text-slate-500">Chưa có đơn nhập hàng nào.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Mã PO</th>
                                    <th className="px-6 py-4">Nhà cung cấp</th>
                                    <th className="px-6 py-4">Tổng tiền</th>
                                    <th className="px-6 py-4">Ngày đặt</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPurchases.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">PO-{p.id.slice(0, 8).toUpperCase()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium text-slate-700">{p.vendorName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{formatCurrency(p.totalAmount)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(p.orderedAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(p.status)}`}>
                                                {getStatusLabel(p.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary-600 hover:text-primary-700 font-bold text-xs flex items-center gap-1 ml-auto">
                                                Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Mobile Card List View */}
                {!isLoading && filteredPurchases.length > 0 && (
                    <div className="lg:hidden divide-y divide-slate-100">
                        {filteredPurchases.map((p) => (
                            <div key={p.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-slate-900">PO-{p.id.slice(0, 8).toUpperCase()}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{new Date(p.orderedAt).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(p.status)}`}>
                                        {getStatusLabel(p.status)}
                                    </span>
                                </div>
                                
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-slate-700 text-sm">{p.vendorName}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                                        <span className="text-xs text-slate-500">Tổng tiền</span>
                                        <div className="font-bold text-slate-900 text-base">{formatCurrency(p.totalAmount)}</div>
                                    </div>
                                </div>
                                
                                <button className="w-full py-2.5 bg-white border border-slate-200 text-primary-600 hover:bg-primary-50 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2">
                                    Chi tiết <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {!isLoading && filteredPurchases.length === 0 && (
                    <div className="lg:hidden flex flex-col items-center justify-center py-12 text-center bg-slate-50">
                        <Package className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">Chưa có đơn nhập hàng nào.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
