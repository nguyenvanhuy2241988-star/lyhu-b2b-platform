'use client';

import { Wallet, History, ArrowUpRight } from "lucide-react";

export default function ShipperWalletPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Ví & COD</h1>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                <p className="text-amber-100 text-sm font-medium mb-1">Tiền COD đang giữ</p>
                <div className="flex items-end gap-2">
                    <h2 className="text-4xl font-bold">2,450,000 đ</h2>
                </div>
                <div className="mt-6 flex gap-3">
                    <button className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 py-2 rounded-lg font-medium text-sm transition">
                        Nộp tiền về CT
                    </button>
                    <button className="flex-1 bg-white text-orange-600 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-50 transition">
                        Chi tiết
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" /> Lịch sử nộp tiền
                </div>
                <div className="divide-y divide-slate-100">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Nộp tiền COD</p>
                                    <p className="text-xs text-slate-500">20/12/2025 - 14:30</p>
                                </div>
                            </div>
                            <span className="font-bold text-red-600">- 5,000,000 đ</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
