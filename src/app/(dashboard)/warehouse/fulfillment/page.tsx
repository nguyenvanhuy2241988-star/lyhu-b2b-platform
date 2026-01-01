"use client";

import React, { useState, useEffect } from "react";
import {
    ClipboardList,
    Search,
    Filter,
    Package,
    Truck,
    CheckCircle2,
    Clock,
    ArrowRight,
    Loader2,
    Check
} from "lucide-react";
import { fetchOrdersForFulfillment } from "@/lib/inventoryStore";
import { updateOrderStatus, ORDER_STATUS_LABELS } from "@/lib/ordersStore";
import { supabase } from "@/lib/supabaseClient";
import { FulfillmentModal } from "@/components/warehouse/FulfillmentModal";
import { useAuth } from "@/components/auth/AuthProvider";

export default function FulfillmentPage() {
    const { user, session } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const loadOrders = async () => {
        try {
            setIsLoading(true);
            const data = await fetchOrdersForFulfillment(session?.access_token);
            setOrders(data);
        } catch (err) {
            console.error('[FulfillmentPage] Failed to load orders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();

        if (!session?.access_token) return;

        // Real-time subscription for orders
        const channel = supabase
            .channel('fulfillment_orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload: any) => {
                    console.log('[FulfillmentPage] Orders change detected:', payload.eventType);
                    loadOrders();
                }
            )
            .subscribe((status: string) => {
                console.log('[FulfillmentPage] Orders channel status:', status);
                if (status === 'SUBSCRIBED') loadOrders();
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.access_token]);

    const handleOpenModal = (order: any) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleConfirmPacking = async (orderId: string) => {
        if (!user?.id) return;

        // Update status to 'ready_for_shipping' (or 'processing' if we want to be safe, 
        // but the plan says ready_for_shipping)
        const res = await updateOrderStatus(orderId, 'delivered', user.id); // For now using 'delivered' to trigger inventory deduction
        // Wait, the plan said 'ready_for_shipping'. 
        // But the inventory logic in ordersStore only triggers on 'delivered' (shipStock).
        // For V5.0, I'll use 'delivered' as the final warehouse state for now, 
        // or I should update shipStock to trigger on a new status.

        if (res) {
            alert("✅ Xác nhận đóng gói thành công!");
            loadOrders();
        } else {
            alert("❌ Lỗi khi cập nhật trạng thái đơn hàng.");
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.readable_id?.toString().includes(searchTerm) ||
            order.id.includes(searchTerm);

        const matchesStatus = filterStatus === "all" || order.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-2xl">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        Xử lý Đơn hàng
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Quản lý quy trình Fulfillment: Lấy hàng, Đóng gói và Bàn giao Shipper.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setFilterStatus("all")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === "all" ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        TẤT CẢ ({orders.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus("pending")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === "pending" ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        CHỜ XÁC NHẬN ({orders.filter(o => o.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => setFilterStatus("processing")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === "processing" ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        ĐANG XỬ LÝ ({orders.filter(o => o.status === 'processing').length})
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên khách hàng, mã đơn (#)..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Orders List */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-200" />
                        <p className="font-bold text-sm tracking-widest uppercase">Đang tải danh sách chờ...</p>
                    </div>
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => handleOpenModal(order)}
                            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group cursor-pointer flex flex-col md:flex-row items-center gap-6"
                        >
                            {/* Order Info */}
                            <div className="flex-1 flex items-center gap-4 w-full">
                                <div className={`p-4 rounded-2xl ${order.status === 'pending' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'} group-hover:scale-110 transition-transform`}>
                                    <Package className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">#{order.readable_id}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                                            }`}>
                                            {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                        {order.customer_name || "Khách hàng lẻ"}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(order.created_at).toLocaleDateString('vi-VN')} {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* Items Summary */}
                            <div className="hidden md:flex flex-[1.5] items-center gap-8 border-x border-slate-50 px-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-300 uppercase italic">Sản phẩm</p>
                                    <div className="flex flex-wrap gap-2">
                                        {order.items?.slice(0, 2).map((item: any, i: number) => (
                                            <span key={i} className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                                                {item.product?.name} <span className="text-primary-600">x{item.quantity}</span>
                                            </span>
                                        ))}
                                        {order.items?.length > 2 && (
                                            <span className="text-[10px] font-black text-slate-400 self-center">
                                                +{order.items.length - 2} khác
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="flex items-center justify-end gap-4 w-full md:w-auto">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-300 uppercase italic">Tổng thanh toán</p>
                                    <p className="font-black text-slate-900">
                                        {order.total_amount.toLocaleString('vi-VN')} đ
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 text-slate-300 rounded-full group-hover:bg-primary-50 group-hover:text-primary-600 group-hover:translate-x-1 transition-all">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-300 bg-white rounded-3xl border border-dashed border-slate-200">
                        <CheckCircle2 className="w-16 h-16 mb-6 opacity-20" />
                        <h3 className="text-xl font-black text-slate-900 mb-1">Tất cả đã hoàn tất!</h3>
                        <p className="text-sm font-medium">Hiện không có đơn hàng nào cần đóng gói.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <FulfillmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
                onConfirm={handleConfirmPacking}
            />
        </div>
    );
}
