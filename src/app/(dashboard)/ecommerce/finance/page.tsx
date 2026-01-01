'use client';

import { DollarSign, Upload, FileText, CheckCircle, AlertCircle, Filter } from 'lucide-react';

const TRANSACTIONS = [
    { id: 'TRX-001', orderId: 'ORD-SHP-9921', source: 'Shopee', amount: 1250000, type: 'COD', status: 'MATCHED', date: '21/12/2025' },
    { id: 'TRX-002', orderId: 'ORD-TOK-8812', source: 'TikTok', amount: 850000, type: 'Bank Transfer', status: 'PENDING', date: '21/12/2025' },
    { id: 'TRX-003', orderId: 'ORD-WEB-1122', source: 'Web', amount: 2100000, type: 'Bank Transfer', status: 'MISMATCH', date: '20/12/2025' },
    { id: 'TRX-004', orderId: 'ORD-FB-3341', source: 'Facebook', amount: 550000, type: 'COD', status: 'MATCHED', date: '20/12/2025' },
];

export default function EcommerceFinancePage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Đối soát Tài chính</h1>
                    <p className="text-slate-500">Quản lý dòng tiền và đối soát COD/Chuyển khoản</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 bg-white shadow-sm">
                        <Upload className="w-4 h-4" />
                        Nhập sao kê
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-sm font-medium">
                        <FileText className="w-4 h-4" />
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium">Đã đối soát (Tháng này)</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">45,200,000 đ</h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium">Chờ đối soát</p>
                    <h3 className="text-2xl font-bold text-orange-600 mt-1">12,850,000 đ</h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium">Lệch / Cần kiểm tra</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1">2,100,000 đ</h3>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex gap-3 items-center bg-slate-50/50">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:text-violet-600">
                        <Filter className="w-4 h-4" /> Lọc trạng thái
                    </button>
                    <div className="ml-auto text-sm text-slate-500">Hiển thị 4 giao dịch mới nhất</div>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-6 py-3 font-medium">Mã GD</th>
                            <th className="px-6 py-3 font-medium">Mã Đơn hàng</th>
                            <th className="px-6 py-3 font-medium">Kênh</th>
                            <th className="px-6 py-3 font-medium">Ngày</th>
                            <th className="px-6 py-3 font-medium">Loại</th>
                            <th className="px-6 py-3 font-medium">Số tiền</th>
                            <th className="px-6 py-3 font-medium">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {TRANSACTIONS.map(trx => (
                            <tr key={trx.id} className="hover:bg-slate-50/80">
                                <td className="px-6 py-4 font-medium text-slate-900">{trx.id}</td>
                                <td className="px-6 py-4 text-violet-600 cursor-pointer hover:underline">{trx.orderId}</td>
                                <td className="px-6 py-4 text-slate-700">{trx.source}</td>
                                <td className="px-6 py-4 text-slate-500">{trx.date}</td>
                                <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-medium">{trx.type}</span></td>
                                <td className="px-6 py-4 font-bold text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trx.amount)}</td>
                                <td className="px-6 py-4">
                                    {trx.status === 'MATCHED' && <span className="flex items-center gap-1 text-green-600 text-xs font-bold uppercase"><CheckCircle className="w-4 h-4" /> Khớp</span>}
                                    {trx.status === 'PENDING' && <span className="flex items-center gap-1 text-orange-600 text-xs font-bold uppercase"><AlertCircle className="w-4 h-4" /> Chờ</span>}
                                    {trx.status === 'MISMATCH' && <span className="flex items-center gap-1 text-red-600 text-xs font-bold uppercase"><AlertCircle className="w-4 h-4" /> Lệch</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
