'use client';

import React, { useRef } from 'react';
import type { Order } from '@/lib/ordersStore';

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

interface DeliverySlipProps {
    order: Order;
    paperSize?: 'A4' | 'A5';
    onClose: () => void;
}

export default function DeliverySlip({ order, paperSize = 'A4', onClose }: DeliverySlipProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = React.useState(paperSize);

    const handlePrint = () => {
        window.print();
    };

    const items = order.items || [];
    const subtotal = items.reduce((s, i) => s + (i.subtotal || (i.unitPrice || 0) * (i.quantity || 0)), 0);

    return (
        <>
            {/* Print-only styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .delivery-slip-print, .delivery-slip-print * { visibility: visible; }
                    .delivery-slip-print {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print { display: none !important; }
                    @page {
                        size: ${size};
                        margin: 10mm;
                    }
                }
            `}</style>

            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
                <div className="bg-white rounded-2xl shadow-2xl max-w-[700px] w-full max-h-[90vh] overflow-y-auto">
                    {/* Controls */}
                    <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                        <div className="flex items-center gap-3">
                            <h2 className="text-base font-bold text-slate-800">🖨️ Phiếu giao hàng</h2>
                            <select
                                value={size}
                                onChange={(e) => setSize(e.target.value as 'A4' | 'A5')}
                                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-600 bg-slate-50"
                            >
                                <option value="A4">Khổ A4</option>
                                <option value="A5">Khổ A5</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors"
                            >
                                🖨️ In phiếu
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>

                    {/* Printable content */}
                    <div ref={printRef} className="delivery-slip-print p-8" style={{ fontSize: size === 'A5' ? '11px' : '13px' }}>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-slate-800">
                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">LYHU</h1>
                                <p className="text-xs text-slate-500 mt-0.5">Kết nối chân thành - Hợp tác bền vững</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-lg font-bold text-slate-800">PHIẾU GIAO HÀNG</h2>
                                <p className="text-sm text-slate-600 font-semibold mt-0.5">
                                    Đơn #{order.readableId || order.id.slice(0, 8)}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Ngày: {formatDate(order.createdAt)}
                                </p>
                            </div>
                        </div>

                        {/* Customer info */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin khách hàng</p>
                                <p className="font-bold text-slate-800">{order.customerName}</p>
                                {order.receiverPhone && <p className="text-slate-600 mt-1">📞 {order.receiverPhone}</p>}
                                {order.receiverAddress && <p className="text-slate-600 mt-1">📍 {order.receiverAddress}</p>}
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin vận chuyển</p>
                                {order.shippingCarrier && <p className="text-slate-700">🚚 {order.shippingCarrier}</p>}
                                {order.trackingCode && <p className="text-slate-700 mt-1 font-mono font-semibold">Mã vận đơn: {order.trackingCode}</p>}
                                {order.totalBoxes && order.totalBoxes > 0 && <p className="text-slate-700 mt-1">📦 {order.totalBoxes} kiện</p>}
                                {order.totalWeightKg && order.totalWeightKg > 0 && <p className="text-slate-700 mt-1">⚖️ {order.totalWeightKg} kg</p>}
                                {order.paymentMethod && <p className="text-slate-700 mt-1">💳 {order.paymentMethod}</p>}
                            </div>
                        </div>

                        {/* Products table */}
                        <table className="w-full border-collapse mb-6">
                            <thead>
                                <tr className="bg-slate-800 text-white">
                                    <th className="px-3 py-2 text-left font-semibold" style={{ width: '5%' }}>STT</th>
                                    <th className="px-3 py-2 text-left font-semibold" style={{ width: '45%' }}>Sản phẩm</th>
                                    <th className="px-3 py-2 text-center font-semibold" style={{ width: '10%' }}>SL</th>
                                    <th className="px-3 py-2 text-right font-semibold" style={{ width: '20%' }}>Đơn giá</th>
                                    <th className="px-3 py-2 text-right font-semibold" style={{ width: '20%' }}>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => {
                                    const lineTotal = item.subtotal || (item.unitPrice || item.price || 0) * (item.quantity || 0);
                                    return (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                            <td className="px-3 py-2 text-center border-b border-slate-200">{idx + 1}</td>
                                            <td className="px-3 py-2 border-b border-slate-200">
                                                <p className="font-semibold text-slate-800">{item.name || '—'}</p>
                                                {item.sku && <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>}
                                                {item.isGift && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded font-semibold">🎁 Quà tặng</span>}
                                            </td>
                                            <td className="px-3 py-2 text-center border-b border-slate-200 font-semibold">{item.quantity}</td>
                                            <td className="px-3 py-2 text-right border-b border-slate-200">{formatPrice(item.unitPrice || item.price || 0)}</td>
                                            <td className="px-3 py-2 text-right border-b border-slate-200 font-semibold">{formatPrice(lineTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="flex justify-end mb-8">
                            <div className="w-[260px] space-y-2">
                                <div className="flex justify-between text-slate-600">
                                    <span>Tạm tính:</span>
                                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                                </div>
                                {order.shippingFee && order.shippingFee > 0 && (
                                    <div className="flex justify-between text-slate-600">
                                        <span>Phí vận chuyển:</span>
                                        <span className="font-semibold">{formatPrice(order.shippingFee)}</span>
                                    </div>
                                )}
                                {order.vat && order.vat > 0 && (
                                    <div className="flex justify-between text-slate-600">
                                        <span>VAT ({order.vat}%):</span>
                                        <span className="font-semibold">{formatPrice(subtotal * order.vat / 100)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t-2 border-slate-800 text-slate-900">
                                    <span className="font-bold text-base">TỔNG CỘNG:</span>
                                    <span className="font-extrabold text-base">{formatPrice(order.totalAmount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {(order.notes || order.note || order.shippingNote) && (
                            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Ghi chú</p>
                                <p className="text-slate-700 whitespace-pre-line">{order.notes || order.note || order.shippingNote}</p>
                            </div>
                        )}

                        {/* Signature area */}
                        <div className="grid grid-cols-3 gap-8 pt-6 border-t border-slate-300 mt-8">
                            <div className="text-center">
                                <p className="font-bold text-slate-700 mb-1">Người tạo đơn</p>
                                <p className="text-xs text-slate-400 mb-12">{order.creatorName || '—'}</p>
                                <div className="border-t border-dashed border-slate-300 pt-1">
                                    <p className="text-[10px] text-slate-400">(Ký và ghi rõ họ tên)</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-slate-700 mb-1">Người giao hàng</p>
                                <p className="text-xs text-slate-400 mb-12">&nbsp;</p>
                                <div className="border-t border-dashed border-slate-300 pt-1">
                                    <p className="text-[10px] text-slate-400">(Ký và ghi rõ họ tên)</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-slate-700 mb-1">Người nhận hàng</p>
                                <p className="text-xs text-slate-400 mb-12">&nbsp;</p>
                                <div className="border-t border-dashed border-slate-300 pt-1">
                                    <p className="text-[10px] text-slate-400">(Ký và ghi rõ họ tên)</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-8 text-[10px] text-slate-400">
                            <p>LYHU - Kết nối chân thành - Hợp tác bền vững</p>
                            <p>Phiếu được tạo tự động từ hệ thống LYHU CRM</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
