"use client";

import { useEffect, useState } from "react";
import { FileText, Calendar, Database, LayoutDashboard, Search, Users, UserPlus, Shield, Bot, Zap, Megaphone, TrendingUp, Key, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from "@/components/auth/AuthProvider";
import { StatsSkeleton } from "@/components/ui/SkeletonUI";
import { fetchMarketingStats, fetchCampaignPerformance, CampaignPerformance, getFbAdsConfig } from "@/lib/marketingStore";

export default function MarketingDashboard() {
    const { user, session, isLoading: authIsLoading } = useAuth();
    const [stats, setStats] = useState({
        activeCampaigns: 0,
        scheduledPosts: 0,
        totalPosts: 0,
        budgetUsed: 0
    });
    const [performance, setPerformance] = useState<CampaignPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fbToken, setFbToken] = useState('');
    const [fbAccountId, setFbAccountId] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            if (!session?.access_token) return;
            setIsLoading(true);
            try {
                // Fetch stats from Supabase
                const [statData, perfData, fbData] = await Promise.all([
                    fetchMarketingStats(session.access_token),
                    fetchCampaignPerformance(session.access_token),
                    getFbAdsConfig(session.access_token)
                ]);

                setStats({
                    activeCampaigns: statData.active_campaigns,
                    scheduledPosts: statData.scheduled_posts,
                    totalPosts: statData.total_posts,
                    budgetUsed: statData.budget_active
                });
                setPerformance(perfData);

                if (fbData) {
                    setFbToken(fbData.facebook_ads_config.accessToken);
                    setFbAccountId(fbData.facebook_ads_config.adAccountId);
                }

            } catch (error) {
                console.error("Error fetching marketing stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user && session) {
            fetchStats();
        }
    }, [user, session]);


    const statsCards = [
        {
            label: "Chiến dịch đang chạy",
            value: stats.activeCampaigns.toString(),
            icon: Megaphone,
            color: "text-blue-600",
            bg: "bg-blue-50",
            link: "/marketing/campaigns"
        },
        {
            label: "Bài viết chờ đăng",
            value: stats.scheduledPosts.toString(),
            icon: Calendar,
            color: "text-orange-600",
            bg: "bg-orange-50",
            link: "/marketing/content"
        },
        {
            label: "Tổng bài viết",
            value: stats.totalPosts.toString(),
            icon: FileText,
            color: "text-green-600",
            bg: "bg-green-50",
            link: "/marketing/content"
        },
        {
            label: "Ngân sách (Tháng)",
            value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.budgetUsed),
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
            link: "/marketing/campaigns"
        },
    ];

    if (isLoading || authIsLoading) {
        return (
            <div className="space-y-6">
                <StatsSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Tổng quan Marketing</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.bg}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-medium mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Campaign Performance Report */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Hiệu quả Chiến dịch</h3>
                        <p className="text-sm text-slate-500">Top 10 chiến dịch mang về nhiều khách hàng nhất</p>
                    </div>
                    {/* Date Filter - Simple Implementation */}
                    <div className="flex gap-2">
                        <select
                            className="text-sm border-slate-200 rounded-lg"
                            onChange={(e) => {
                                const val = e.target.value;
                                const now = new Date();
                                let start = null;
                                if (val === 'this_month') {
                                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                                } else if (val === 'last_month') {
                                    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                                }
                                // Trigger refetch with start date
                                const fetchPerfData = async () => {
                                    if (!session?.access_token) return;
                                    const perfData = await fetchCampaignPerformance(session.access_token, start);
                                    setPerformance(perfData);
                                };
                                fetchPerfData();
                            }}
                        >
                            <option value="all">Tất cả thời gian</option>
                            <option value="this_month">Tháng này</option>
                            <option value="last_month">Tháng trước</option>
                        </select>
                    </div>
                </div>
                <>
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium">Chiến dịch</th>
                                <th className="px-6 py-3 font-medium text-center">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Số Lead</th>
                                <th className="px-6 py-3 font-medium">Tỷ trọng (Lead)</th>
                                <th className="px-6 py-3 font-medium text-right">Doanh thu dự kiến</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {performance.length > 0 ? (
                                performance.map((camp) => {
                                    // Calculate max validation for bar chart scaling
                                    const maxLeads = Math.max(...performance.map(p => p.lead_count));
                                    const percentage = maxLeads > 0 ? (camp.lead_count / maxLeads) * 100 : 0;

                                    return (
                                        <tr key={camp.campaign_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {/* Drill-down Link */}
                                                <Link
                                                    href={`/marketing/leads?campaign_id=${camp.campaign_id}&campaign_name=${encodeURIComponent(camp.title)}`}
                                                    className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer block"
                                                    title="Xem toàn bộ khách hàng từ chiến dịch này"
                                                >
                                                    {camp.title}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${camp.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    camp.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                                                    }`}>
                                                    {camp.status === 'active' ? 'Đang chạy' : camp.status === 'completed' ? 'Hoàn thành' : camp.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-900">{camp.lead_count}</td>
                                            <td className="px-6 py-4 w-48">
                                                {/* Simple Bar Chart Visualization */}
                                                <div className="w-full bg-slate-100 rounded-full h-2.5">
                                                    <div
                                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(camp.revenue)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                                        Chưa có dữ liệu hiệu quả chiến dịch.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                    
                    {/* Mobile Card List View */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {performance.length > 0 ? (
                            performance.map((camp) => {
                                const maxLeads = Math.max(...performance.map(p => p.lead_count));
                                const percentage = maxLeads > 0 ? (camp.lead_count / maxLeads) * 100 : 0;

                                return (
                                    <div key={camp.campaign_id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 pr-2">
                                                <Link
                                                    href={`/marketing/leads?campaign_id=${camp.campaign_id}&campaign_name=${encodeURIComponent(camp.title)}`}
                                                    className="font-bold text-blue-600 hover:underline hover:text-blue-800 line-clamp-2"
                                                >
                                                    {camp.title}
                                                </Link>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${camp.status === 'active' ? 'bg-green-100 text-green-800' :
                                                camp.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                {camp.status === 'active' ? 'Đang chạy' : camp.status === 'completed' ? 'Hoàn thành' : camp.status}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 mb-3 bg-slate-50 p-3 rounded-lg">
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Số Lead</div>
                                                <div className="font-bold text-slate-900 text-sm">{camp.lead_count}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Dự kiến thu</div>
                                                <div className="font-bold text-slate-900 text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(camp.revenue)}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <div className="text-[10px] text-slate-500 flex justify-between">
                                                <span>Tỷ trọng Lead</span>
                                                <span className="font-medium">{percentage.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div
                                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-slate-500 italic">
                                Chưa có dữ liệu hiệu quả chiến dịch.
                            </div>
                        )}
                    </div>
                </>
            </div>
        </div>
    );
}

import { toast } from 'sonner';
