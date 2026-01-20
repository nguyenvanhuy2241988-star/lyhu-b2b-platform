import React from 'react';
import { Order } from '@/lib/ordersStore';
import { COMPANY_INFO, CompanyInfo, BankAccount } from '@/lib/companyConfig';

interface OrderPrintTemplateProps {
    order: Order & { note?: string; paymentStatus?: string };
    settings?: {
        company_info: CompanyInfo;
        bank_info: BankAccount[];
    };
}

export const OrderPrintTemplate: React.FC<OrderPrintTemplateProps> = ({ order, settings }) => {
    // Use dynamic settings if available, otherwise fallback to static config
    const company = settings?.company_info || COMPANY_INFO;
    const bankAccounts = settings?.bank_info || COMPANY_INFO.bankAccounts;

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
        <div id="order-print-template" className="hidden print:block p-8 bg-white text-black font-sans print-container">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b border-gray-300 pb-6">
                <div>
                    <h1 className="text-xl font-bold uppercase mb-2 text-indigo-900">{company.name}</h1>
                    <p className="text-sm">Địa chỉ: {company.address}</p>
                    <p className="text-sm">Hotline: {company.hotline} - Email: {company.email}</p>
                    <p className="text-sm">Website: {company.website}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold uppercase text-indigo-900">ĐƠN ĐẶT HÀNG</h2>
                    <p className="text-base font-bold text-gray-800 mt-1">Mã đơn: {order.readableId || order.id}</p>
                    <p className="text-sm text-gray-600">Ngày tạo: {formatDate(order.createdAt)}</p>
                    {order.creatorName && <p className="text-sm text-gray-600">Người tạo: <span className="font-semibold">{order.creatorName}</span></p>}
                    <div className="mt-2 inline-block px-3 py-1 border border-gray-300 rounded text-sm font-semibold">
                        {order.status === 'delivered' ? 'Đã giao hàng' :
                            order.status === 'cancelled' ? 'Đã hủy' : 'Đơn hàng mới'}
                    </div>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6">
                <h3 className="font-bold border-b border-gray-200 pb-1 mb-3 uppercase text-sm text-gray-700">Thông tin khách hàng</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div>
                        <p className="flex justify-between"><span className="text-gray-600 w-24">Khách hàng:</span> <span className="font-semibold flex-1">{order.customerName}</span></p>
                        <p className="flex justify-between mt-1"><span className="text-gray-600 w-24">Điện thoại:</span> <span className="flex-1">{order.receiverPhone || order.customer?.phone || '---'}</span></p>
                    </div>
                    <div>
                        <p className="flex justify-between"><span className="text-gray-600 w-28">Địa chỉ:</span> <span className="flex-1">{order.receiverAddress || order.customer?.address || '---'}</span></p>
                        <p className="flex justify-between mt-1"><span className="text-gray-600 w-28">Hình thức TT:</span> <span className="font-semibold flex-1">{order.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : order.paymentMethod === 'BANKING' ? 'Chuyển khoản' : 'Công nợ'}</span></p>
                    </div>
                    {order.notes && (
                        <div className="col-span-2 mt-1">
                            <p className="flex"><span className="text-gray-600 w-24">Ghi chú:</span> <span className="flex-1 italic">{order.notes}</span></p>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Items Table */}
            <div className="mb-6">
                <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gray-100 text-gray-700 font-semibold">
                        <tr>
                            <th className="border border-gray-300 px-2 py-2 text-center w-10">STT</th>
                            <th className="border border-gray-300 px-2 py-2 text-left w-24">Mã SP</th>
                            <th className="border border-gray-300 px-2 py-2 text-left">Tên sản phẩm</th>
                            <th className="border border-gray-300 px-2 py-2 text-center w-16">ĐVT</th>
                            <th className="border border-gray-300 px-2 py-2 text-center w-16">SL</th>
                            <th className="border border-gray-300 px-2 py-2 text-right w-24">Đơn giá</th>
                            <th className="border border-gray-300 px-2 py-2 text-right w-24">Chiết khấu</th>
                            <th className="border border-gray-300 px-2 py-2 text-right w-28">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(order.items || []).map((item: any, index) => (
                            <tr key={index}>
                                <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
                                <td className="border border-gray-300 px-2 py-2 text-gray-600 font-mono text-xs">{item.product?.sku || item.sku || '---'}</td>
                                <td className="border border-gray-300 px-2 py-2">
                                    <div className="font-medium">{item.product?.name || item.name || 'Sản phẩm'}</div>
                                    {(item.isGift || item.is_gift) && <span className="inline-block bg-purple-100 text-purple-800 text-xs px-1 rounded mt-0.5">Quà tặng</span>}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-center">{item.unit || 'Cái'}</td>
                                <td className="border border-gray-300 px-2 py-2 text-center font-semibold">{item.quantity}</td>
                                <td className="border border-gray-300 px-2 py-2 text-right">{formatPrice(item.price || item.unitPrice || 0)}</td>
                                <td className="border border-gray-300 px-2 py-2 text-right text-red-600">
                                    {(item.discount || 0) > 0 ? `-${formatPrice(item.discount || 0)}` : '-'}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-right font-bold">
                                    {(item.isGift || item.is_gift) ? '0 ₫' : formatPrice(item.subtotal || ((item.price || 0) * item.quantity))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary & Bank Info */}
            <div className="flex justify-between items-start mb-8 gap-8">
                {/* Bank Info (Left Side) - Only show if BANKING */}
                <div className="w-1/2">
                    {order.paymentMethod === 'BANKING' && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm">
                            <h4 className="font-bold text-blue-800 mb-2 uppercase text-xs">Thông tin chuyển khoản</h4>
                            <div className="space-y-3">
                                {bankAccounts.map((bank, idx) => (
                                    <div key={idx} className="bg-white p-2 rounded border border-blue-100">
                                        <p className="font-bold text-gray-800">{bank.bankName}</p>
                                        <p className="flex justify-between mt-1"><span className="text-gray-500">Số TK:</span> <span className="font-mono font-bold text-lg text-blue-700">{bank.accountNumber}</span></p>
                                        <p className="flex justify-between"><span className="text-gray-500">Chủ TK:</span> <span className="font-semibold">{bank.accountName}</span></p>
                                        <p className="text-xs text-gray-500 mt-1">Chi nhánh: {bank.branch}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-blue-600 italic">* Nội dung CK: <span className="font-bold">DH {order.readableId || order.id}</span></p>
                        </div>
                    )}
                </div>

                {/* Totals (Right Side) */}
                <div className="w-1/2 space-y-2 text-sm">
                    <div className="flex justify-between py-1">
                        <span className="text-gray-600">Tổng tiền hàng:</span>
                        <span className="font-medium">
                            {formatPrice((order.items || []).reduce((sum: number, item: any) => sum + ((item.price || 0) * item.quantity), 0))}
                        </span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-gray-600">Tổng chiết khấu:</span>
                        <span className="font-medium text-red-600">
                            -{formatPrice((order.items || []).reduce((sum: number, item: any) => sum + (item.discount || 0), 0))}
                        </span>
                    </div>
                    {/* Add VAT row if needed in future */}
                    <div className="border-t border-gray-300 my-2"></div>
                    <div className="flex justify-between text-lg font-bold items-center bg-gray-50 p-2 rounded">
                        <span>Tổng thanh toán:</span>
                        <span className="text-indigo-700">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <div className="text-right text-xs text-gray-500 italic mt-1">
                        (Đã bao gồm VAT nếu có)
                    </div>
                </div>
            </div>

            {/* Footer / Signatures */}
            <div className="grid grid-cols-2 gap-8 text-center text-sm mt-8 page-break-inside-avoid">
                <div>
                    <p className="font-bold mb-16 uppercase text-gray-700">Người lập phiếu</p>
                    <p className="italic text-gray-500">(Ký, ghi rõ họ tên)</p>
                </div>
                <div>
                    <p className="font-bold mb-16 uppercase text-gray-700">Khách hàng xác nhận</p>
                    <p className="italic text-gray-500">(Ký, nhận đủ hàng)</p>
                </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
                <p>Chứng từ này có giá trị xác nhận đơn hàng/giao hàng. Cảm ơn quý khách đã tin tưởng LYHU!</p>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: A4; }
                    body { 
                        -webkit-print-color-adjust: exact; 
                        background: white;
                    }
                    /* Hide everything by default */
                    body > * {
                        display: none;
                    }
                    /* Show print container and make it the only visible root element */
                    /* adjusting hierarchy to ensure Next.js root doesn't interfere */
                    #order-print-template {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        background: white;
                        z-index: 9999;
                    }

                    /* Ensure tables break correctly */
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }

                    /* Hide scrollbars */
                    ::-webkit-scrollbar { display: none; }
                }
            `}</style>
        </div>
    );
};
