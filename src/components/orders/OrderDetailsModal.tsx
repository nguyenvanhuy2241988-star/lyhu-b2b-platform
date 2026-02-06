import React, { useEffect, useState } from "react";
import { X, Calendar, User, MapPin, ShoppingBag, CreditCard, Printer, Image as ImageIcon, RefreshCw, CheckCircle2, AlertOctagon } from "lucide-react";
import { Order } from "@/lib/ordersStore";
import { OrderPrintTemplate } from "./OrderPrintTemplate";
import html2canvas from "html2canvas";

interface OrderDetailsModalProps {
    order: any;
    isOpen?: boolean;
    onClose: () => void;
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
    const [settings, setSettings] = useState<any>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [localMisaStatus, setLocalMisaStatus] = useState<any>(null); // To update UI immediately without reload

    // Sync Misa Handler
    const handleSyncMisa = async () => {
        console.log("CLICKED SYNC BUTTON for order:", order?.id); // Debug click
        if (!order) return;
        setIsSyncing(true);
        try {
            const res = await fetch('/api/misa/sync-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id })
            });
            const data = await res.json();
            console.log("MISA API RESPONSE:", data); // Debug Response

            if (res.ok && data.success) {
                const misaRef = data.refId || "Unknown Ref";
                setLocalMisaStatus({ status: 'synced', refId: misaRef, error: null });

                // Log debug info prominently  
                console.log("%c[MISA SUCCESS] Ref ID: " + misaRef, "color: green; font-size: 16px; font-weight: bold;");
                if (data.debug?.productCodes) {
                    console.log("%c[DEBUG] Product Codes Sent:", "color: orange; font-weight: bold;");
                    console.table(data.debug.productCodes);
                }
                // Log full payload for debugging
                if (data.debugPayload) {
                    console.log("%c[DEBUG] FULL PAYLOAD SENT TO MISA:", "color: purple; font-size: 14px; font-weight: bold;");
                    console.log(JSON.stringify(data.debugPayload, null, 2));
                }

                // Build alert message
                let alertMsg = `✅ Đồng bộ MISA thành công!\n\nMã chứng từ: ${misaRef}`;
                if (data.debug?.productCodes) {
                    const missingCodes = data.debug.productCodes.filter((p: any) => p.misa_code === "MISSING");
                    if (missingCodes.length > 0) {
                        alertMsg += `\n\n⚠️ CẢNH BÁO: ${missingCodes.length} sản phẩm CHƯA CÓ MÃ MISA!`;
                    }
                }
                alert(alertMsg);
            } else {
                setLocalMisaStatus({ status: 'failed', refId: null, error: data.error || "Unknown error" });
                console.error("[MISA FAILURE]", data);

                // Log payload for debugging
                if (data.debugPayload) {
                    console.error("[MISA DEBUG] Failed Payload:", JSON.stringify(data.debugPayload, null, 2));
                }

                alert("❌ MISA Sync Error: " + (data.error || JSON.stringify(data)) + "\n\n(Xem Console F12 để thấy Payload chi tiết)");
            }
        } catch (err: any) {
            console.error("Sync Misa error", err);
            setLocalMisaStatus({ status: 'failed', refId: null, error: err.message });
            alert("Lỗi kết nối: " + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleTestConnection = async () => {
        try {
            const res = await fetch('/api/misa/test-connection');
            const data = await res.json();
            if (data.success) {
                alert(`✅ Kết nối thành công! Token: ${data.tokenPreview}`);
            } else {
                alert(`❌ Kết nối thất bại: ${data.error}`);
            }
        } catch (e: any) {
            alert(`Lỗi mạng: ${e.message}`);
        }
    };

    // Determine effective status (local override or order prop)
    const effectiveMisaStatus = localMisaStatus?.status || order?.misa_sync_status || 'pending';
    const effectiveMisaRef = localMisaStatus?.refId || order?.misa_ref_id;
    const effectiveMisaError = localMisaStatus?.error || order?.misa_sync_error;


    useEffect(() => {
        if (order) {
            // Fetch settings for print/export
            fetch('/api/admin/settings')
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        setSettings(data);
                    }
                })
                .catch(err => console.error("Failed to fetch settings for print:", err));
        }
    }, [order]);

    if (!order) return null;

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

    const handleDownloadImage = async () => {
        const element = document.getElementById('order-print-template');
        if (!element) return;

        // Clone the element to render it specifically for capture
        // This avoids messing with the actual DOM element's styles or visibility
        const clone = element.cloneNode(true) as HTMLElement;

        // Style the clone to be visible, off-screen, and correct width
        Object.assign(clone.style, {
            display: 'block',
            position: 'fixed',
            top: '-10000px',
            left: '0',
            visibility: 'visible',
            width: '800px', // Standard A4 width approx
            zIndex: '-1',
            background: 'white'
        });

        // Remove classes that might hide it
        clone.classList.remove('hidden', 'print:block');

        document.body.appendChild(clone);

        try {
            const canvas = await html2canvas(clone, {
                scale: 2, // Retina quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 1200
            });

            const link = document.createElement('a');
            link.download = `DON-HANG-${order.readableId || order.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Failed to capture image:", err);
            alert("Lỗi khi xuất ảnh. Vui lòng thử lại.");
        } finally {
            if (document.body.contains(clone)) {
                document.body.removeChild(clone);
            }
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Chi tiết đơn hàng</h2>
                            <p className="text-sm text-slate-500">#{order.readableId || order.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Misa Status in Header */}
                            {(effectiveMisaStatus === 'synced') ? (
                                <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200" title={`Ref: ${effectiveMisaRef}`}>
                                    <div className="w-4 h-4 grid place-items-center bg-blue-600 rounded-full text-white text-[8px]">M</div>
                                    Đã đồng bộ
                                </div>
                            ) : (effectiveMisaStatus === 'failed') ? (
                                <div className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200" title={effectiveMisaError}>
                                    <AlertOctagon className="w-3.5 h-3.5" />
                                    Lỗi Sync
                                </div>
                            ) : null}

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
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
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Ngày đặt hàng</p>
                                    <p className="text-sm font-semibold text-slate-900 capitalize">
                                        {formatDate(order.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col items-end">
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Trạng thái</p>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                            order.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                        {order.status === 'pending' ? 'Chờ xác nhận' :
                                            order.status === 'processing' ? 'Đang xử lý' :
                                                order.status === 'delivered' ? 'Đã giao' :
                                                    order.status === 'cancelled' ? 'Đã hủy' : 'Nháp'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
                                <User className="w-4 h-4 text-slate-400" />
                                <h3 className="font-semibold text-sm text-slate-900">Thông tin khách hàng</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{order.customerName}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">{order.receiverPhone || order.customer?.phone || 'Không có sđt'}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-slate-600 leading-snug">
                                        {order.receiverAddress || order.customer?.address || 'Không có địa chỉ'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Products */}
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                                <ShoppingBag className="w-4 h-4 text-slate-500" />
                                <h3 className="font-semibold text-sm text-slate-700">Sản phẩm</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-2 font-medium">Sản phẩm</th>
                                            <th className="px-4 py-2 font-medium text-center">SL</th>
                                            <th className="px-4 py-2 font-medium text-right">Đơn giá</th>
                                            <th className="px-4 py-2 font-medium text-right">Giảm giá</th>
                                            <th className="px-4 py-2 font-medium text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(order.items || []).map((item: any, idx: number) => {
                                            const isGiftItem = item.isGift || item.is_gift;
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium text-slate-900">
                                                        {isGiftItem && <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 mr-2">QUÀ</span>}
                                                        {item.product?.name || item.name || 'Sản phẩm'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">
                                                        {formatPrice(item.price || item.unitPrice || 0)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-red-500 font-medium">
                                                        {(item.discount || 0) > 0 ? `-${formatPrice(item.discount)}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                                                        {isGiftItem ? '0 ₫' : formatPrice((item.subtotal && item.subtotal > 0) ? item.subtotal : ((item.price || 0) * item.quantity) - (item.discount || 0))}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t border-slate-200">
                                        <tr>
                                            <td colSpan={4} className="px-4 py-2 text-right text-slate-500 text-xs uppercase tracking-wide">Tổng tiền hàng</td>
                                            <td className="px-4 py-2 text-right font-medium text-slate-700">
                                                {formatPrice((order.items || []).reduce((sum: number, item: any) => sum + ((item.price || 0) * item.quantity), 0))}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan={4} className="px-4 py-2 text-right text-slate-500 text-xs uppercase tracking-wide">Tổng chiết khấu</td>
                                            <td className="px-4 py-2 text-right font-medium text-red-600">
                                                -{formatPrice((order.items || []).reduce((sum: number, item: any) => sum + (item.discount || 0), 0))}
                                            </td>
                                        </tr>
                                        {(order.vat || 0) > 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-2 text-right text-slate-500 text-xs uppercase tracking-wide">VAT</td>
                                                <td className="px-4 py-2 text-right font-medium text-slate-600">
                                                    +{formatPrice(order.vat || 0)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td colSpan={4} className="px-4 py-3 text-right font-bold text-slate-900">Tổng thanh toán</td>
                                            <td className="px-4 py-3 text-right font-bold text-indigo-600 text-lg">
                                                {formatPrice(order.totalAmount)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl print:hidden">
                        <button
                            onClick={handleSyncMisa}
                            disabled={isSyncing} // Force UNLOCKED for Debugging: removed || effectiveMisaStatus === 'synced'
                            className={`px-4 py-2 border rounded-lg font-medium flex items-center gap-2 transition-colors ${effectiveMisaStatus === 'synced'
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' // Changed style to indicate clickable success
                                : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                                }`}
                        >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {effectiveMisaStatus === 'synced' ? 'Đã Sync Misa' : 'Sync Misa'}
                        </button>

                        <button
                            onClick={handleTestConnection}
                            className="px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 font-medium text-sm"
                            title="Kiểm tra kết nối MISA"
                        >
                            Test Misa
                        </button>

                        <button
                            onClick={handleDownloadImage}
                            className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2"
                            title="Tải ảnh đơn hàng"
                        >
                            <ImageIcon className="w-4 h-4" />
                            Tải ảnh
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            In đơn hàng
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Template (Hidden in screen, Visible in Print) */}
            <div className="hidden print:block">
                <OrderPrintTemplate order={order} settings={settings} />
            </div>
        </>
    );
}
