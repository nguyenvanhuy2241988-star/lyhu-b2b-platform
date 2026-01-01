"use client";

import React, { useState } from "react";
import { X, Printer, Package, CheckCircle2, Loader2, User, Phone, MapPin, Clipboard } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fetchOrders, updateOrderStatus, ORDER_STATUS_LABELS } from "@/lib/ordersStore";

interface FulfillmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    onConfirm: (orderId: string) => Promise<void>;
}

export const FulfillmentModal: React.FC<FulfillmentModalProps> = ({ isOpen, onClose, order, onConfirm }) => {
    const [isConfirming, setIsConfirming] = useState(false);

    if (!isOpen || !order) return null;

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm(order.id);
            onClose();
        } catch (err) {
            console.error("Fulfillment confirmation failed:", err);
            alert("Có lỗi xảy ra khi xác nhận đóng gói.");
        } finally {
            setIsConfirming(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-md uppercase">Fulfillment</span>
                            <span className="text-slate-400 text-sm font-medium">#{order.readable_id || order.id.slice(0, 8)}</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 leading-tight">Xử lý Đơn hàng</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Customer Info Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Người nhận</p>
                                    <p className="font-bold text-slate-800">{order.customer_name || "Khách hàng lẻ"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</p>
                                    <p className="font-bold text-slate-800">{order.receiver_phone || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ giao hàng</p>
                                    <p className="font-medium text-slate-600 text-sm leading-relaxed">
                                        {order.receiver_address || "Lấy hàng tại kho"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-primary-50 text-primary-600 rounded-md">
                                <Package className="w-4 h-4" />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Danh sách sản phẩm</h3>
                        </div>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-slate-50/30">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                                        <th className="px-6 py-4 font-bold uppercase text-[10px]">Sản phẩm / SKU</th>
                                        <th className="px-6 py-4 font-bold uppercase text-[10px] text-center">Số lượng</th>
                                        <th className="px-6 py-4 font-bold uppercase text-[10px] text-right">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {order.items?.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{item.product?.name}</div>
                                                <div className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mt-1 inline-block font-mono">
                                                    {item.product?.sku}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-lg font-black text-primary-600">x{item.quantity}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end">
                                                    <div className="w-5 h-5 border-2 border-slate-200 rounded-md flex items-center justify-center">
                                                        {/* Simple checkbox logic can be added here */}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Internal Notes */}
                    {order.notes && (
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-sm italic flex gap-3">
                            <Clipboard className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>{order.notes}</p>
                        </div>
                    )}
                </div>

                {/* Footer Labels */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-3 text-slate-600 font-bold hover:text-slate-900 transition-colors text-sm"
                    >
                        <Printer className="w-4 h-4" />
                        In phiếu đóng hàng
                    </button>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white transition-all text-sm"
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isConfirming}
                            className="flex-1 sm:flex-none px-8 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isConfirming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" />
                            )}
                            Xác nhận Đóng gói
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
