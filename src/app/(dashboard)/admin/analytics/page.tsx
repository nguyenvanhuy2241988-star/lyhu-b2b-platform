"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { Users, Eye, MousePointerClick, Activity, Monitor, Smartphone, Globe, Calendar as CalendarIcon, ArrowUpRight } from "lucide-react";
import dayjs from "dayjs";

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("7d"); // 7d, 30d, all
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        
        try {
            let startDate = dayjs().subtract(7, 'day').toISOString();
            if (dateRange === '30d') startDate = dayjs().subtract(30, 'day').toISOString();
            if (dateRange === 'all') startDate = dayjs().subtract(1, 'year').toISOString(); // arbitrary 'all'

            const { data: result, error } = await supabase.rpc('get_analytics_summary', {
                start_date: startDate,
                end_date: dayjs().toISOString()
            });

            if (error) throw error;
            
            // Format dates for charts
            if (result && result.trafficOverTime) {
                result.trafficOverTime = result.trafficOverTime.map((item: any) => ({
                    ...item,
                    displayDate: dayjs(item.date).format('DD/MM')
                }));
            }

            setData(result);
        } catch (err: any) {
            console.error("Error fetching analytics:", err);
            setError(err.message || "Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#00afa9', '#98c93c', '#f59e0b', '#3b82f6', '#8b5cf6'];

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl m-8">
            <h3 className="font-bold mb-2">Lỗi tải dữ liệu</h3>
            <p>{error}</p>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Phân tích Truy cập</h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi lưu lượng khách hàng truy cập website theo thời gian thực.</p>
                </div>
                
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setDateRange('7d')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${dateRange === '7d' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        7 ngày qua
                    </button>
                    <button 
                        onClick={() => setDateRange('30d')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${dateRange === '30d' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        30 ngày qua
                    </button>
                    <button 
                        onClick={() => setDateRange('all')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${dateRange === 'all' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Tất cả
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <Eye className="w-16 h-16 text-primary" />
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 mb-2">
                        <div className="p-2 bg-primary-50 rounded-lg text-primary">
                            <Eye className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Tổng Lượt Xem (Pageviews)</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900">{data?.totalViews?.toLocaleString() || 0}</div>
                    <div className="mt-2 text-sm text-emerald-600 flex items-center gap-1">
                        <Activity className="w-4 h-4" /> Real-time active
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="w-16 h-16 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Khách Truy Cập (Unique)</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900">{data?.uniqueVisitors?.toLocaleString() || 0}</div>
                    <div className="mt-2 text-sm text-slate-500">Khách hàng duy nhất</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <MousePointerClick className="w-16 h-16 text-amber-500" />
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 mb-2">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <MousePointerClick className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Tổng Phiên (Sessions)</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900">{data?.totalSessions?.toLocaleString() || 0}</div>
                    <div className="mt-2 text-sm text-slate-500">Lượt vào trang</div>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Lưu lượng truy cập theo ngày
                </h3>
                <div className="h-[300px] w-full">
                    {data?.trafficOverTime?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trafficOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#00afa9', strokeWidth: 1, strokeDasharray: '3 3' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="views" 
                                    name="Lượt xem"
                                    stroke="#00afa9" 
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6, stroke: '#00afa9', strokeWidth: 2, fill: '#fff' }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            Chưa có dữ liệu truy cập trong khoảng thời gian này
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Pages */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-blue-500" />
                        Trang xem nhiều nhất
                    </h3>
                    <div className="space-y-4">
                        {data?.topPages?.map((page: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3 truncate pr-4">
                                    <div className="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-medium">
                                        {idx + 1}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 truncate group-hover:text-primary transition-colors" title={page.path}>
                                        {page.path}
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">
                                    {page.views}
                                </div>
                            </div>
                        ))}
                        {(!data?.topPages || data.topPages.length === 0) && (
                            <div className="text-center text-slate-400 py-4">Chưa có dữ liệu</div>
                        )}
                    </div>
                </div>

                {/* Sources & Devices */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-amber-500" />
                            Nguồn truy cập (Referrers)
                        </h3>
                        <div className="space-y-4">
                            {data?.topReferrers?.map((ref: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 truncate">
                                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-700 truncate">
                                            {ref.source}
                                        </span>
                                    </div>
                                    <div className="text-sm font-bold text-slate-900">
                                        {ref.views}
                                    </div>
                                </div>
                            ))}
                            {(!data?.topReferrers || data.topReferrers.length === 0) && (
                                <div className="text-center text-slate-400 py-4">Chưa có dữ liệu</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-emerald-500" />
                            Thiết bị truy cập
                        </h3>
                        <div className="h-[200px] flex items-center justify-center">
                            {data?.deviceBreakdown?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.deviceBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="views"
                                            nameKey="device"
                                        >
                                            {data.deviceBreakdown.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: any) => [value, 'Lượt xem']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-slate-400">Chưa có dữ liệu</div>
                            )}
                        </div>
                        {/* Device Legend */}
                        <div className="flex justify-center gap-4 mt-2">
                            {data?.deviceBreakdown?.map((entry: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-xs font-medium text-slate-600 capitalize">{entry.device} ({entry.views})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
