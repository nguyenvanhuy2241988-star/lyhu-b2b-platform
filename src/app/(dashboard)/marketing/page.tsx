"use client";

import { useEffect, useState } from "react";
import { Megaphone, FileText, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { StatsSkeleton } from "@/components/ui/SkeletonUI";
import { fetchMarketingStats, fetchCampaignPerformance, CampaignPerformance } from "@/lib/marketingStore";

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

    useEffect(() => {
        const fetchStats = async () => {
            if (!session?.access_token) return;
            setIsLoading(true);
            try {
                // Fetch stats from Supabase
                const [statData, perfData] = await Promise.all([
                    fetchMarketingStats(session.access_token),
                    fetchCampaignPerformance(session.access_token)
                ]);

                setStats({
                    activeCampaigns: statData.active_campaigns,
                    scheduledPosts: statData.scheduled_posts,
                    totalPosts: statData.total_posts,
                    budgetUsed: statData.budget_active
                });
                setPerformance(perfData);

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
            <h2 className="text-xl font-bold text-slate-800">Tổng quan Marketing</h2>

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
                    {/* Placeholder for future date filter */}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium">Chiến dịch</th>
                                <th className="px-6 py-3 font-medium text-center">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Số Lead</th>
                                <th className="px-6 py-3 font-medium text-right">Doanh thu dự kiến</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {performance.length > 0 ? (
                                performance.map((camp) => (
                                    <tr key={camp.campaign_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{camp.title}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${camp.status === 'active' ? 'bg-green-100 text-green-800' :
                                                camp.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                {camp.status === 'active' ? 'Đang chạy' : camp.status === 'completed' ? 'Hoàn thành' : camp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-900">{camp.lead_count}</td>
                                        <td className="px-6 py-4 text-right text-slate-600">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(camp.revenue)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                                        Chưa có dữ liệu hiệu quả chiến dịch.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
