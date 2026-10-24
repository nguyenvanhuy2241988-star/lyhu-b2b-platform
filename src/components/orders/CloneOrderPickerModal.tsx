"use client";

import React, { useState, useEffect } from "react";
import { Search, Copy, X, Loader2, Calendar, User, Package, FileText } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

interface CloneOrderPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectOrder: (orderId: string) => void;
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
    const supabase = createClient();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        const loadRecentOrders = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select("id, readable_id, customer_name, customer_phone, total_amount, created_at, status, items")
                    .order("created_at", { ascending: false })
                    .limit(50);

                if (error) {
                    console.error("Error loading orders for cloning:", error);
                } else if (data) {
                    setOrders(data);
                }
            } catch (err) {
                console.error("Exception loading orders for cloning:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadRecentOrders();
    }, [isOpen]);

    if (!isOpen) return null;

    const filtered = orders.filter((o) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        const name = (o.customer_name || "").toLowerCase();
        const phone = (o.customer_phone || "").toLowerCase();
        const code = String(o.readable_id || o.id || "").toLowerCase();
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm theo tên khách hàng, số điện thoại, mã đơn..."
                            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            autoFocus
                        />
                    </div>
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
                        </div>
                    ) : (
                        filtered.map((order) => {
                            const itemCount = Array.isArray(order.items) ? order.items.length : 0;
                            return (
                                <div
                                    key={order.id}
                                    className="py-3 px-2 hover:bg-amber-50/40 rounded-xl transition-colors flex items-center justify-between gap-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold font-mono text-slate-800">
                                                #{order.readable_id || order.id.slice(0, 8)}
                                            </span>
                                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(order.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-700 font-medium truncate">
                                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>{order.customer_name || "Khách lẻ"}</span>
                                            {order.customer_phone && (
                                                <span className="text-slate-400">({order.customer_phone})</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                                            <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                                <Package className="w-3 h-3 text-slate-400" />
                                                {itemCount} món
                                            </span>
                                            <span className="text-teal-700 font-bold">
                                                {formatPrice(order.total_amount || 0)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            onSelectOrder(order.id);
                                            onClose();
                                        }}
                                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1.5 transition-all shrink-0"
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
                    <span>Hiển thị 50 đơn hàng gần nhất</span>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-medium transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
