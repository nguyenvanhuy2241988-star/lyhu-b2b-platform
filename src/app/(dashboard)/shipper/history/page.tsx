'use client';

import { CheckCircle, XCircle } from "lucide-react";

export default function ShipperHistoryPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Lịch sử giao hàng</h1>

            <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-900">#ORD-OLD-{i}02</h4>
                                {i % 4 === 0 ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">Failed</span>
                                ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-600">Success</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500">Giao lúc: 20/12/2025 10:0{i}</p>
                        </div>
                        {i % 4 === 0 ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
