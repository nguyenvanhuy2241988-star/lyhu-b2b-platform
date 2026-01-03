'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';

export default function MarketingDashboard() {
    const [stats, setStats] = useState({
        activeCampaigns: 0,
        upcomingPosts: 0,
        totalBudget: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const supabase = createClient();
            const [campaignsRes, postsRes] = await Promise.all([
                supabase.from('marketing_campaigns').select('budget', { count: 'exact' }).eq('status', 'active'),
                supabase.from('marketing_posts').select('*', { count: 'exact', head: true }).eq('status', 'scheduled')
            ]);

            let budget = 0;
            if (campaignsRes.data) {
                budget = campaignsRes.data.reduce((acc: number, curr: { budget?: number }) => acc + (curr.budget || 0), 0);
            }

            setStats({
                activeCampaigns: campaignsRes.count || 0,
                upcomingPosts: postsRes.count || 0,
                totalBudget: budget
            });
        };
        fetchStats();
    }, []);

    const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Marketing Dashboard</h1>
                <p className="text-slate-500 mt-2">Quản lý chiến dịch và nội dung truyền thông</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/marketing/campaigns" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Megaphone className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Chiến dịch đang chạy</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.activeCampaigns}</h3>
                        </div>
                    </div>
                </Link>

                <Link href="/marketing/content" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Bài viết sắp đăng</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.upcomingPosts}</h3>
                        </div>
                    </div>
                </Link>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Ngân sách đang chạy</p>
                            <h3 className="text-2xl font-bold text-slate-800">{formatMoney(stats.totalBudget)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">Truy cập nhanh</h3>
                    <div className="space-y-3">
                        <Link href="/marketing/campaigns" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-fuchsia-50 hover:text-fuchsia-700 transition">
                            <span className="font-medium">Quản lý Chiến dịch</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/marketing/content" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-fuchsia-50 hover:text-fuchsia-700 transition">
                            <span className="font-medium">Lịch đăng bài (Content Calendar)</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-fuchsia-600 to-pink-600 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-xl mb-2">Lên kế hoạch nội dung?</h3>
                        <p className="text-fuchsia-100 mb-6">Tạo bài viết mới và lên lịch đăng để duy trì tương tác.</p>
                    </div>
                    <Link href="/marketing/content" className="bg-white text-fuchsia-700 px-4 py-3 rounded-xl font-bold text-center hover:bg-fuchsia-50 transition">
                        + Soạn bài viết mới
                    </Link>
                </div>
            </div>
        </div>
    );
}
