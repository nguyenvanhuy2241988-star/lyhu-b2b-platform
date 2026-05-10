"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    fetchAllDebts, CustomerDebt
} from "@/lib/crmDebtsStore";
import {
    Search, Filter, Loader2, DollarSign,
    Users, Wallet, Calendar, AlertCircle,
    ChevronRight, ArrowUpRight, ArrowDownRight,
    TrendingUp, TrendingDown, Clock, CheckCircle2
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AccountantDebtsPage() {
    const { session } = useAuth();
    const [debts, setDebts] = useState<CustomerDebt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllDebts(session?.access_token);
            setDebts(data);
        } catch (err) {
            console.error("Load Debts error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => { loadData(); }, [loadData]);

    const filteredDebts = useMemo(() => {
        return debts.filter(d =>
            d.customerName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [debts, searchQuery]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const totalReceivable = debts.reduce((sum, d) => sum + d.totalDebt, 0);
    const totalOverdue = debts.reduce((sum, d) => sum + d.overdueDebt, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Công nợ B2B</h1>
                    <p className="text-sm text-slate-600 mt-1">Đối soát khoản phải thu và hạn mức tín dụng khách hàng</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
                        <Calendar className="w-4 h-4" />
                        Đối soát MISA
                    </button>
                    <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
                        Gửi nhắc nợ
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">Tổng phải thu (AR)</span>
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalReceivable)}</div>
                    <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">TÀI KHOẢN 131</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">Nợ quá hạn</span>
                        <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
                    <div className="mt-1 text-xs text-red-400 font-medium">Chiếm {(totalOverdue / (totalReceivable || 1) * 100).toFixed(1)}% tổng nợ</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">Khách hàng quá hạn mức</span>
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {debts.filter(d => d.totalDebt > d.creditLimit).length}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">Cần tạm dừng xuất hàng</div>
                </div>
            </div>

            {/* Debt List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm khách hàng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div className="hidden lg:block overflow-x-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        </div>
                    ) : filteredDebts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Wallet className="w-12 h-12 text-slate-200 mb-4" />
                            <p className="text-slate-500">Không có dữ liệu công nợ.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Khách hàng</th>
                                    <th className="px-6 py-4">Tổng nợ</th>
                                    <th className="px-6 py-4">Quá hạn</th>
                                    <th className="px-6 py-4">Hạn mức (Credit)</th>
                                    <th className="px-6 py-4">Sức khỏe</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDebts.map((d) => (
                                    <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{d.customerName}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">Hạn thanh toán: {d.paymentTermDays} ngày</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{formatCurrency(d.totalDebt)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {d.overdueDebt > 0 ? (
                                                <div className="font-bold text-red-600 flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatCurrency(d.overdueDebt)}
                                                </div>
                                            ) : (
                                                <span className="text-emerald-500 text-xs flex items-center gap-1 font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đúng hạn
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {formatCurrency(d.creditLimit)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${d.totalDebt > d.creditLimit ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min((d.totalDebt / d.creditLimit) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1">
                                                Sử dụng {((d.totalDebt / d.creditLimit) * 100).toFixed(0)}% hạn mức
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary-600 hover:text-primary-700 font-bold text-xs flex items-center gap-1 ml-auto">
                                                Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Mobile Card List View */}
                {!isLoading && filteredDebts.length > 0 && (
                    <div className="lg:hidden divide-y divide-slate-100">
                        {filteredDebts.map((d) => (
                            <div key={d.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-900 line-clamp-2">{d.customerName}</div>
                                        <div className="text-[10px] text-slate-400 uppercase mt-0.5">Hạn thanh toán: {d.paymentTermDays} ngày</div>
                                    </div>
                                    <div className="text-right ml-2 flex-shrink-0">
                                        <div className="font-bold text-slate-900 text-base">{formatCurrency(d.totalDebt)}</div>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Trạng thái quá hạn:</span>
                                        {d.overdueDebt > 0 ? (
                                            <div className="font-bold text-red-600 flex items-center gap-1 text-sm bg-red-50 px-2 py-0.5 rounded">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatCurrency(d.overdueDebt)}
                                            </div>
                                        ) : (
                                            <span className="text-emerald-500 text-xs flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Đúng hạn
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="pt-2 border-t border-slate-200/60">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[10px] text-slate-500">Hạn mức ({formatCurrency(d.creditLimit)})</span>
                                            <span className="text-[10px] text-slate-400 font-bold">{((d.totalDebt / d.creditLimit) * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${d.totalDebt > d.creditLimit ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min((d.totalDebt / d.creditLimit) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <button className="w-full py-2.5 bg-white border border-slate-200 text-primary-600 hover:bg-primary-50 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2">
                                    Chi tiết công nợ <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {!isLoading && filteredDebts.length === 0 && (
                    <div className="lg:hidden flex flex-col items-center justify-center py-12 text-center bg-slate-50">
                        <Wallet className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">Không có dữ liệu công nợ.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
