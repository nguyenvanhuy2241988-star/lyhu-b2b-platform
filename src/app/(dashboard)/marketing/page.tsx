"use client";

import { useEffect, useState } from "react";
import { Megaphone, FileText, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { StatsSkeleton } from "@/components/ui/SkeletonUI";
import { supabase } from "@/lib/supabaseClient";

export default function MarketingDashboard() {
    const { user, isLoading: authIsLoading } = useAuth();
    const [stats, setStats] = useState({
        activeCampaigns: 0,
        scheduledPosts: 0,
        totalPosts: 0,
        budgetUsed: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                // Fetch stats from Supabase
                // Mocking for now as tables might be empty
                /*
                const { count: campaignsCount } = await supabase
                    .from('marketing_campaigns')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active');
                
                const { count: postsCount } = await supabase
                    .from('marketing_posts')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'scheduled');
                */

                // Temporary Mock
                setStats({
                    activeCampaigns: 0,
                    scheduledPosts: 0,
                    totalPosts: 0,
                    budgetUsed: 0
                });

            } catch (error) {
                console.error("Error fetching marketing stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);


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

            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center py-20">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Megaphone className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Chào mừng đến với Marketing Dashboard</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    Bắt đầu bằng cách tạo Chiến dịch mới hoặc lên lịch đăng bài truyền thông.
                </p>
            </div>
        </div>
    );
}
