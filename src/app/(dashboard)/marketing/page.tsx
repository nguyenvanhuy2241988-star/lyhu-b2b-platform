"use client";

import { useEffect, useState } from "react";
import { FileText, Calendar, Database, LayoutDashboard, Search, Users, UserPlus, Shield, Bot, Zap, Megaphone, TrendingUp, Key } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from "@/components/auth/AuthProvider";
import { StatsSkeleton } from "@/components/ui/SkeletonUI";
import { fetchMarketingStats, fetchCampaignPerformance, CampaignPerformance } from "@/lib/marketingStore";
import BotActivityLog from "@/components/marketing/BotActivityLog";
import BotConfigModal from "@/components/marketing/BotConfigModal";

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
    const [activeScript, setActiveScript] = useState<{ name: string, title: string } | null>(null);

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
                                const fetchPerfData = async () => { // Renamed to avoid conflict with useEffect's fetchStats
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
                <div className="overflow-x-auto">
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

                {/* COMMAND CENTER & LOGS */}
                <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* LEFT: CONTROLS */}
                    <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Bot className="w-24 h-24 text-blue-600" />
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Bot className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Command Center</h2>
                                <p className="text-slate-500">Trung tâm điều khiển BOT tự động</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CommandCard
                                title="Săn Khách Hàng"
                                desc="Tìm & Kết bạn theo từ khóa"
                                icon={<Search className="w-5 h-5" />}
                                color="blue"
                                onClick={() => setActiveScript({ name: 'execute_search_add.js', title: 'Săn Khách Hàng' })}
                            />
                            <CommandCard
                                title="Quét Hội Nhóm"
                                desc="Tìm & Xin vào nhóm tiềm năng"
                                icon={<Users className="w-5 h-5" />}
                                color="indigo"
                                onClick={() => setActiveScript({ name: 'group_finder.js', title: 'Quét Hội Nhóm' })}
                            />
                            <CommandCard
                                title="Mời Bạn Bè"
                                desc="Mời bạn bè Like Page (Traffic)"
                                icon={<UserPlus className="w-5 h-5" />}
                                color="green"
                                onClick={() => setActiveScript({ name: 'invite_friend_page.js', title: 'Mời Bạn Bè' })}
                            />
                            <CommandCard
                                title="Lá Chắn Ảo"
                                desc="Giả lập hành vi & Nuôi nick"
                                icon={<Shield className="w-5 h-5" />}
                                color="slate"
                                onClick={() => setActiveScript({ name: 'defense_engine.js', title: 'Lá Chắn Ảo' })}
                            />
                            <CommandCard
                                title="Đăng Nhập"
                                desc="Mở trình duyệt để Login tay"
                                icon={<Key className="w-5 h-5" />}
                                color="orange"
                                onClick={() => setActiveScript({ name: 'manual_login.js', title: 'Đăng Nhập' })}
                            />
                        </div>
                    </div>

                    {/* RIGHT: LIVE LOGS */}
                    <div className="xl:col-span-1">
                        <BotActivityLog />
                    </div>
                </div>

            </div>
        </div>

            {/* Config Modal */ }
    {
        activeScript && (
            <BotConfigModal
                isOpen={!!activeScript}
                onClose={() => setActiveScript(null)}
                scriptName={activeScript.name}
                title={activeScript.title}
            />
        )
    }
        </div >
    );
}

function CommandCard({ title, desc, icon, color, onClick }: { title: string, desc: string, icon: React.ReactNode, color: string, onClick: () => void }) {

    // Simplification: CommandCard is now just a trigger button. Running logic moved to Modal.
    const colors: any = {
        blue: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
        indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200",
        green: "bg-green-50 text-green-600 hover:bg-green-100 border-green-200",
        slate: "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200",
        orange: "bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200"
    };

    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-start p-4 rounded-xl border transition-all ${colors[color]} hover:-translate-y-1`}
        >
            <div className="flex items-center justify-between w-full mb-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    {icon}
                </div>
            </div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm opacity-80 text-left">{desc}</p>
        </button>
    );
}

import { toast } from 'sonner';
