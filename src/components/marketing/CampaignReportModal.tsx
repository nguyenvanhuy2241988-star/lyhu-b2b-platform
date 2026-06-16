"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, BarChart3, Clock, DollarSign, MousePointerClick, Activity, Bot, Image as ImageIcon, Users, MapPin, Target, PlayCircle, Tag } from "lucide-react";
import { fetchFbCampaignInsights, fetchFbCampaignDetails } from "@/lib/facebookAdsManager";
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
    const [details, setDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState<string>("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        loadData();
    }, [datePreset]);

    const loadData = async () => {
        setIsLoading(true);
        setAiAnalysis("");
        try {
            const [insightData, detailData] = await Promise.all([
                fetchFbCampaignInsights(accessToken, campaignId, datePreset),
                fetchFbCampaignDetails(accessToken, campaignId)
            ]);
            setInsights(insightData);
            setDetails(detailData);
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

    // Extract targeting info from AdSet
    const adSet = details?.adSets?.[0];
    const targeting = adSet?.targeting;
    const countries = targeting?.geo_locations?.countries?.join(", ") || "Chưa xác định";
    const ageMin = targeting?.age_min || 18;
    const ageMax = targeting?.age_max || 65;

    // Extract creative info from Ads
    const ad = details?.ads?.[0];
    const creative = ad?.creative;
    const adBody = creative?.body || creative?.object_story_spec?.link_data?.message || creative?.object_story_spec?.video_data?.message || creative?.asset_feed_spec?.bodies?.[0]?.text || "Không có nội dung text";
    
    // Attempt to extract image from various possible Facebook API structures
    const adImageUrl = creative?.image_url 
        || creative?.thumbnail_url
        || creative?.object_story_spec?.link_data?.picture 
        || creative?.object_story_spec?.video_data?.image_url 
        || creative?.asset_feed_spec?.images?.[0]?.url
        || creative?.asset_feed_spec?.video_titles?.[0]?.url;
        
    const isVideo = creative?.video_id || creative?.object_story_spec?.video_data || creative?.asset_feed_spec?.videos?.length > 0 || false;

    // Extract Campaign Info
    const objective = details?.campaign?.objective || "Chưa xác định";
    const formatObjective = (obj: string) => {
        const map: any = {
            'OUTCOME_TRAFFIC': 'Lưu lượng truy cập (Traffic)',
            'OUTCOME_ENGAGEMENT': 'Lượt tương tác (Tin nhắn/Bình luận)',
            'OUTCOME_SALES': 'Doanh số (Sales)',
            'OUTCOME_LEADS': 'Khách hàng tiềm năng (Leads)',
            'OUTCOME_AWARENESS': 'Mức độ nhận biết (Awareness)'
        };
        return map[obj] || obj;
    };

    // Advanced Metrics
    const reach = insights?.reach || 0;
    const frequency = insights?.frequency || 0;
    const cprObj = insights?.cost_per_action_type?.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
    const cpr = cprObj?.value ? formatCurrency(cprObj.value) : (insights?.cpc ? formatCurrency(insights.cpc) : "N/A");

    const handleAiAnalyze = () => {
        if (!insights) return;
        setIsAnalyzing(true);
        
        setTimeout(() => {
            const spend = Number(insights.spend || 0);
            const cpc = Number(insights.cpc || 0);
            const ctr = Number(insights.ctr || 0);

            let advice = "💡 Báo Cáo Phân Tích Chuyên Sâu (Deep Analytics):\\n\\n";
            advice += `👥 Về Đối Tượng: Quảng cáo đang nhắm đến độ tuổi ${ageMin}-${ageMax} tại ${countries}. Tần suất hiển thị (Frequency) là ${Number(frequency).toFixed(2)}. `;
            if (Number(frequency) > 2.5) {
                advice += "Tần suất khá cao, tệp khách hàng bắt đầu bị 'nhàm', nên làm mới hình ảnh hoặc nới lỏng target.\\n";
            } else {
                advice += "Tần suất an toàn, khách hàng mới tiếp cận nội dung khoảng 1-2 lần.\\n";
            }

            advice += `\\n📊 Về Hiệu Quả: \\n`;
            if (spend === 0) {
                advice += "- Chiến dịch chưa cắn tiền. Hãy kiểm tra lại trạng thái chiến dịch hoặc thử tăng giá thầu.\\n";
            } else {
                if (ctr < 1) {
                    advice += `- ⚠️ Tỷ lệ Click (CTR = ${ctr}%) ĐANG RẤT THẤP. Hình ảnh/Nội dung hiện tại ("${adBody.substring(0,20)}...") không đủ sức hút. Khuyến nghị: Thay đổi mẫu quảng cáo gấp.\\n`;
                } else {
                    advice += `- ✅ Tỷ lệ Click (CTR = ${ctr}%) tốt. Khách hàng hứng thú với hình ảnh và nội dung này.\\n`;
                }

                if (cpc > 5000) {
                    advice += `- ⚠️ Giá Click (CPC) đắt. Nếu Cost per Result (Giá mỗi tin nhắn) cũng đắt, nên tắt ngay nhóm quảng cáo này.\\n`;
                } else if (cpc > 0 && cpc <= 2000) {
                    advice += `- 🚀 Giá Click (CPC) rất tốt! Đây là Campaign WIN, khuyên bạn TĂNG NGÂN SÁCH (Scale up) khoảng 20% mỗi ngày để thu về nhiều tin nhắn nhất.\\n`;
                }
            }
            setAiAnalysis(advice);
            setIsAnalyzing(false);
            toast.success("Phân tích chuyên sâu hoàn tất!");
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-100 animate-in fade-in duration-200">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-indigo-600" />
                            Phân tích Chuyên sâu (Deep Analytics)
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Chiến dịch: <span className="text-indigo-600">{campaignName}</span> | ID: {campaignId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        Khoảng thời gian:
                    </label>
                    <select 
                        className="border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-w-[150px]"
                        value={datePreset}
                        onChange={(e: any) => setDatePreset(e.target.value)}
                    >
                        <option value="today">Hôm nay</option>
                        <option value="yesterday">Hôm qua</option>
                        <option value="last_7d">7 Ngày qua</option>
                        <option value="last_30d">30 Ngày qua</option>
                        <option value="this_month">Tháng này</option>
                        <option value="lifetime">Trọn đời</option>
                    </select>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-slate-500 text-lg font-medium">Đang kéo số liệu & phân tích tệp khách hàng...</p>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* TOP: 3 Columns (Creative, Targeting, Insights) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* COL 1: Creative */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5 text-indigo-500" />
                                        Mẫu Quảng Cáo (Creative)
                                    </h3>
                                </div>
                                <div className="p-5 flex-1 bg-slate-50/30 relative">
                                    {adImageUrl ? (
                                        <div className="relative mb-4">
                                            <img src={adImageUrl} alt="Ad Creative" className="w-full h-48 object-cover rounded-lg border border-slate-200 shadow-sm" />
                                            {isVideo && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                                    <PlayCircle className="w-12 h-12 text-white opacity-90 shadow-sm" />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 bg-slate-200 rounded-lg mb-4 flex flex-col items-center justify-center text-slate-400 border border-slate-300 border-dashed">
                                            {isVideo ? <PlayCircle className="w-8 h-8 mb-2" /> : <ImageIcon className="w-8 h-8 mb-2" />}
                                            <span>Không tìm thấy hình ảnh/video</span>
                                        </div>
                                    )}
                                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 line-clamp-4 leading-relaxed">
                                        {adBody}
                                    </div>
                                </div>
                            </div>

                            {/* COL 2: Targeting */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-indigo-500" />
                                        Nhắm Mục Tiêu (Targeting)
                                    </h3>
                                </div>
                                <div className="p-5 flex-1 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Tag className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loại Chiến Dịch (Mục Tiêu)</p>
                                            <p className="text-sm font-medium text-slate-800 mt-1">{formatObjective(objective)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><MapPin className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vị trí</p>
                                            <p className="text-sm font-medium text-slate-800 mt-1">{countries}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Users className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Độ tuổi</p>
                                            <p className="text-sm font-medium text-slate-800 mt-1">{ageMin} - {ageMax} tuổi</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                            * Lưu ý: Đây là targeting hiển thị theo nhóm quảng cáo (Ad Set) đầu tiên trong chiến dịch.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* COL 3: Main KPIs */}
                            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-lg overflow-hidden flex flex-col text-white">
                                <div className="px-5 py-4 border-b border-white/10 bg-black/10">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-indigo-200" />
                                        Chỉ Số Hiệu Quả (KPIs)
                                    </h3>
                                </div>
                                <div className="p-5 flex-1 grid grid-cols-2 gap-4">
                                    <div className="bg-black/20 rounded-lg p-4">
                                        <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold mb-1">Số tiền đã tiêu</p>
                                        <p className="text-xl font-bold">{insights ? formatCurrency(insights.spend) : "0 ₫"}</p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-4">
                                        <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold mb-1">Giá / Kết quả (CPR)</p>
                                        <p className="text-xl font-bold text-emerald-300">{cpr}</p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-4">
                                        <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold mb-1">Người tiếp cận (Reach)</p>
                                        <p className="text-xl font-bold">{new Intl.NumberFormat('vi-VN').format(reach)}</p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-4">
                                        <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold mb-1">Số Clicks (CTR)</p>
                                        <p className="text-xl font-bold">{insights ? new Intl.NumberFormat('vi-VN').format(insights.clicks) : 0} <span className="text-sm font-normal text-indigo-200">({insights?.ctr || 0}%)</span></p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* BOTTOM: AI Optimization Panel */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Bot className="w-6 h-6 text-indigo-400" />
                                    Hệ Thống Phân Tích & Cố Vấn Bằng AI
                                </h4>
                                <button 
                                    onClick={handleAiAnalyze}
                                    disabled={isAnalyzing || !insights}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
                                >
                                    {isAnalyzing ? "AI Đang xử lý..." : "Khởi động AI Phân Tích"}
                                </button>
                            </div>
                            
                            <div className="p-6 bg-slate-50 min-h-[150px]">
                                {aiAnalysis ? (
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
                                        <div className="space-y-3">
                                            {aiAnalysis.split('\\n').map((line, idx) => (
                                                line && <p key={idx} className="text-slate-800 leading-relaxed font-medium">{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400">
                                        <Bot className="w-12 h-12 mb-3 text-slate-300" />
                                        <p className="text-center font-medium">Bấm nút "Khởi động AI Phân Tích" để hệ thống tự động liên kết các chỉ số<br/>(Targeting, Hình ảnh, Độ đắt rẻ) và đưa ra chiến lược tối ưu cho bạn.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
