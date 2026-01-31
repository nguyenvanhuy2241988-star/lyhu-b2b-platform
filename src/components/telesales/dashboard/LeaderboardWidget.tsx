"use client";

import { Trophy, Flame, Crown, Medal, ChevronLeft, ChevronRight } from "lucide-react";
import { LeaderboardEntry } from "@/lib/engagementStore";

interface LeaderboardWidgetProps {
    leaderboard: LeaderboardEntry[];
    isLoading?: boolean;
    timeFilter?: 'today' | 'week' | 'month' | 'year';
    currentDate?: Date;
    onFilterChange?: (filter: 'today' | 'week' | 'month' | 'year') => void;
    onPrev?: () => void;
    onNext?: () => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const getFilterLabel = (filter: string, date: Date) => {
    const d = new Date(date);
    if (filter === 'today') return `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
    if (filter === 'month') return `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
    if (filter === 'year') return `Năm ${d.getFullYear()}`;

    // Week: Tuần xx
    const start = new Date(d);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
};

export default function LeaderboardWidget({
    leaderboard,
    isLoading,
    timeFilter = 'month',
    currentDate = new Date(),
    onFilterChange,
    onPrev,
    onNext
}: LeaderboardWidgetProps) {
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3, 10); // Show up to top 10

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full animate-pulse">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="h-6 w-48 bg-slate-200 rounded"></div>
                </div>
                <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full ring-1 ring-slate-900/5">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-white">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                        <Trophy className="w-5 h-5" />
                    </div>
                    Bảng vàng
                    <div className="flex items-center bg-white/50 rounded-md border border-slate-200/50 ml-2">
                        <button onClick={onPrev} className="p-1 hover:bg-slate-100 text-slate-500 rounded-l-md"><ChevronLeft size={14} /></button>
                        <span className="text-xs font-semibold px-2 text-slate-700 min-w-[90px] text-center">
                            {getFilterLabel(timeFilter, currentDate)}
                        </span>
                        <button onClick={onNext} className="p-1 hover:bg-slate-100 text-slate-500 rounded-r-md"><ChevronRight size={14} /></button>
                    </div>
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wider animate-pulse">
                    <Flame className="w-3 h-3 fill-orange-500" />
                    Đua top
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-4 py-2 border-b border-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
                {[
                    { key: 'today', label: 'Ngày' },
                    { key: 'week', label: 'Tuần' },
                    { key: 'month', label: 'Tháng' },
                    { key: 'year', label: 'Năm' }
                ].map((opt) => (
                    <button
                        key={opt.key}
                        onClick={() => onFilterChange?.(opt.key as any)}
                        className={`text-[11px] px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap border
                            ${timeFilter === opt.key
                                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <div className="p-2 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                    {/* Top 3 Rendering with Special Styles */}
                    {top3.map((entry, idx) => (
                        <div
                            key={entry.user_id}
                            className={`flex items-center justify-between p-3 rounded-xl transition-all relative overflow-hidden group
                                ${idx === 0 ? 'bg-gradient-to-r from-amber-100/40 via-yellow-50/40 to-amber-100/40 border border-amber-200 shadow-sm' :
                                    idx === 1 ? 'bg-slate-50 border border-slate-200' :
                                        'bg-white border border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                }
                            `}
                        >
                            {/* Decoration for Top 1 */}
                            {idx === 0 && (
                                <div className="absolute top-0 right-0 p-2 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500">
                                    <Crown className="w-16 h-16 text-amber-600 fill-amber-600" />
                                </div>
                            )}

                            <div className="flex items-center gap-4 relative z-10">
                                {/* Rank Icon/Number */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border-2 shrink-0
                                    ${idx === 0 ? 'bg-yellow-400 border-yellow-200 text-white ring-2 ring-yellow-100' :
                                        idx === 1 ? 'bg-slate-300 border-slate-200 text-white' :
                                            'bg-orange-300 border-orange-200 text-white'
                                    }`}>
                                    {idx === 0 ? <Crown className="w-5 h-5 fill-white" /> :
                                        idx === 1 ? <Medal className="w-5 h-5 fill-white" /> :
                                            idx === 2 ? <Medal className="w-5 h-5 fill-white" /> :
                                                idx + 1}
                                </div>

                                {/* User Info */}
                                <div className="min-w-0">
                                    <div className="font-bold text-sm text-slate-900 truncate pr-2 max-w-[150px]">
                                        {entry.user_name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded border border-slate-200/50 text-slate-500 font-semibold tracking-tight">
                                            {entry.total_orders} Deal
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue */}
                            <div className="text-right relative z-10">
                                <div className={`font-bold text-sm ${idx === 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                                    {formatPrice(entry.total_revenue)}
                                </div>
                                {idx === 0 && <div className="text-[9px] text-amber-600/80 font-extrabold uppercase tracking-widest mt-0.5">Quán quân</div>}
                                {idx === 1 && <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Á quân</div>}
                                {idx === 2 && <div className="text-[9px] text-orange-700/60 font-bold uppercase tracking-widest mt-0.5">Quý quân</div>}
                            </div>
                        </div>
                    ))}

                    {/* Rest of Leaderboard */}
                    {rest.length > 0 && <div className="h-px bg-slate-100 my-2 mx-4" />}

                    {rest.map((entry, idx) => (
                        <div key={entry.user_id} className="flex items-center justify-between p-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-6 h-6 flex items-center justify-center font-medium text-xs text-slate-400 bg-slate-100 rounded-full group-hover:bg-slate-200 transition-colors">
                                    {idx + 4}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-sm text-slate-700 truncate">{entry.user_name}</div>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <div className="text-xs text-slate-400">{entry.total_orders} deal</div>
                                <div className="font-semibold text-sm text-slate-900 w-24">{formatPrice(entry.total_revenue)}</div>
                            </div>
                        </div>
                    ))}

                    {leaderboard.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                <Trophy className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium text-sm">Chưa có ai lên bảng vàng</p>
                            <p className="text-slate-400 text-xs mt-1">Hãy là người đầu tiên!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
