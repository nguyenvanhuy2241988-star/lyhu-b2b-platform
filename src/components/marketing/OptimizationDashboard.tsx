"use client";

import { useState } from 'react';
import { Bot, Play, Pause, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, X, Filter, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface OptimizationDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    accessToken: string;
    adAccountId: string;
}

export default function OptimizationDashboard({ isOpen, onClose, accessToken, adAccountId }: OptimizationDashboardProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [rawCount, setRawCount] = useState(0);

    // Filters
    const [objectiveFilter, setObjectiveFilter] = useState('messages');
    const [timeFilter, setTimeFilter] = useState('since_oct_2025');
    const [statusFilter, setStatusFilter] = useState('ACTIVE');
    const [sortBy, setSortBy] = useState('spend_desc');
    const [sinceDate, setSinceDate] = useState('2025-10-01');
    const [untilDate, setUntilDate] = useState(new Date().toISOString().split('T')[0]);

    if (!isOpen) return null;

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setHasAnalyzed(false);
        try {
            let actualTimeRange = timeFilter;
            if (timeFilter === 'custom') {
                actualTimeRange = `custom_${sinceDate}_${untilDate}`;
            }

            const res = await fetch(`/api/marketing/auto-optimize?t=${Date.now()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    accessToken, 
                    adAccountId,
                    objectiveFilter,
                    timeRange: actualTimeRange,
                    statusFilter
                })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Lỗi phân tích');
            
            // Map the current budgets from rawAdSets to recommendations
            const enhancedRecommendations = data.data.map((rec: any) => {
                const matchedRaw = data.rawAdSets?.find((r: any) => r.id === rec.id);
                return {
                    ...rec,
                    current_budget: matchedRaw?.daily_budget || "0",
                    cost_per_message: matchedRaw?.cost_per_message || 0,
                    spend: matchedRaw?.spend || 0,
                    messages: matchedRaw?.messages || 0,
                    phone_count: matchedRaw?.phone_count || 0,
                    phone_rate: matchedRaw?.phone_rate || 0,
                    cost_per_phone: matchedRaw?.cost_per_phone || 0
                };
            });

            let sortedRecommendations = [...enhancedRecommendations];
            if (sortBy === 'spend_desc') sortedRecommendations.sort((a, b) => b.spend - a.spend);
            if (sortBy === 'spend_asc') sortedRecommendations.sort((a, b) => a.spend - b.spend);
            if (sortBy === 'messages_desc') sortedRecommendations.sort((a, b) => b.messages - a.messages);
            if (sortBy === 'phones_desc') sortedRecommendations.sort((a, b) => b.phone_count - a.phone_count);
            if (sortBy === 'cpm_desc') sortedRecommendations.sort((a, b) => b.cost_per_message - a.cost_per_message);
            if (sortBy === 'cpp_desc') sortedRecommendations.sort((a, b) => b.cost_per_phone - a.cost_per_phone);

            setRawCount(data.rawAdSets?.length || 0);
            setRecommendations(sortedRecommendations);
            setHasAnalyzed(true);
            toast.success('AI đã phân tích xong toàn bộ tài khoản!');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleExportCSV = () => {
        if (!recommendations || recommendations.length === 0) {
            toast.error("Không có dữ liệu để xuất");
            return;
        }

        const headers = ["Tên Nhóm QC", "Quyết định AI", "Lý do", "Chi tiêu (VND)", "Tin nhắn", "Giá/Tin", "Số SĐT", "Giá/SĐT"];
        
        const rows = recommendations.map(r => [
            `"${r.name.replace(/"/g, '""')}"`,
            r.action,
            `"${r.reason.replace(/"/g, '""')}"`,
            r.spend || 0,
            r.messages || 0,
            r.cost_per_message || 0,
            r.phone_count || 0,
            r.cost_per_phone || 0
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Bot_AI_Optimization_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Đã xuất file báo cáo!");
    };

    const handleExecute = async () => {
        setIsExecuting(true);
        try {
            const res = await fetch('/api/marketing/execute-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    accessToken, 
                    optimizations: recommendations 
                })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Lỗi thực thi');
            
            toast.success('Đã thực thi thành công các quy tắc tối ưu!');
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Bot className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">AI Media Buyer</h2>
                            <p className="text-sm text-slate-500">Tự động phân tích và tối ưu quảng cáo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {!hasAnalyzed ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-50 mb-6">
                                <TrendingUp className="w-10 h-10 text-purple-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Sẵn sàng tối ưu</h3>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                Cài đặt bộ lọc để AI tập trung vào đúng các chiến dịch bạn muốn đánh giá.
                            </p>

                            <div className="max-w-md mx-auto bg-slate-50 p-5 rounded-xl border border-slate-200 mb-8 text-left space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                            <Filter className="w-4 h-4" /> Trạng thái
                                        </label>
                                        <select 
                                            className="w-full border-slate-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="ACTIVE">Đang chạy</option>
                                            <option value="PAUSED">Đang tắt</option>
                                            <option value="ALL">Tất cả trạng thái</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" /> Sắp xếp theo
                                        </label>
                                        <select 
                                            className="w-full border-slate-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <option value="spend_desc">Chi phí (Cao &gt; Thấp)</option>
                                            <option value="spend_asc">Chi phí (Thấp &gt; Cao)</option>
                                            <option value="messages_desc">Nhiều Tin nhắn nhất</option>
                                            <option value="phones_desc">Nhiều Số ĐT nhất</option>
                                            <option value="cpm_desc">Giá/Tin đắt nhất</option>
                                            <option value="cpp_desc">Giá/SĐT đắt nhất</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <Filter className="w-4 h-4" /> Mục tiêu quảng cáo
                                    </label>
                                    <select 
                                        className="w-full border-slate-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        value={objectiveFilter}
                                        onChange={(e) => setObjectiveFilter(e.target.value)}
                                    >
                                        <option value="messages">Chỉ chiến dịch Tin Nhắn</option>
                                        <option value="conversions">Chỉ chiến dịch Chuyển đổi</option>
                                        <option value="all">Tất cả mục tiêu</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Thời gian phân tích
                                    </label>
                                    <select 
                                        className="w-full border-slate-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500 mb-2"
                                        value={timeFilter}
                                        onChange={(e) => setTimeFilter(e.target.value)}
                                    >
                                        <option value="maximum">Toàn thời gian (Lifetime)</option>
                                        <option value="since_oct_2025">Từ tháng 10/2025 trở đi</option>
                                        <option value="last_30d">30 ngày qua</option>
                                        <option value="this_month">Tháng này</option>
                                        <option value="custom">Tùy chỉnh khoảng thời gian</option>
                                    </select>

                                    {timeFilter === 'custom' && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <input 
                                                type="date" 
                                                className="flex-1 border-slate-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                                                value={sinceDate}
                                                onChange={(e) => setSinceDate(e.target.value)}
                                            />
                                            <span className="text-slate-500">-</span>
                                            <input 
                                                type="date" 
                                                className="flex-1 border-slate-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                                                value={untilDate}
                                                onChange={(e) => setUntilDate(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang phân tích dữ liệu FB...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5" />
                                        Bắt đầu Quét & Phân tích
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-slate-800">Đề xuất từ chuyên gia AI</h3>
                                    <span className="text-xs text-slate-400">Đã quét {rawCount} nhóm quảng cáo từ Facebook</span>
                                </div>
                                <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                    {recommendations.length} nhóm cần tối ưu
                                </span>
                            </div>

                            <div className="grid gap-4">
                                {recommendations.map((rec, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border ${
                                        rec.action === 'SCALE_UP' ? 'border-green-200 bg-green-50' :
                                        rec.action === 'PAUSE' ? 'border-red-200 bg-red-50' :
                                        'border-slate-200 bg-white'
                                    }`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {rec.action === 'SCALE_UP' && <TrendingUp className="w-5 h-5 text-green-600" />}
                                                    {rec.action === 'PAUSE' && <Pause className="w-5 h-5 text-red-600" />}
                                                    {rec.action === 'MAINTAIN' && <CheckCircle2 className="w-5 h-5 text-slate-400" />}
                                                    <h4 className="font-bold text-slate-900">{rec.name}</h4>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-3">{rec.reason}</p>
                                                
                                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap">
                                                    <span>Chi tiêu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rec.spend)}</span>
                                                    <span>Tin nhắn: {rec.messages}</span>
                                                    <span className={rec.cost_per_message < 20000 && rec.messages > 0 ? "text-green-600" : rec.cost_per_message > 35000 ? "text-red-600" : ""}>
                                                        Giá/Tin: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rec.cost_per_message)}
                                                    </span>
                                                    <div className="w-px h-3 bg-slate-300"></div>
                                                    <span className="text-blue-600 font-bold">Số ĐT thu về: {rec.phone_count || 0}</span>
                                                    <span className="text-purple-600 font-bold">Tỉ lệ SĐT: {((rec.phone_rate || 0) * 100).toFixed(1)}%</span>
                                                    <span className={rec.cost_per_phone < 50000 && rec.phone_count > 0 ? "text-green-600 font-bold" : "text-red-600"}>
                                                        Giá/SĐT: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rec.cost_per_phone || 0)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {rec.action === 'SCALE_UP' && (
                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-500 line-through mb-1">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rec.current_budget)}
                                                        </p>
                                                        <p className="text-sm font-bold text-green-600">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rec.current_budget * 1.2)} (+20%)
                                                        </p>
                                                    </div>
                                                )}
                                                {rec.action === 'PAUSE' && (
                                                    <span className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-lg text-sm">
                                                        TẮT CAMP
                                                    </span>
                                                )}
                                                {rec.action === 'MAINTAIN' && (
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold rounded-lg text-sm">
                                                        GIỮ NGUYÊN
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {recommendations.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        AI không tìm thấy quảng cáo nào cần tối ưu lúc này.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {hasAnalyzed && recommendations.length > 0 && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Bấm "Thực thi" để áp dụng các thay đổi này vào Tài khoản Facebook của bạn.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleExportCSV}
                                className="px-5 py-2.5 text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl font-medium transition-colors"
                            >
                                Xuất Excel
                            </button>
                            <button 
                                onClick={() => setHasAnalyzed(false)}
                                className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                            >
                                Quét lại
                            </button>
                            <button 
                                onClick={handleExecute}
                                disabled={isExecuting}
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isExecuting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang cập nhật FB...
                                    </>
                                ) : (
                                    <>
                                        Thực thi ngay <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
