"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, History, Calendar, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchInventoryTransactions, getDefaultWarehouseId } from "@/lib/inventoryStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function WarehouseHistoryPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const data = await fetchInventoryTransactions(undefined, 100); // Fetch last 100 transactions
        setTransactions(data);
        setIsLoading(false);
    };

    // Filter logic
    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.note?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === "all" || t.type === filterType;

        return matchesSearch && matchesType;
    });

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'inbound': return { label: 'Nhập kho', color: 'bg-green-100 text-green-700' };
            case 'outbound': return { label: 'Xuất kho', color: 'bg-red-100 text-red-700' };
            case 'reserve': return { label: 'Giữ hàng', color: 'bg-orange-100 text-orange-700' };
            case 'release': return { label: 'Nhả hàng', color: 'bg-blue-100 text-blue-700' };
            case 'ship': return { label: 'Giao hàng', color: 'bg-purple-100 text-purple-700' };
            default: return { label: type, color: 'bg-gray-100 text-gray-700' };
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-6 h-6 text-indigo-600" />
                        Lịch sử biến động kho
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Xem chi tiết log nhập, xuất, giữ và trả hàng tại kho
                    </p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative max-w-md w-full">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo sản phẩm, SKU, ghi chú..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                    {['all', 'inbound', 'outbound', 'reserve'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterType === type
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {type === 'all' ? 'Tất cả' : type === 'inbound' ? 'Nhập' : type === 'outbound' ? 'Xuất' : 'Giữ hàng'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Thời gian</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Loại GD</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Sản phẩm</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Số lượng</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Ghi chú / Đơn hàng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                            Đang tải dữ liệu...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((t) => {
                                    const { label, color } = getTypeLabel(t.type);
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {format(new Date(t.created_at), 'HH:mm dd/MM/yyyy', { locale: vi })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${color}`}>
                                                    {label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{t.product?.name}</div>
                                                <div className="text-xs text-slate-500">SKU: {t.product?.sku}</div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold text-sm ${['inbound', 'release'].includes(t.type) ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {['inbound', 'release'].includes(t.type) ? '+' : '-'}{Math.abs(t.quantity).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {t.reference_id ? (
                                                    <div className="flex items-center gap-1 text-indigo-600">
                                                        <FileText className="w-3 h-3" />
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
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Không có dữ liệu giao dịch nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
