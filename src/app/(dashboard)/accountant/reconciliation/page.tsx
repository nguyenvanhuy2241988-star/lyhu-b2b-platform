"use client";

import { useState, useMemo } from "react";
import {
    Upload, Search, FileText, CheckCircle2,
    AlertCircle, RefreshCcw, ArrowRightLeft,
    Download, Database, Zap, Loader2
} from "lucide-react";

interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    matchScore: number;
    matchedOrderId?: string;
}

export default function AccountantReconciliationPage() {
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleFileUpload = () => {
        setIsProcessing(true);
        // Mocking bank statement parsing & matching logic
        setTimeout(() => {
            const mockTrans: BankTransaction[] = [
                { id: "TX1", date: "2024-03-20", description: "CHUYEN TIEN DON HANG 13350", amount: 1250000, matchScore: 95, matchedOrderId: "13350" },
                { id: "TX2", date: "2024-03-20", description: "NGUYEN VAN A CK", amount: 500000, matchScore: 40 },
                { id: "TX3", date: "2024-03-21", description: "ORD 13362 THANH TOAN", amount: 2100000, matchScore: 90, matchedOrderId: "13362" },
            ];
            setTransactions(mockTrans);
            setIsProcessing(false);
        }, 1500);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Đối soát Ngân hàng</h1>
                    <p className="text-sm text-slate-600 mt-1">Tự động khớp lệnh chuyển khoản với đơn hàng trên hệ thống</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                        <Download className="w-4 h-4" />
                        Tải file mẫu
                    </button>
                    <label className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer shadow-sm active:scale-95 transition-all">
                        <Upload className="w-4 h-4" />
                        Tải lên Sao kê
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            {/* Reconciliation Workspace */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[500px] overflow-hidden">
                {!transactions.length && !isProcessing ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <ArrowRightLeft className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa có dữ liệu đối soát</h3>
                        <p className="text-sm text-slate-500 max-w-sm mb-8">
                            Tải lên tệp CSV hoặc Excel sao kê từ ngân hàng để bắt đầu quá trình so khớp tự động với các đơn hàng.
                        </p>
                    </div>
                ) : isProcessing ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Đang phân tích và so khớp dữ liệu...</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm giao dịch, nội dung..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <RefreshCcw className="w-3.5 h-3.5" />
                                KHỚP 2/3 GIAO DỊCH
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Giao dịch Ngân hàng</th>
                                        <th className="px-6 py-4">Số tiền</th>
                                        <th className="px-6 py-4">Gợi ý Hệ thống</th>
                                        <th className="px-6 py-4">Độ tin cậy</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{t.description}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{t.date}</div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                {formatCurrency(t.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {t.matchedOrderId ? (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        <span className="font-bold text-slate-800">Đơn hàng #{t.matchedOrderId}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-400 italic text-xs">
                                                        <AlertCircle className="w-4 h-4" />
                                                        Không tìm thấy mã đơn
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${t.matchScore > 80 ? 'bg-emerald-500' : 'bg-orange-400'}`}
                                                            style={{ width: `${t.matchScore}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500">{t.matchScore}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${t.matchedOrderId ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                    }`}>
                                                    {t.matchedOrderId ? "Xác nhận khớp" : "Gán thủ công"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
