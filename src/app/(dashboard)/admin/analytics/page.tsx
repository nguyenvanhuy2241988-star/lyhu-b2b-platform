"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { Users, Eye, MousePointerClick, Activity, Monitor, Smartphone, Globe, Calendar as CalendarIcon, ArrowUpRight, MapPin } from "lucide-react";
import dayjs from "dayjs";

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("7d"); // today, yesterday, 7d, 30d, this_month, custom
    const [customStart, setCustomStart] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
    const [customEnd, setCustomEnd] = useState(dayjs().format('YYYY-MM-DD'));
    const [excludeInternal, setExcludeInternal] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (dateRange !== 'custom' || (customStart && customEnd)) {
            fetchAnalytics();
        }
    }, [dateRange, customStart, customEnd, excludeInternal]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        
        try {
            let startDate = dayjs().subtract(7, 'day').startOf('day').toISOString();
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
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select 
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none w-full sm:w-auto cursor-pointer"
                    >
                        <option value="today">Hôm nay</option>
                        <option value="yesterday">Hôm qua</option>
                        <option value="7d">7 ngày qua</option>
                        <option value="30d">30 ngày qua</option>
                        <option value="this_month">Tháng này</option>
                        <option value="custom">Tùy chỉnh...</option>
                    </select>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                            <input 
                                type="date" 
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="px-3 py-1.5 bg-white border-none rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                            />
                            <span className="text-slate-400 font-medium">-</span>
                            <input 
                                type="date" 
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="px-3 py-1.5 bg-white border-none rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                            />
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={excludeInternal} 
                                onChange={() => setExcludeInternal(!excludeInternal)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${excludeInternal ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${excludeInternal ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <div className="ml-3 text-sm font-medium text-slate-700">
                            Loại trừ truy cập nội bộ
                        </div>
                    </label>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Eye className="w-12 h-12 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <div className="p-1.5 bg-primary-50 rounded-md text-primary">
                            <Eye className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-xs">Xem (Người)</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{data?.humanViews?.toLocaleString() || 0}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="w-12 h-12 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <div className="p-1.5 bg-blue-50 rounded-md text-blue-600">
                            <Users className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-xs">Khách (Unique)</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{data?.uniqueVisitors?.toLocaleString() || 0}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <MousePointerClick className="w-12 h-12 text-amber-500" />
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <div className="p-1.5 bg-amber-50 rounded-md text-amber-600">
                            <MousePointerClick className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-xs">Tổng Phiên</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{data?.totalSessions?.toLocaleString() || 0}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Globe className="w-12 h-12 text-slate-500" />
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <div className="p-1.5 bg-slate-100 rounded-md text-slate-600">
                            <Globe className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-xs">Lượt quét (Bot)</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{data?.botViews?.toLocaleString() || 0}</div>
                </div>

                <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden group ${data?.avgLoadTime && data.avgLoadTime > 3000 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <div className={`p-1.5 rounded-md ${data?.avgLoadTime && data.avgLoadTime > 3000 ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Activity className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-xs">Tốc độ Tải trang</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {data?.avgLoadTime ? (data.avgLoadTime / 1000).toFixed(2) : 0}s
                    </div>
                    <div className={`mt-2 text-xs ${data?.avgLoadTime && data.avgLoadTime > 3000 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {data?.avgLoadTime && data.avgLoadTime > 3000 ? 'Chậm! Cần tối ưu' : 'Rất nhanh'}
                    </div>
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
                                    dataKey="human_views" 
                                    name="Người thật"
                                    stroke="#00afa9" 
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6, stroke: '#00afa9', strokeWidth: 2, fill: '#fff' }} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="bot_views" 
                                    name="Bot / AI"
                                    stroke="#94a3b8" 
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
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

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-indigo-500" />
                            Hệ điều hành
                        </h3>
                        <div className="space-y-4">
                            {data?.topOs?.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                                    <div className="text-sm font-bold text-slate-900">{item.views}</div>
                                </div>
                            ))}
                            {(!data?.topOs || data.topOs.length === 0) && (
                                <div className="text-center text-slate-400 py-4">Chưa có dữ liệu</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-pink-500" />
                            Trình duyệt
                        </h3>
                        <div className="space-y-4">
                            {data?.topBrowsers?.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                                    <div className="text-sm font-bold text-slate-900">{item.views}</div>
                                </div>
                            ))}
                            {(!data?.topBrowsers || data.topBrowsers.length === 0) && (
                                <div className="text-center text-slate-400 py-4">Chưa có dữ liệu</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Geographic Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Regions - Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-rose-500" />
                        Khu vực truy cập (Tỉnh/Thành)
                    </h3>
                    {data?.topRegions?.length > 0 ? (
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data.topRegions.slice(0, 10)}
                                    layout="vertical"
                                    margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#334155', fontSize: 12, fontWeight: 500}} 
                                        width={120}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any, name: any) => {
                                            if (name === 'views') return [value, 'Lượt xem'];
                                            if (name === 'visitors') return [value, 'Khách'];
                                            return [value, name];
                                        }}
                                    />
                                    <Bar dataKey="views" name="views" fill="#f43f5e" radius={[0, 6, 6, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <MapPin className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                                <p>Chưa có dữ liệu khu vực</p>
                                <p className="text-xs mt-1">Dữ liệu sẽ bắt đầu thu thập từ lượt truy cập mới</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Top Cities */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-violet-500" />
                        Chi tiết Thành phố
                    </h3>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto">
                        {data?.topCities?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between group hover:bg-slate-50 rounded-lg px-3 py-2 -mx-3 transition-colors">
                                <div className="flex items-center gap-3 truncate">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 flex items-center justify-center text-xs font-bold">
                                        {idx + 1}
                                    </div>
                                    <div className="truncate">
                                        <span className="text-sm font-medium text-slate-800 block truncate">
                                            {item.name}
                                        </span>
                                        {item.region && (
                                            <span className="text-[11px] text-slate-400">
                                                {item.region}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-slate-900 bg-slate-50 group-hover:bg-white px-3 py-1 rounded-lg transition-colors">
                                    {item.views}
                                </div>
                            </div>
                        ))}
                        {(!data?.topCities || data.topCities.length === 0) && (
                            <div className="text-center text-slate-400 py-8">
                                <Globe className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                                <p>Chưa có dữ liệu thành phố</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
