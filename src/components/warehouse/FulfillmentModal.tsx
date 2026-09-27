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
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    if (!isOpen || !order) return null;

    const itemsCount = order.items?.length || 0;
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    const allChecked = itemsCount > 0 && checkedCount === itemsCount;

    const toggleItem = (idx: number) => {
        setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-[#00AFA9]/10 text-[#00AFA9] text-[10px] font-bold rounded-md uppercase">Fulfillment</span>
                            <span className="text-slate-400 text-xs font-mono">#{order.readable_id || order.id.slice(0, 8)}</span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Xử lý Đóng gói Đơn hàng</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {/* Customer Info Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="space-y-3">
                            <div className="flex items-start gap-2.5">
                                <div className="p-1.5 bg-white text-slate-600 rounded-lg border border-slate-200 shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Người nhận</p>
                                    <p className="font-bold text-slate-800 text-sm truncate">{order.customer_name || "Khách hàng lẻ"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <div className="p-1.5 bg-white text-slate-600 rounded-lg border border-slate-200 shrink-0">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</p>
                                    <p className="font-bold text-slate-800">{order.receiver_phone || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-2.5">
                                <div className="p-1.5 bg-white text-slate-600 rounded-lg border border-slate-200 shrink-0">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ giao hàng</p>
                                    <p className="font-medium text-slate-700 leading-relaxed">
                                        {order.receiver_address || "Lấy hàng trực tiếp tại kho"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Checklist Table */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-[#00AFA9]/10 text-[#00AFA9] rounded-lg">
                                    <Package className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Danh sách lấy hàng & đóng gói</h3>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                allChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                                Đã kiểm: {checkedCount}/{itemsCount}
                            </span>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                        <th className="px-4 py-3 font-bold uppercase text-[10px]">Sản phẩm / SKU</th>
                                        <th className="px-3 py-3 font-bold uppercase text-[10px] text-center">Số lượng</th>
                                        <th className="px-4 py-3 font-bold uppercase text-[10px] text-right">Đã kiểm</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {order.items?.map((item: any, idx: number) => {
                                        const isChecked = !!checkedItems[idx];
                                        return (
                                            <tr
                                                key={idx}
                                                onClick={() => toggleItem(idx)}
                                                className={`cursor-pointer transition-colors ${isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className={`font-semibold text-slate-900 ${isChecked ? 'line-through text-slate-400' : ''}`}>
                                                        {item.product?.name || item.name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                        SKU: {item.product?.sku || item.sku || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span className="text-sm font-bold text-[#00AFA9]">x{item.quantity}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleItem(idx)}
                                                        className="w-4 h-4 rounded border-slate-300 text-[#00AFA9] focus:ring-[#00AFA9] cursor-pointer"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Internal Notes */}
                    {order.notes && (
                        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex gap-2.5">
                            <Clipboard className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                            <div>
                                <p className="font-bold text-[11px] uppercase tracking-wider text-amber-800">Ghi chú đơn hàng</p>
                                <p className="mt-0.5">{order.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Labels */}
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2.5 text-slate-600 font-semibold hover:text-slate-900 transition-colors text-xs"
                    >
                        <Printer className="w-4 h-4" />
                        In phiếu đóng hàng
                    </button>
                    <div className="flex gap-2.5 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-white transition-all text-xs"
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isConfirming}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-[#00AFA9] hover:bg-[#009690] text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
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
