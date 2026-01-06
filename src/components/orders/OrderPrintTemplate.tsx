import React from 'react';
import { Order } from '@/lib/ordersStore';

interface OrderPrintTemplateProps {
    order: Order;
}

export const OrderPrintTemplate: React.FC<OrderPrintTemplateProps> = ({ order }) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="hidden print:block p-8 bg-white text-black font-sans print-container">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-gray-300 pb-6">
                <div>
                    <h1 className="text-2xl font-bold uppercase mb-2">CÔNG TY TNHH LYHU</h1>
                    <p className="text-sm">Địa chỉ: Số 123, Đường ABC, Quận XYZ, TP.HCM</p>
                    <p className="text-sm">Hotline: 1900 1234 - Email: contact@lyhu.vn</p>
                    <p className="text-sm">Website: www.lyhu.vn</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold uppercase text-indigo-900">ĐƠN ĐẶT HÀNG</h2>
                    <p className="text-sm font-medium mt-1">Mã đơn: {order.readableId || order.code}</p>
                    <p className="text-sm text-gray-600">Ngày tạo: {formatDate(order.createdAt)}</p>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-8">
                <h3 className="font-bold border-b border-gray-200 pb-1 mb-3 uppercase text-sm">Thông tin khách hàng</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p><span className="font-semibold">Khách hàng:</span> {order.customerName}</p>
                        <p className="mt-1"><span className="font-semibold">Điện thoại:</span> {order.receiverPhone || order.customer?.phone || '---'}</p>
                    </div>
                    <div>
                        <p><span className="font-semibold">Địa chỉ:</span> {order.receiverAddress || order.customer?.address || '---'}</p>
                        <p className="mt-1"><span className="font-semibold">Phương thức TT:</span> {order.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : order.paymentMethod === 'BANKING' ? 'Chuyển khoản' : 'Công nợ'}</p>
                    </div>
                </div>
            </div>

            {/* Order Items Table */}
            <div className="mb-8">
                <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-center w-12">STT</th>
                            <th className="border border-gray-300 px-3 py-2 text-left">Tên sản phẩm</th>
                            <th className="border border-gray-300 px-3 py-2 text-center w-20">ĐVT</th>
                            <th className="border border-gray-300 px-3 py-2 text-center w-20">SL</th>
                            <th className="border border-gray-300 px-3 py-2 text-right w-28">Đơn giá</th>
                            <th className="border border-gray-300 px-3 py-2 text-right w-28">Chiết khấu</th>
                            <th className="border border-gray-300 px-3 py-2 text-right w-32">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(order.items || []).map((item, index) => (
                            <tr key={index}>
                                <td className="border border-gray-300 px-3 py-2 text-center">{index + 1}</td>
                                <td className="border border-gray-300 px-3 py-2">
                                    {item.product?.name || item.name}
                                    {item.isGift ? <span className="ml-2 text-xs font-bold uppercase">(Quà tặng)</span> : ''}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-center">{item.unit || 'Cái'}</td>
                                <td className="border border-gray-300 px-3 py-2 text-center">{item.quantity}</td>
                                <td className="border border-gray-300 px-3 py-2 text-right">{formatPrice(item.price || item.unitPrice || 0)}</td>
                                <td className="border border-gray-300 px-3 py-2 text-right text-red-600">
                                    {item.discount > 0 ? `-${formatPrice(item.discount)}` : '-'}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                                    {formatPrice(item.subtotal || ((item.price || 0) * item.quantity))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Tổng tiền hàng:</span>
                        <span className="font-medium">
                            {formatPrice((order.items || []).reduce((sum: number, item: any) => sum + ((item.price || 0) * item.quantity), 0))}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tổng chiết khấu:</span>
                        <span className="font-medium text-red-600">
                            -{formatPrice((order.items || []).reduce((sum: number, item: any) => sum + (item.discount || 0), 0))}
                        </span>
                    </div>
                    {order.vat > 0 && (
                        <div className="flex justify-between">
                            <span>VAT:</span>
                            <span className="font-medium">+{formatPrice(order.vat)}</span>
                        </div>
                    )}
                    <div className="border-t border-gray-300 my-2"></div>
                    <div className="flex justify-between text-base font-bold">
                        <span>Tổng thanh toán:</span>
                        <span>{formatPrice(order.totalAmount)}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Signatures */}
            <div className="grid grid-cols-2 gap-8 text-center text-sm mt-12 page-break-inside-avoid">
                <div>
                    <p className="font-bold mb-16">Người lập phiếu</p>
                    <p className="italic text-gray-500">(Ký, ghi rõ họ tên)</p>
                </div>
                <div>
                    <p className="font-bold mb-16">Khách hàng</p>
                    <p className="italic text-gray-500">(Ký, xác nhận)</p>
                </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-500">
                <p>Cảm ơn quý khách đã tin tưởng và ủng hộ LYHU!</p>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: A4; }
                    body { -webkit-print-color-adjust: exact; }
                    .print-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 9999; }
                    /* Hide everything else */
                    body > *:not(.print-container) { display: none !important; }
                }
            `}</style>
        </div>
    );
};
