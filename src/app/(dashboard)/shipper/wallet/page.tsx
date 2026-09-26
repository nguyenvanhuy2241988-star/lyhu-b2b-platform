'use client';

import React, { useState } from "react";
import { Wallet, History, ArrowUpRight, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ShipperWalletPage() {
    const router = useRouter();
    const [balance, setBalance] = useState(2450000);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleHandoverCOD = () => {
        const confirmed = confirm("Bạn muốn nộp toàn bộ số tiền COD 2.450.000 đ về kế toán công ty?");
        if (!confirmed) return;

        setBalance(0);
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 4000);
    };

    const historyItems = [
        { id: 1, title: "Nộp tiền COD về Kế toán", time: "Hôm nay, 14:30", amount: "- 5.000.000 đ", status: "success" },
        { id: 2, title: "Thu hộ đơn #ORD-7721", time: "Hôm nay, 11:20", amount: "+ 250.000 đ", status: "income" },
        { id: 3, title: "Thu hộ đơn #ORD-9911", time: "Hôm nay, 10:05", amount: "+ 1.200.000 đ", status: "income" },
        { id: 4, title: "Nộp tiền COD về Kế toán", time: "Hôm qua, 17:15", amount: "- 3.800.000 đ", status: "success" },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    title="Quay lại"
                >
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-[#00AFA9]" /> Ví & Thu hộ COD
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Quản lý tiền hàng thu hộ và đối soát với kế toán
                    </p>
                </div>
            </div>

            {/* Notification alert */}
            {isSubmitted && (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Đã gửi yêu cầu nộp tiền COD thành công. Chờ kế toán xác nhận.
                </div>
            )}

            {/* Main Balance Card (Pure Flat with LYHU Brand Teal) */}
            <div className="bg-[#00AFA9] rounded-xl p-5 sm:p-6 text-white border border-[#009b95]">
                <div className="flex items-center justify-between">
                    <span className="text-teal-100 text-xs sm:text-sm font-medium">Tiền thu hộ COD đang giữ</span>
                    <span className="inline-flex items-center gap-1 text-[11px] bg-white/20 px-2 py-0.5 rounded font-semibold text-white">
                        <ShieldCheck className="w-3.5 h-3.5" /> Đối soát ca trực
                    </span>
                </div>
                <div className="mt-2">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        {balance.toLocaleString('vi-VN')} đ
                    </h2>
                </div>
                <p className="text-xs text-teal-100 mt-1">
                    Cập nhật thời gian thực theo từng đơn hàng giao thành công
                </p>

                <div className="mt-5 pt-4 border-t border-white/20 flex flex-col sm:flex-row gap-2.5">
                    <button
                        onClick={handleHandoverCOD}
                        disabled={balance === 0}
                        className="flex-1 py-2.5 px-4 bg-white text-[#00AFA9] hover:bg-slate-50 rounded-xl font-bold text-xs sm:text-sm transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Nộp tiền về Kế toán
                    </button>
                    <button
                        onClick={() => router.push('/shipper/history')}
                        className="flex-1 py-2.5 px-4 bg-teal-800/40 hover:bg-teal-800/60 text-white rounded-xl font-semibold text-xs sm:text-sm transition-colors border border-white/20 text-center"
                    >
                        Lịch sử chuyến đi
                    </button>
                </div>
            </div>

            {/* Transaction History (Pure Flat) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-slate-100 font-bold text-slate-800 text-xs sm:text-sm flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-[#00AFA9]" />
                        Lịch sử biến động COD
                    </div>
                    <span className="text-[11px] text-slate-400 font-normal">Gần đây</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {historyItems.map((item) => (
                        <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg shrink-0 ${
                                    item.status === 'income' ? 'bg-teal-50 text-[#00AFA9]' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-xs sm:text-sm">{item.title}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                                </div>
                            </div>
                            <span className={`font-bold text-xs sm:text-sm ${
                                item.status === 'income' ? 'text-[#00AFA9]' : 'text-rose-600'
                            }`}>
                                {item.amount}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
