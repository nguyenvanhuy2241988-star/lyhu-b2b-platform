'use client';

import React, { useState } from "react";
import { CheckCircle2, XCircle, ArrowLeft, History, MapPin, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

const TRIP_HISTORY = [
    { id: 'ORD-7721', customer: 'Trần Văn A', address: 'Số 10, Ngõ 5, Cầu Giấy, Hà Nội', time: '20/12/2025 10:15', cod: 250000, status: 'success' },
    { id: 'ORD-8812', customer: 'Lê Thị B', address: 'Tòa nhà Landmark 72, Nam Từ Liêm', time: '20/12/2025 11:30', cod: 0, status: 'success' },
    { id: 'ORD-9911', customer: 'Hoàng Văn C', address: 'Chung cư Times City, Hai Bà Trưng', time: '19/12/2025 14:20', cod: 1200000, status: 'failed', reason: 'Khách hẹn lại ngày hôm sau' },
    { id: 'ORD-9915', customer: 'Phạm Hồng Nhung', address: '45 Lê Duẩn, Hoàn Kiếm, Hà Nội', time: '19/12/2025 16:45', cod: 540000, status: 'success' },
];

export default function ShipperHistoryPage() {
    const router = useRouter();
    const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

    const filteredTrips = TRIP_HISTORY.filter(t => {
        if (filter === 'all') return true;
        return t.status === filter;
    });

    const successCount = TRIP_HISTORY.filter(t => t.status === 'success').length;
    const failedCount = TRIP_HISTORY.filter(t => t.status === 'failed').length;

    return (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                            <History className="w-5 h-5 text-[#00AFA9]" /> Lịch sử giao hàng
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                            Chi tiết các đơn hàng và chuyến đi đã thực hiện
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                    {[
                        { key: 'all', label: `Tất cả (${TRIP_HISTORY.length})` },
                        { key: 'success', label: `Thành công (${successCount})` },
                        { key: 'failed', label: `Thất bại (${failedCount})` },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                filter === tab.key
                                    ? 'bg-[#00AFA9] text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* History Cards List */}
            <div className="space-y-3">
                {filteredTrips.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">{item.customer}</h4>
                                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                        #{item.id}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                    <Calendar className="w-3 h-3" />
                                    {item.time}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    item.status === 'success'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                    {item.status === 'success' ? (
                                        <>
                                            <CheckCircle2 className="w-3 h-3" /> Giao thành công
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-3 h-3" /> Thất bại
                                        </>
                                    )}
                                </span>
                                <div className="mt-1 font-bold text-slate-900 text-xs sm:text-sm">
                                    {item.cod > 0 ? `COD: ${item.cod.toLocaleString('vi-VN')} đ` : 'Đã thanh toán trước'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <MapPin className="w-3.5 h-3.5 text-[#00AFA9] shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{item.address}</span>
                        </div>

                        {item.reason && (
                            <p className="text-[11px] text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">
                                Lý do: {item.reason}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
