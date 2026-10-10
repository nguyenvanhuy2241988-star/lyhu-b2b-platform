"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { 
    Users, Eye, MousePointerClick, Activity, Monitor, Smartphone, Globe, 
    Calendar as CalendarIcon, ArrowUpRight, MapPin, Search, Trophy, Target, 
    Bot, ShieldCheck, Cpu, RefreshCw, Layers, CheckCircle2, AlertCircle
} from "lucide-react";
import dayjs from "dayjs";

// Bảng màu thương hiệu LYHU: Flat, Tối giản, Hiện đại
const BRAND_TEAL = "#00AFA9";
const BRAND_LIME = "#98C93C";
const SLATE_DARK = "#1E293B";
const SLATE_MUTED = "#64748B";
const SLATE_BORDER = "#E2E8F0";

const PIE_COLORS = [BRAND_TEAL, BRAND_LIME, "#0EA5E9", "#F59E0B", "#8B5CF6"];

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("today"); // Mặc định là Hôm nay để xem số liệu trực quan
    const [customStart, setCustomStart] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
    const [customEnd, setCustomEnd] = useState(dayjs().format('YYYY-MM-DD'));
    const [excludeInternal, setExcludeInternal] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // GSC State
    const [seoData, setSeoData] = useState<any>(null);
    const [seoLoading, setSeoLoading] = useState(false);
    const [seoError, setSeoError] = useState<string | null>(null);

    // Filter tab cho bảng Khách truy cập gần đây: 'all' | 'human' | 'bot' | 'ai'
    const [visitorFilter, setVisitorFilter] = useState<"all" | "human" | "ai" | "bot">("all");

    useEffect(() => {
        fetchSeoData();
    }, []);

    const fetchSeoData = async () => {
        setSeoLoading(true);
        setSeoError(null);
        try {
            const res = await fetch('/api/admin/seo');
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to fetch SEO data');
            setSeoData(result);
        } catch (err: any) {
            setSeoError(err.message);
        } finally {
            setSeoLoading(false);
        }
    };

    useEffect(() => {
        if (dateRange !== 'custom' || (customStart && customEnd)) {
            fetchAnalytics();
        }
    }, [dateRange, customStart, customEnd, excludeInternal]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        
        try {
            let startDate = dayjs().startOf('day').toISOString();
            let endDate = dayjs().endOf('day').toISOString();

            if (dateRange === 'today') {
                startDate = dayjs().startOf('day').toISOString();
            } else if (dateRange === 'yesterday') {
                startDate = dayjs().subtract(1, 'day').startOf('day').toISOString();
                endDate = dayjs().subtract(1, 'day').endOf('day').toISOString();
            } else if (dateRange === '7d') {
                startDate = dayjs().subtract(7, 'day').startOf('day').toISOString();
            } else if (dateRange === '30d') {
                startDate = dayjs().subtract(30, 'day').startOf('day').toISOString();
            } else if (dateRange === 'this_month') {
                startDate = dayjs().startOf('month').toISOString();
            } else if (dateRange === 'custom') {
                startDate = dayjs(customStart).startOf('day').toISOString();
                endDate = dayjs(customEnd).endOf('day').toISOString();
            }

            const { data: result, error } = await supabase.rpc('get_analytics_summary', {
                start_date: startDate,
                end_date: endDate,
                exclude_internal: excludeInternal
            });

            if (error) throw error;
            
            if (result) {
                // Format dates for charts
                if (result.trafficOverTime) {
                    result.trafficOverTime = result.trafficOverTime.map((item: any) => ({
                        ...item,
                        displayDate: dayjs(item.date).format('DD/MM')
                    }));
                }

                // Group referrers (Phân nhóm AI Search & Direct & Search Engines)
                if (result.topReferrers) {
                    const groupedReferrers: Record<string, number> = {};
                    result.topReferrers.forEach((ref: any) => {
                        let source = ref.source || "Direct (Trực tiếp)";
                        const sLower = source.toLowerCase();
                        
                        // AI Search Engines
                        if (sLower.includes("deepseek")) {
                            source = "DeepSeek AI Search";
                        } else if (sLower.includes("chatgpt") || sLower.includes("openai")) {
                            source = "ChatGPT Search";
                        } else if (sLower.includes("perplexity")) {
                            source = "Perplexity AI";
                        } else if (sLower.includes("claude")) {
                            source = "Claude AI";
                        } else if (sLower.includes("gemini")) {
                            source = "Google Gemini";
                        } else if (sLower.includes("kimi") || sLower.includes("moonshot")) {
                            source = "Kimi AI (Moonshot)";
                        } else if (sLower.includes("alibaba") || sLower.includes("qwen") || sLower.includes("aliyun")) {
                            source = "Alibaba Qwen AI";
                        } else if (sLower.includes("baidu")) {
                            source = "Baidu (China)";
                        } else if (source.includes("facebook.com")) {
                            source = "Facebook";
                        } else if (source.includes("google.com")) {
                            source = "Google Tìm kiếm";
                        } else if (source.includes("bing.com")) {
                            source = "Bing Search";
                        } else if (source.includes("zalo.me")) {
                            source = "Zalo";
                        } else if (source.startsWith("http")) {
                            try {
                                const url = new URL(source);
                                source = url.hostname.replace('www.', '');
                            } catch(e) {}
                        }
                        
                        groupedReferrers[source] = (groupedReferrers[source] || 0) + ref.views;
                    });
                    
                    result.topReferrers = Object.entries(groupedReferrers)
                        .map(([source, views]) => ({ source, views }))
                        .sort((a, b) => (b.views as number) - (a.views as number));
                }

                // Fill missing device labels
                if (result.deviceBreakdown) {
                    result.deviceBreakdown = result.deviceBreakdown.map((item: any) => ({
                        ...item,
                        device: item.device === "desktop" ? "Máy tính (Desktop)" : item.device === "mobile" ? "Điện thoại (Mobile)" : (item.device || "Khác")
                    }));
                }
            }

            // Fetch Recent Visitors Details (Nâng lên 100 bản ghi để phân tích kỹ)
            let visitorsQuery = supabase
                .from('website_page_views')
                .select('id, visitor_id, session_id, pathname, referrer, device_type, os, browser, city, region, country, created_at, load_time_ms, is_bot, bot_name')
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .order('created_at', { ascending: false })
                .limit(100);

            if (excludeInternal) {
                visitorsQuery = visitorsQuery
                    .not('pathname', 'like', '/admin%')
                    .not('pathname', 'like', '/marketing%')
                    .not('pathname', 'like', '/recruitment%')
                    .not('pathname', 'like', '/chat%')
                    .not('pathname', 'like', '/login%');
            }

            const { data: recentVisitors } = await visitorsQuery;

            if (result) {
                result.recentVisitors = recentVisitors || [];
            }

            setData(result);
        } catch (err: any) {
            console.error("Error fetching analytics:", err);
            setError(err.message || "Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    // Lọc danh sách khách gần đây theo bộ lọc tab
    const filteredVisitors = useMemo(() => {
        if (!data?.recentVisitors) return [];
        if (visitorFilter === "all") return data.recentVisitors;
        if (visitorFilter === "human") return data.recentVisitors.filter((v: any) => !v.is_bot);
        if (visitorFilter === "ai") return data.recentVisitors.filter((v: any) => {
            const b = (v.bot_name || "").toLowerCase();
            const r = (v.referrer || "").toLowerCase();
            return b.includes("ai") || b.includes("gpt") || b.includes("claude") || b.includes("deepseek") || b.includes("kimi") || b.includes("qwen") || r.includes("ai") || r.includes("gpt") || r.includes("deepseek");
        });
        if (visitorFilter === "bot") return data.recentVisitors.filter((v: any) => v.is_bot);
        return data.recentVisitors;
    }, [data?.recentVisitors, visitorFilter]);

    if (loading && !data) return (
        <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#00AFA9] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium text-slate-500">Đang tải báo cáo truy cập LYHU...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Header: Thiết kế Phẳng Tối Giản, Không Gradient */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#00AFA9]"></span>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                Báo Cáo Phân Tích Truy Cập
                            </h1>
                            <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-[#00AFA9] border border-teal-200 font-medium">
                                LYHU Analytics Engine
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Hệ thống đo lường lưu lượng thời gian thực, phân loại người dùng thật và các nền tảng AI Search toàn cầu.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Date Range Selector */}
                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1 text-xs font-medium">
                            <button
                                onClick={() => setDateRange("today")}
                                className={`px-3 py-1.5 rounded-md transition-all ${dateRange === "today" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                Hôm nay
                            </button>
                            <button
                                onClick={() => setDateRange("yesterday")}
                                className={`px-3 py-1.5 rounded-md transition-all ${dateRange === "yesterday" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                Hôm qua
                            </button>
                            <button
                                onClick={() => setDateRange("7d")}
                                className={`px-3 py-1.5 rounded-md transition-all ${dateRange === "7d" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                7 ngày
                            </button>
                            <button
                                onClick={() => setDateRange("30d")}
                                className={`px-3 py-1.5 rounded-md transition-all ${dateRange === "30d" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                30 ngày
                            </button>
                            <button
                                onClick={() => setDateRange("this_month")}
                                className={`px-3 py-1.5 rounded-md transition-all ${dateRange === "this_month" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                Tháng này
                            </button>
                        </div>

                        {/* Toggle Lọc nội bộ */}
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={excludeInternal} 
                                onChange={(e) => setExcludeInternal(e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-[#00AFA9] focus:ring-0 cursor-pointer"
                            />
                            <span>Lọc truy cập nội bộ</span>
                        </label>

                        <button 
                            onClick={() => { fetchAnalytics(); fetchSeoData(); }}
                            title="Tải lại số liệu mới nhất"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Chỉ Số KPI Cốt Lõi: Phẳng, Tối giản, Màu thương hiệu */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                
                {/* 1. Lượt xem thật */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm hover:border-[#00AFA9] transition-colors">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                        <span>Lượt xem (Người)</span>
                        <Eye className="w-4 h-4 text-[#00AFA9]" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">
                        {data?.humanViews?.toLocaleString() || 0}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00AFA9]"></span>
                        Độc giả / Khách hàng
                    </div>
                </div>

                {/* 2. Khách Unique */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm hover:border-[#00AFA9] transition-colors">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                        <span>Khách (Unique)</span>
                        <Users className="w-4 h-4 text-[#00AFA9]" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">
                        {data?.uniqueVisitors?.toLocaleString() || 0}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                        Thiết bị riêng biệt
                    </div>
                </div>

                {/* 3. Tổng phiên */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm hover:border-[#00AFA9] transition-colors">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                        <span>Tổng Phiên</span>
                        <MousePointerClick className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">
                        {data?.totalSessions?.toLocaleString() || 0}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                        Lượt duyệt website
                    </div>
                </div>

                {/* 4. Truy cập AI & Bot */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm hover:border-[#98C93C] transition-colors">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                        <span>AI Search & Bot</span>
                        <Bot className="w-4 h-4 text-[#98C93C]" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">
                        {data?.botViews?.toLocaleString() || 0}
                    </div>
                    <div className="text-[11px] text-[#7BA331] mt-1 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã phân loại riêng
                    </div>
                </div>

                {/* 5. Tốc độ tải trang */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm hover:border-slate-400 transition-colors">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                        <span>Tốc độ tải trung bình</span>
                        <Activity className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">
                        {data?.avgLoadTime ? (data.avgLoadTime / 1000).toFixed(2) : 0}s
                    </div>
                    <div className="text-[11px] text-emerald-600 mt-1 font-medium">
                        Phản hồi rất nhanh
                    </div>
                </div>

                {/* 6. Tỷ lệ Khách Thật / Tổng */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm hover:border-[#00AFA9] transition-colors">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
                        <span>Độ chuẩn xác traffic</span>
                        <ShieldCheck className="w-4 h-4 text-[#00AFA9]" />
                    </div>
                    <div className="text-2xl font-bold text-[#00AFA9] tracking-tight">
                        {data?.humanViews && (data.humanViews + (data.botViews || 0)) > 0
                            ? `${Math.round((data.humanViews / (data.humanViews + (data.botViews || 0))) * 100)}%`
                            : "100%"}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                        Không bị bot ảo lấn át
                    </div>
                </div>
            </div>

            {/* Google Search Console: Thiết Kế Phẳng (Trắng - Xanh Teal - Xám) thay cho hộp đen cũ */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-slate-100 gap-2">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Search className="w-4 h-4 text-[#00AFA9]" />
                            Google Search Console (Hiệu Suất Tìm Kiếm Tự Nhiên 30 Ngày)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Dữ liệu xếp hạng từ khóa và lượt tìm kiếm thực tế của thương hiệu LYHU trên Google.
                        </p>
                    </div>
                    <button 
                        onClick={fetchSeoData}
                        disabled={seoLoading}
                        className="text-xs text-[#00AFA9] hover:underline font-medium flex items-center gap-1"
                    >
                        {seoLoading ? "Đang đồng bộ..." : "Đồng bộ lại"}
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                        <span className="text-xs text-slate-500 block mb-1">Lượt nhấp từ Google</span>
                        <span className="text-xl font-bold text-slate-900">{seoData?.clicks?.toLocaleString() || 0}</span>
                        <span className="text-[11px] text-slate-400 block mt-1">Clicks vào website</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                        <span className="text-xs text-slate-500 block mb-1">Lượt hiển thị Google</span>
                        <span className="text-xl font-bold text-slate-900">{seoData?.impressions?.toLocaleString() || 0}</span>
                        <span className="text-[11px] text-slate-400 block mt-1">Xuất hiện trên kết quả</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                        <span className="text-xs text-slate-500 block mb-1">Tỷ lệ nhấp (CTR)</span>
                        <span className="text-xl font-bold text-[#00AFA9]">
                            {seoData?.ctr ? seoData.ctr.toFixed(2) : "0.00"}%
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-1">Clicks / Impressions</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                        <span className="text-xs text-slate-500 block mb-1">Vị trí trung bình</span>
                        <span className="text-xl font-bold text-slate-900">
                            {seoData?.position ? seoData.position.toFixed(1) : "-"}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-medium block mt-1">Trang 1 Google</span>
                    </div>
                </div>
            </div>

            {/* Biểu Đồ Lưu Lượng: Đường Nét Đơn Sắc Phẳng */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#00AFA9]" />
                            Biểu Đồ Lưu Lượng Truy Cập Theo Thời Gian
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            So sánh biến động giữa Người thật truy cập và Bot quét hệ thống
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-[#00AFA9]"></span>
                            <span className="text-slate-700">Người thật (Độc giả)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-slate-400 border-b border-dashed"></span>
                            <span className="text-slate-500">Bot / AI Crawler</span>
                        </div>
                    </div>
                </div>

                <div className="h-[280px] w-full">
                    {data?.trafficOverTime?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trafficOverTime} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: 'none', backgroundColor: '#FFFFFF', fontSize: '12px' }}
                                    cursor={{ stroke: '#00AFA9', strokeWidth: 1 }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="human_views" 
                                    name="Người thật"
                                    stroke="#00AFA9" 
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#00AFA9' }}
                                    activeDot={{ r: 5, stroke: '#00AFA9', strokeWidth: 2, fill: '#FFFFFF' }} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="bot_views" 
                                    name="Bot / AI"
                                    stroke="#94A3B8" 
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                            Chưa có dữ liệu truy cập trong khoảng thời gian này
                        </div>
                    )}
                </div>
            </div>

            {/* Chi Tiết Chuyên Sâu: Trang Xem Nhiều & Nguồn AI / Web */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Trang Xem Nhiều Nhất */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-[#00AFA9]" />
                            Trang Được Xem Nhiều Nhất (Top Pages)
                        </h3>
                        <span className="text-[11px] text-slate-400">Lượt đọc</span>
                    </div>

                    <div className="space-y-2">
                        {data?.topPages?.slice(0, 8).map((page: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors text-xs">
                                <div className="flex items-center gap-2.5 truncate pr-3">
                                    <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                        {idx + 1}
                                    </span>
                                    <span className="font-mono text-slate-700 truncate" title={page.path}>
                                        {page.path}
                                    </span>
                                </div>
                                <span className="font-semibold text-slate-900 px-2 py-0.5 rounded bg-slate-100 shrink-0">
                                    {page.views}
                                </span>
                            </div>
                        ))}
                        {(!data?.topPages || data.topPages.length === 0) && (
                            <div className="text-center text-slate-400 py-6 text-xs">Chưa có dữ liệu</div>
                        )}
                    </div>
                </div>

                {/* 2. Nguồn Giới Thiệu (Bao gồm AI Search & Mạng Xã Hội) */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-[#98C93C]" />
                            Nguồn Truy Cập (Referrers & AI Search)
                        </h3>
                        <span className="text-[11px] text-slate-400">Lượt vào</span>
                    </div>

                    <div className="space-y-2">
                        {data?.topReferrers?.slice(0, 8).map((ref: any, idx: number) => {
                            const isAi = ref.source.toLowerCase().includes("ai") || ref.source.toLowerCase().includes("chatgpt") || ref.source.toLowerCase().includes("deepseek");
                            return (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors text-xs">
                                    <div className="flex items-center gap-2 truncate pr-3">
                                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className={`truncate font-medium ${isAi ? "text-[#00AFA9]" : "text-slate-700"}`}>
                                            {ref.source}
                                        </span>
                                        {isAi && (
                                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-teal-50 text-[#00AFA9] border border-teal-200 font-semibold shrink-0">
                                                AI
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-semibold text-slate-900 px-2 py-0.5 rounded bg-slate-100 shrink-0">
                                        {ref.views}
                                    </span>
                                </div>
                            );
                        })}
                        {(!data?.topReferrers || data.topReferrers.length === 0) && (
                            <div className="text-center text-slate-400 py-6 text-xs">Chưa có dữ liệu nguồn</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chi Tiết Thiết Bị & Khu Vực Địa Lý */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Thiết bị */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-slate-700" />
                        Thiết Bị Truy Cập
                    </h3>
                    <div className="h-[160px] flex items-center justify-center">
                        {data?.deviceBreakdown?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.deviceBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={2}
                                        dataKey="views"
                                        nameKey="device"
                                    >
                                        {data.deviceBreakdown.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-xs text-slate-400">Chưa có dữ liệu</div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5 mt-2">
                        {data?.deviceBreakdown?.map((entry: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                                    <span className="text-slate-600">{entry.device}</span>
                                </div>
                                <span className="font-bold text-slate-900">{entry.views}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Hệ điều hành & Trình duyệt */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-slate-700" />
                        Hệ Điều Hành & Trình Duyệt
                    </h3>
                    <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Hệ điều hành</span>
                        {data?.topOs?.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-1">
                                <span className="text-slate-700">{item.name}</span>
                                <span className="font-semibold text-slate-900">{item.views}</span>
                            </div>
                        ))}
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block pt-2">Trình duyệt</span>
                        {data?.topBrowsers?.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-1">
                                <span className="text-slate-700">{item.name}</span>
                                <span className="font-semibold text-slate-900">{item.views}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Khu vực / Thành phố */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#00AFA9]" />
                        Vị Trí Địa Lý (Tỉnh / Thành Phố)
                    </h3>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                        {data?.topCities?.slice(0, 6).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 text-xs">
                                <div className="truncate pr-2">
                                    <span className="font-medium text-slate-800 block truncate">{item.name}</span>
                                    {item.region && <span className="text-[10px] text-slate-400">{item.region}</span>}
                                </div>
                                <span className="font-semibold text-slate-900 px-2 py-0.5 rounded bg-slate-100 shrink-0">
                                    {item.views}
                                </span>
                            </div>
                        ))}
                        {(!data?.topCities || data.topCities.length === 0) && (
                            <div className="text-center text-slate-400 py-8 text-xs">Chưa có dữ liệu vị trí</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bảng Chi Tiết Khách Truy Cập Gần Đây (Nâng Cấp Phân Loại Thông Minh) */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-slate-100 gap-3">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#00AFA9]" />
                            Nhật Ký Truy Cập Chi Tiết (Recent Activity Logs)
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Chi tiết từng phiên truy cập theo thời gian thực kèm định danh thiết bị và nguồn gốc.
                        </p>
                    </div>

                    {/* Bộ lọc tab phẳng */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
                        <button
                            onClick={() => setVisitorFilter("all")}
                            className={`px-3 py-1 rounded-md transition-all ${visitorFilter === "all" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Tất cả ({data?.recentVisitors?.length || 0})
                        </button>
                        <button
                            onClick={() => setVisitorFilter("human")}
                            className={`px-3 py-1 rounded-md transition-all ${visitorFilter === "human" ? "bg-white text-[#00AFA9] shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Người thật
                        </button>
                        <button
                            onClick={() => setVisitorFilter("ai")}
                            className={`px-3 py-1 rounded-md transition-all ${visitorFilter === "ai" ? "bg-white text-[#7BA331] shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            AI Search
                        </button>
                        <button
                            onClick={() => setVisitorFilter("bot")}
                            className={`px-3 py-1 rounded-md transition-all ${visitorFilter === "bot" ? "bg-white text-slate-700 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Bot / Crawler
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                                <th className="pb-2.5 font-semibold">Thời gian</th>
                                <th className="pb-2.5 font-semibold">Trang truy cập</th>
                                <th className="pb-2.5 font-semibold">Nguồn (Referrer)</th>
                                <th className="pb-2.5 font-semibold">Loại khách / Danh tính</th>
                                <th className="pb-2.5 font-semibold">Thiết bị & Trình duyệt</th>
                                <th className="pb-2.5 font-semibold">Vị trí địa lý</th>
                                <th className="pb-2.5 font-semibold text-right">Tốc độ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredVisitors.map((v: any, idx: number) => {
                                const isBot = v.is_bot;
                                const botName = v.bot_name;
                                const isAi = (botName || "").toLowerCase().includes("ai") || (botName || "").toLowerCase().includes("gpt") || (botName || "").toLowerCase().includes("deepseek") || (botName || "").toLowerCase().includes("kimi");

                                return (
                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-2.5 whitespace-nowrap font-mono text-slate-500">
                                            {dayjs(v.created_at).format('HH:mm:ss DD/MM')}
                                        </td>
                                        <td className="py-2.5 font-mono font-medium text-slate-900 max-w-[200px] truncate" title={v.pathname}>
                                            {v.pathname}
                                        </td>
                                        <td className="py-2.5 max-w-[160px] truncate text-slate-600" title={v.referrer || 'Trực tiếp'}>
                                            {v.referrer || <span className="text-slate-400 italic">Trực tiếp</span>}
                                        </td>
                                        <td className="py-2.5 whitespace-nowrap">
                                            {isAi ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-[#00AFA9] font-medium border border-teal-200 text-[11px]">
                                                    <Bot className="w-3 h-3" />
                                                    {botName || "AI Search"}
                                                </span>
                                            ) : isBot ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px]">
                                                    <Cpu className="w-3 h-3" />
                                                    {botName || "Crawler Bot"}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-[11px]">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Người dùng thật
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2.5 whitespace-nowrap text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                {v.device_type === 'mobile' ? (
                                                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                                ) : (
                                                    <Monitor className="w-3.5 h-3.5 text-slate-400" />
                                                )}
                                                <span>{v.browser} / {v.os}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 text-slate-600">
                                            {v.city ? `${v.city}${v.country ? `, ${v.country}` : ''}` : <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="py-2.5 text-right font-mono">
                                            {v.load_time_ms ? (
                                                <span className={v.load_time_ms > 3000 ? 'text-amber-600 font-medium' : 'text-slate-600'}>
                                                    {(v.load_time_ms / 1000).toFixed(2)}s
                                                </span>
                                            ) : <span className="text-slate-300">-</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredVisitors.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400">
                                        Không tìm thấy dữ liệu phù hợp với bộ lọc
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
