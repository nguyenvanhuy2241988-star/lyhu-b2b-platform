"use client";

import React, { useState, useEffect } from "react";
import { Search, Copy, X, Loader2, Calendar, User, Package, FileText, RefreshCw } from "lucide-react";
import { fetchOrders, Order } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";

interface CloneOrderPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectOrder: (orderId: string, orderData?: any) => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    } catch {
        return dateString;
    }
};

export function CloneOrderPickerModal({
    isOpen,
    onClose,
    onSelectOrder
}: CloneOrderPickerModalProps) {
    const { session } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const loadRecentOrders = async () => {
        setIsLoading(true);
        try {
            const data = await fetchOrders(session?.access_token, { limit: 200 });
            setOrders(data || []);
        } catch (err) {
            console.error("Exception loading orders for cloning:", err);
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        loadRecentOrders();
    }, [isOpen, session?.access_token]);

    if (!isOpen) return null;

    const filtered = orders.filter((o) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        const name = (o.customerName || "").toLowerCase();
        const phone = (o.customer?.phone || o.receiverPhone || "").toLowerCase();
        const code = String(o.readableId || o.id || "").toLowerCase();
        return name.includes(term) || phone.includes(term) || code.includes(term);
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50/70 via-white to-slate-50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                            <Copy className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">
                                Chọn Đơn Hàng Cũ Để Nhân Bản
                            </h3>
                            <p className="text-xs text-slate-500">
                                Toàn bộ sản phẩm và thông tin khách hàng từ đơn được chọn sẽ được sao chép sang đơn mới.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm theo tên khách hàng, số điện thoại, mã đơn (#655)..."
                            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={loadRecentOrders}
                        title="Tải lại danh sách"
                        className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Orders List */}
                <div className="overflow-y-auto flex-1 p-3 divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                            <span className="text-xs">Đang tải danh sách đơn hàng...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs font-medium">Không tìm thấy đơn hàng nào phù hợp</p>
                            {searchTerm && (
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm
                                </p>
                            )}
                        </div>
                    ) : (
                        filtered.map((order) => {
                            const itemCount = Array.isArray(order.items) ? order.items.length : 0;
                            const phone = order.customer?.phone || order.receiverPhone || "";
                            return (
                                <div
                                    key={order.id}
                                    className="py-3 px-3 hover:bg-amber-50/50 rounded-xl transition-colors flex items-center justify-between gap-3 border border-transparent hover:border-amber-200 mb-1"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                                #{order.readableId || order.id.slice(0, 8)}
                                            </span>
                                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(order.createdAt)}
                                            </span>
                                            {order.status && (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    {order.status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-800 font-semibold truncate">
                                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>{order.customerName || "Khách hàng"}</span>
                                            {phone && (
                                                <span className="text-slate-400 font-normal">({phone})</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                                            <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                                <Package className="w-3 h-3 text-slate-400" />
                                                {itemCount} món
                                            </span>
                                            <span className="text-emerald-700 font-bold">
                                                {formatPrice(order.totalAmount || 0)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            onSelectOrder(order.id, order);
                                            onClose();
                                        }}
                                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Nhân bản đơn này
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                    <span>Tìm thấy {filtered.length} đơn hàng</span>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-medium transition-colors cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
