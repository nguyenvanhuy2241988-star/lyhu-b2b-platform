"use client";

import React from "react";
import { DEAL_STAGE_LABELS } from "@/lib/crmDealsStore";
import { FunnelStage } from "@/lib/crmDealsStore";

interface SalesFunnelChartProps {
    data: FunnelStage[];
}

const STAGE_ORDER: Record<string, number> = {
    new_data: 1,
    npp: 2,
    supermarket: 3,
    waiting: 4,
    meeting: 5,
    contract: 6,
    order: 7,
    done: 8,
    cskh: 9,
    issues: 10,
    debt: 11
};

export const SalesFunnelChart = ({ data }: SalesFunnelChartProps) => {
    // Sắp xếp các tầng phễu theo thứ tự logic của quy trình bán hàng
    const sortedData = [...(data || [])].sort((a, b) => {
        const orderA = STAGE_ORDER[a.stage] || 99;
        const orderB = STAGE_ORDER[b.stage] || 99;
        return orderA - orderB;
    });

    const maxCount = Math.max(...sortedData.map(d => d.total_count), 1);

    if (sortedData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-slate-400 text-xs text-center p-6 border border-dashed border-slate-200 rounded-xl">
                <p className="font-semibold text-slate-600">Chưa có dữ liệu phễu cá nhân</p>
                <p className="text-[11px] text-slate-400 mt-1">Các giao dịch phát sinh sẽ tự động được phân tầng tại đây</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-3 py-1">
            {sortedData.map((item, index) => {
                const label = (DEAL_STAGE_LABELS as Record<string, string>)[item.stage] || item.stage;
                const percentage = Math.round((item.total_count / maxCount) * 100);
                const hasValue = item.total_value && item.total_value > 0;

                return (
                    <div key={item.stage || index} className="group">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-700 group-hover:text-[#00AFA9] transition-colors">
                                {label}
                            </span>
                            <div className="flex items-center gap-2">
                                {hasValue && (
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(item.total_value || 0)}
                                    </span>
                                )}
                                <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                    {item.total_count} deal
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                            <div
                                className="h-full bg-[#00AFA9] rounded-full transition-all duration-700 group-hover:bg-[#009690]"
                                style={{ width: `${Math.max(percentage, 6)}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
