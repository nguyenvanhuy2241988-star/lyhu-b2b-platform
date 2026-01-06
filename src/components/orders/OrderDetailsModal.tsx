import React from "react";
import { X, Calendar, User, Package, CreditCard, ShoppingBag } from "lucide-react";

interface OrderDetailsModalProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
}

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
    if (!isOpen || !order) return null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Chi tiết đơn hàng</h3>
                        <p className="text-sm text-slate-500">#{order.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-6 space-y-6">
                    {/* Status & Date */}
                    <div className="flex flex-wrap gap-4 justify-between bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Ngày đặt hàng</p>
                                <p className="font-medium text-slate-900">{formatDate(order.createdAt)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <CreditCard className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Trạng thái</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-indigo-100 text-indigo-800'
                                    }`}>
                                    {order.status === 'processing' ? 'Đang xử lý' :
                                        order.status === 'delivered' ? 'Đã giao' :
                                            order.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                            <User className="w-4 h-4" />
                            Thông tin khách hàng
                        </h4>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="font-medium text-slate-900">{order.customerName}</p>
                            <p className="text-sm text-slate-600 mt-1">{order.customer?.phone || 'Không có sđt'}</p>
                            <p className="text-sm text-slate-600">{order.customer?.address || 'Không có địa chỉ'}</p>

                            {/* Note */}
                            {order.note && (
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <p className="text-xs text-slate-500 mb-1">Ghi chú đơn hàng:</p>
                                    <p className="text-sm text-slate-800 italic bg-white p-2 rounded border border-slate-100">
                                        "{order.note}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                            <ShoppingBag className="w-4 h-4" />
                            Sản phẩm
                        </h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-2">Sản phẩm</th>
                                        <th className="px-4 py-2 text-center">SL</th>
                                        <th className="px-4 py-2 text-right">Đơn giá</th>
                                        <th className="px-4 py-2 text-right">Giảm giá</th>
                                        <th className="px-4 py-2 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(order.items || []).map((item: any, idx: number) => (
                                        <tr key={idx} className={item.is_gift ? "bg-indigo-50/50" : ""}>
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    {item.is_gift && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded">Quà</span>}
                                                    <span>{item.product?.name || item.name || 'Sản phẩm'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">
                                                {formatPrice(item.price || item.unitPrice || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-500 text-xs">
                                                {item.discount > 0 ? `-${formatPrice(item.discount)}` : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                                                {formatPrice(item.subtotal || ((item.price || 0) * item.quantity))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 text-slate-900">
                                    {/* Summary Rows */}
                                    {/* Only show detailed breakdown if there is discount or VAT */}
                                    {(order.vat > 0 || (order.items || []).some((i: any) => i.discount > 0)) && (
                                        <>
                                            <tr>
                                                <td colSpan={4} className="px-4 py-2 text-right text-slate-500 text-xs mt-2">Tổng tiền hàng</td>
                                                <td className="px-4 py-2 text-right text-slate-600 text-xs">
                                                    {formatPrice(
                                                        (order.items || []).reduce((sum: number, item: any) => {
                                                            if (item.is_gift) return sum;
                                                            return sum + ((item.price || item.unitPrice || 0) * item.quantity);
                                                        }, 0)
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan={4} className="px-4 py-1 text-right text-slate-500 text-xs">Tổng chiết khấu</td>
                                                <td className="px-4 py-1 text-right text-red-500 text-xs">
                                                    -{formatPrice(
                                                        (order.items || []).reduce((sum: number, item: any) => sum + (item.discount || 0), 0)
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan={4} className="px-4 py-1 text-right text-slate-500 text-xs">VAT</td>
                                                <td className="px-4 py-1 text-right text-slate-600 text-xs">
                                                    +{formatPrice(order.vat || 0)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan={5} className="border-t border-slate-200 my-2"></td>
                                            </tr>
                                        </>
                                    )}

                                    <tr className="font-bold text-base">
                                        <td colSpan={4} className="px-4 py-3 text-right">Tổng thanh toán</td>
                                        <td className="px-4 py-3 text-right text-indigo-600">
                                            {formatPrice(order.totalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-700 hover:bg-slate-50 font-medium"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
