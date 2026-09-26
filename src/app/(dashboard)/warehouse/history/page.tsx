"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Search, History, FileText, Loader2, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchInventoryTransactions } from "@/lib/inventoryStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function WarehouseHistoryPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchInventoryTransactions(undefined, 100);
        setTransactions(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.note?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === "all" || t.type === filterType;

        return matchesSearch && matchesType;
    });

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'inbound': return { label: 'Nhập kho', color: 'border border-emerald-200 bg-emerald-50 text-emerald-700' };
            case 'outbound': return { label: 'Xuất kho', color: 'border border-rose-200 bg-rose-50 text-rose-700' };
            case 'reserve': return { label: 'Giữ hàng', color: 'border border-amber-200 bg-amber-50 text-amber-700' };
            case 'release': return { label: 'Nhả hàng', color: 'border border-teal-200 bg-teal-50 text-[#00AFA9]' };
            case 'ship': return { label: 'Giao hàng', color: 'border border-blue-200 bg-blue-50 text-blue-700' };
            default: return { label: type, color: 'border border-slate-200 bg-slate-50 text-slate-700' };
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-[#00AFA9]" />
                        Lịch sử biến động kho
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Nhật ký nhập, xuất, giữ và giao hàng thực tế
                    </p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-slate-500" /> Quay lại
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 justify-between">
                <div className="relative max-w-md w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo sản phẩm, SKU, ghi chú..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#00AFA9] transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar bg-slate-100 p-1 rounded-xl">
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'inbound', label: 'Nhập kho' },
                        { key: 'outbound', label: 'Xuất kho' },
                        { key: 'reserve', label: 'Giữ hàng' }
                    ].map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setFilterType(item.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                filterType === item.key
                                    ? 'bg-[#00AFA9] text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Area */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-[11px]">Thời gian</th>
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-center">Loại GD</th>
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-[11px]">Sản phẩm</th>
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-[11px] text-right">Số lượng</th>
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-[11px]">Ghi chú / Tham chiếu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#00AFA9] mb-2" />
                                        <p className="text-xs">Đang tải lịch sử giao dịch...</p>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((t) => {
                                    const { label, color } = getTypeLabel(t.type);
                                    const isInflow = ['inbound', 'release'].includes(t.type);
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5 text-slate-600 text-xs">
                                                {format(new Date(t.created_at), 'HH:mm dd/MM/yyyy', { locale: vi })}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${color}`}>
                                                    {label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-semibold text-slate-900">{t.product?.name}</div>
                                                <div className="text-[10px] font-mono text-slate-400">SKU: {t.product?.sku}</div>
                                            </td>
                                            <td className={`px-5 py-3.5 text-right font-bold text-xs sm:text-sm ${
                                                isInflow ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                                {isInflow ? '+' : '-'}{Math.abs(t.quantity).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600 text-xs">
                                                {t.reference_id ? (
                                                    <div className="flex items-center gap-1 text-[#00AFA9] font-medium">
                                                        <FileText className="w-3.5 h-3.5 shrink-0" />
                                                        <span>Ref: {t.reference_id.substring(0, 8)}...</span>
                                                    </div>
                                                ) : (
                                                    <span>{t.note || '-'}</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs">
                                        Không có dữ liệu giao dịch nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="py-16 text-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#00AFA9] mb-2" />
                            <p className="text-xs">Đang tải lịch sử giao dịch...</p>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                            Không có dữ liệu giao dịch nào phù hợp
                        </div>
                    ) : (
                        filteredTransactions.map((t) => {
                            const { label, color } = getTypeLabel(t.type);
                            const isInflow = ['inbound', 'release'].includes(t.type);

                            return (
                                <div key={t.id} className="p-3.5 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${color}`}>
                                                {label}
                                            </span>
                                            <span className="text-[11px] text-slate-400 ml-2">
                                                {format(new Date(t.created_at), 'HH:mm dd/MM/yyyy', { locale: vi })}
                                            </span>
                                        </div>
                                        <div className={`font-bold text-sm ${isInflow ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {isInflow ? '+' : '-'}{Math.abs(t.quantity).toLocaleString('vi-VN')}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-1">{t.product?.name}</p>
                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">SKU: {t.product?.sku}</p>
                                    </div>

                                    <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-50">
                                        <span className="truncate">{t.note || 'Không có ghi chú'}</span>
                                        {t.reference_id && (
                                            <span className="text-[#00AFA9] font-medium shrink-0 ml-2">
                                                Ref: {t.reference_id.substring(0, 8)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
