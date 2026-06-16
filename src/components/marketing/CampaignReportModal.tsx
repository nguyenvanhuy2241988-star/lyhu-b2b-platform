"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, BarChart3, Clock, DollarSign, MousePointerClick, Activity, Bot } from "lucide-react";
import { fetchFbCampaignInsights } from "@/lib/facebookAdsManager";
import { toast } from "sonner";

interface CampaignReportModalProps {
    campaignId: string;
    campaignName: string;
    accessToken: string;
    onClose: () => void;
}

export function CampaignReportModal({ campaignId, campaignName, accessToken, onClose }: CampaignReportModalProps) {
    const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'this_month' | 'lifetime'>('last_7d');
    const [insights, setInsights] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState<string>("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        loadInsights();
    }, [datePreset]);

    const loadInsights = async () => {
        setIsLoading(true);
        setAiAnalysis(""); // Reset AI on date change
        try {
            const data = await fetchFbCampaignInsights(accessToken, campaignId, datePreset);
            setInsights(data);
        } catch (e: any) {
            toast.error("Không thể tải báo cáo: " + e.message);
            setInsights(null);
        }
        setIsLoading(false);
    };

    const formatCurrency = (val: string | number) => {
        if (!val) return "0 ₫";
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val));
    };

    const handleAiAnalyze = () => {
        if (!insights) return;
        setIsAnalyzing(true);
        
        // Giả lập AI Phân Tích (Mock AI Logic)
        setTimeout(() => {
            const spend = Number(insights.spend || 0);
            const cpc = Number(insights.cpc || 0);
            const ctr = Number(insights.ctr || 0);
            const clicks = Number(insights.clicks || 0);

            let advice = "Dựa trên các chỉ số hiện tại:\\n";
            if (spend === 0) {
                advice += "- Chiến dịch chưa tiêu tiền trong khoảng thời gian này. Hãy kiểm tra lại ngân sách hoặc xem chiến dịch có đang bị Tạm Dừng không.\\n";
            } else {
                if (ctr < 1) {
                    advice += "- ⚠️ Tỷ lệ Click (CTR) đang rất thấp (" + ctr + "%). Hình ảnh hoặc nội dung quảng cáo có thể chưa đủ thu hút, hoặc đang phân phối sai tệp khách hàng. Khuyến nghị: Thay đổi mẫu quảng cáo (Creative) mới.\\n";
                } else if (ctr > 2) {
                    advice += "- ✅ Tỷ lệ Click (CTR) tốt. Khách hàng đang phản hồi tích cực với nội dung.\\n";
                }

                if (cpc > 5000) {
                    advice += "- ⚠️ Giá mỗi click (CPC) đang khá đắt. Nên cân nhắc giới hạn giá thầu hoặc tối ưu lại tệp đối tượng.\\n";
                } else if (cpc > 0 && cpc <= 2000) {
                    advice += "- ✅ Giá mỗi click (CPC) đang rất rẻ. Đây là chiến dịch hiệu quả, khuyến nghị TĂNG NGÂN SÁCH (Scale up) để tối đa hóa chuyển đổi.\\n";
                }
            }
            setAiAnalysis(advice);
            setIsAnalyzing(false);
            toast.success("AI đã phân tích xong!");
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-indigo-600" />
                            Phân tích & Tối ưu Chiến dịch
                        </h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Chiến dịch: <span className="text-blue-600">{campaignName}</span> (ID: {campaignId})</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 bg-slate-50 min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-500" />
                                Thời gian:
                            </label>
                            <select 
                                className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm"
                                value={datePreset}
                                onChange={(e: any) => setDatePreset(e.target.value)}
                            >
                                <option value="today">Hôm nay</option>
                                <option value="yesterday">Hôm qua</option>
                                <option value="last_7d">7 Ngày qua</option>
                                <option value="last_30d">30 Ngày qua</option>
                                <option value="this_month">Tháng này</option>
                                <option value="lifetime">Từ trước đến nay (Trọn đời)</option>
                            </select>
                        </div>
                        <button 
                            onClick={loadInsights}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                        >
                            <Activity className="w-4 h-4" /> Làm mới dữ liệu
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-slate-500">Đang lấy số liệu Real-time từ Facebook API...</p>
                        </div>
                    ) : !insights ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                            <p className="text-slate-500 mb-2">Chưa có dữ liệu cho khoảng thời gian này.</p>
                            <p className="text-xs text-slate-400">Chiến dịch có thể chưa tiêu tiền hoặc dữ liệu Facebook chưa cập nhật.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-medium text-slate-500">Số Tiền Đã Tiêu</p>
                                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><DollarSign className="w-4 h-4" /></div>
                                    </div>
                                    <h4 className="text-2xl font-bold text-slate-800">{formatCurrency(insights.spend)}</h4>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-medium text-slate-500">Lượt Hiển Thị</p>
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TrendingUp className="w-4 h-4" /></div>
                                    </div>
                                    <h4 className="text-2xl font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(insights.impressions || 0)}</h4>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-medium text-slate-500">Số Clicks (Link)</p>
                                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><MousePointerClick className="w-4 h-4" /></div>
                                    </div>
                                    <h4 className="text-2xl font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(insights.clicks || 0)}</h4>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-medium text-slate-500">CPC (Trung bình)</p>
                                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Activity className="w-4 h-4" /></div>
                                    </div>
                                    <h4 className="text-2xl font-bold text-slate-800">{formatCurrency(insights.cpc)}</h4>
                                    <p className="text-xs text-slate-400 mt-1">CTR: {insights.ctr || 0}%</p>
                                </div>
                            </div>

                            {/* AI Optimization Section */}
                            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-1 shadow-lg">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Bot className="w-6 h-6 text-indigo-300" />
                                            Cố Vấn Tối Ưu (AI)
                                        </h4>
                                        <button 
                                            onClick={handleAiAnalyze}
                                            disabled={isAnalyzing}
                                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-lg shadow transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isAnalyzing ? "Đang phân tích dữ liệu..." : "Bắt đầu Phân Tích & Cho Lời Khuyên"}
                                        </button>
                                    </div>
                                    
                                    {aiAnalysis ? (
                                        <div className="bg-white/95 rounded-lg p-5 mt-4 text-slate-800 shadow-inner">
                                            <p className="font-semibold text-indigo-800 mb-2">💡 Báo Cáo Phân Tích Từ Hệ Thống:</p>
                                            <div className="space-y-2">
                                                {aiAnalysis.split('\\n').map((line, idx) => (
                                                    line && <p key={idx} className="text-sm leading-relaxed">{line}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-indigo-200 text-sm mt-2">
                                            Bấm nút phía trên để hệ thống AI đánh giá các chỉ số (CPC, CTR, Spend) và gợi ý chiến lược cho bạn.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
