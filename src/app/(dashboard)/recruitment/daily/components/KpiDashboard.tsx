"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPostLogs, PostLog } from "@/lib/recruitmentStore";
import { fetchActiveKpiMetrics, KpiMetricDefinition } from "@/lib/kpiSalaryStore";
import { supabase } from "@/lib/supabaseClient";
import { Settings, X, Save, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiDashboardProps {
    date: string;
    userId: string;
}

// =====================================================
// Map a KPI metric to its count from post_logs
// Same logic as resolveActualKey in kpiSalaryStore.ts
// but returns the actual count from logs for a single day
// =====================================================
function countLogsForMetric(metricKey: string, metricLabel: string, logs: PostLog[]): number {
    // 1. Try direct key match first
    const key = metricKey.toLowerCase();
    const label = metricLabel.toLowerCase();

    // Facebook Group/Page posts
    if (key === 'fb_group_posts' || (label.includes('hội nhóm') || label.includes('group')) && (label.includes('facebook') || label.includes('fb'))) {
        return logs.filter(l => l.activity_type === 'post' && ['facebook_group', 'facebook_page'].includes(l.platform)).length;
    }

    // Facebook comments/seeding
    if (key === 'fb_comments' || ((label.includes('comment') || label.includes('seeding') || label.includes('bình luận')) && (label.includes('facebook') || label.includes('fb')) && !label.includes('tiktok'))) {
        return logs.filter(l => l.activity_type === 'comment' && ['facebook_group', 'facebook_page'].includes(l.platform)).length;
    }

    // Facebook friends
    if (key === 'fb_friends' || ((label.includes('kết bạn') || label.includes('ket ban')) && label.includes('facebook'))) {
        return logs.filter(l => l.activity_type === 'friend' && l.platform !== 'zalo').length;
    }

    // Facebook personal posts
    if (key === 'fb_personal_posts' || ((label.includes('đăng bài') || label.includes('bài')) && (label.includes('cá nhân') || label.includes('ca nhan')) && !label.includes('zalo') && !label.includes('threads') && !label.includes('tiktok'))) {
        return logs.filter(l => l.activity_type === 'post' && l.platform === 'facebook_personal').length;
    }

    // Threads posts
    if (key === 'threads_posts' || (label.includes('threads') && (label.includes('bài') || label.includes('post') || label.includes('đăng') || label.includes('kênh')) && !label.includes('comment') && !label.includes('cmt'))) {
        return logs.filter(l => l.activity_type === 'post' && l.platform === 'threads').length;
    }

    // Threads comments
    if (key === 'threads_comments' || (label.includes('threads') && (label.includes('comment') || label.includes('cmt') || label.includes('bình luận')))) {
        return logs.filter(l => l.activity_type === 'comment' && l.platform === 'threads').length;
    }

    // TikTok posts
    if (key === 'tiktok_posts' || (label.includes('tiktok') && (label.includes('bài') || label.includes('post') || label.includes('đăng')) && !label.includes('comment') && !label.includes('seeding') && !label.includes('đạo'))) {
        return logs.filter(l => l.activity_type === 'post' && l.platform === 'tiktok').length;
    }

    // TikTok seeding/comments
    if (key === 'tiktok_comments' || (label.includes('tiktok') && (label.includes('comment') || label.includes('seeding') || label.includes('đạo')))) {
        return logs.filter(l => l.activity_type === 'comment' && l.platform === 'tiktok').length;
    }

    // Zalo friends
    if (key === 'zalo_friends' || ((label.includes('kết bạn') || label.includes('ket ban')) && label.includes('zalo'))) {
        return logs.filter(l => l.activity_type === 'friend' && l.platform === 'zalo').length;
    }

    // Zalo posts/diary
    if (key === 'zalo_posts' || key === 'zalo_diary' || (label.includes('zalo') && (label.includes('bài') || label.includes('nhật ký') || label.includes('diary') || label.includes('đăng')))) {
        return logs.filter(l => l.activity_type === 'post' && l.platform === 'zalo').length;
    }

    // LinkedIn
    if (key === 'linkedin_posts' || label.includes('linkedin')) {
        return logs.filter(l => l.activity_type === 'post' && l.platform === 'linkedin').length;
    }

    // Default: no match - return 0
    return 0;
}

// Color palette for KPI cards
const COLORS = [
    { text: "text-primary-600", bg: "bg-primary-50", bar: "bg-primary-500" },
    { text: "text-indigo-600", bg: "bg-indigo-50", bar: "bg-indigo-500" },
    { text: "text-teal-600", bg: "bg-teal-50", bar: "bg-teal-500" },
    { text: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500" },
    { text: "text-purple-600", bg: "bg-purple-50", bar: "bg-purple-500" },
    { text: "text-rose-600", bg: "bg-rose-50", bar: "bg-rose-500" },
    { text: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-500" },
    { text: "text-cyan-600", bg: "bg-cyan-50", bar: "bg-cyan-500" },
    { text: "text-orange-600", bg: "bg-orange-50", bar: "bg-orange-500" },
    { text: "text-pink-600", bg: "bg-pink-50", bar: "bg-pink-500" },
    { text: "text-slate-600", bg: "bg-slate-100", bar: "bg-slate-500" },
];

const WORKING_DAYS = 26; // Standard working days per month

export default function KpiDashboard({ date, userId }: KpiDashboardProps) {
    const { user, role } = useAuth();
    const [metrics, setMetrics] = useState<KpiMetricDefinition[]>([]);
    const [logs, setLogs] = useState<PostLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [userTargets, setUserTargets] = useState<Record<string, number>>({});

    const isAdmin = role === 'admin' || role === 'manager' || role === 'recruiter_manager';

    const loadData = async () => {
        if (!userId) return;
        try {
            // 1. Fetch KPI metric definitions (same source as earnings page)
            const kpiMetrics = await fetchActiveKpiMetrics('recruiter');

            // 2. Fetch user's KPI target overrides from user_kpi_settings
            const { data: kpiSettings } = await supabase
                .rpc('get_user_kpi_settings', { p_user_id: userId });
            const targets = (kpiSettings as any)?.kpi_targets || {};

            // 3. Fetch post logs for this specific date
            const postLogs = await getPostLogs(userId, date);

            setMetrics(kpiMetrics);
            setUserTargets(targets);
            setLogs(postLogs);
        } catch (error) {
            console.error("Error loading KPI data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadData();

        // Realtime: reload on post_log changes
        const channel = supabase
            .channel('recruitment-kpi-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'recruitment_post_logs',
                    filter: `user_id=eq.${userId}`
                },
                () => {
                    console.log("Realtime update received!");
                    loadData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, date]);

    if (loading) return <div className="h-24 animate-pulse bg-slate-100 rounded-xl mb-6"></div>;
    if (metrics.length === 0) return null;

    // Build display items from kpi_metric_definitions
    const items = metrics
        .filter(m => m.salary_percent > 0)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((metric, idx) => {
            const monthlyTarget = userTargets[metric.key] || metric.monthly_target || 0;
            const dailyTarget = Math.round(monthlyTarget / WORKING_DAYS);
            const count = countLogsForMetric(metric.key, metric.label, logs);
            const color = COLORS[idx % COLORS.length];

            return {
                label: metric.label,
                key: metric.key,
                count,
                target: dailyTarget,
                ...color
            };
        });

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 relative">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                    Tiến độ công việc
                </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {items.map((item, idx) => {
                    const percent = item.target > 0 ? Math.min(100, Math.round((item.count / item.target) * 100)) : (item.count > 0 ? 100 : 0);
                    return (
                        <div key={idx} className="border border-slate-100 rounded-lg p-2 relative overflow-hidden flex flex-col justify-between min-h-[100px]">
                            <div className="flex justify-between items-start mb-1">
                                <div className={cn("p-1.5 rounded-lg", item.bg)}>
                                    <Target className={cn("w-3.5 h-3.5", item.text)} />
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-slate-900 leading-none">
                                        {item.count}<span className="text-[10px] font-normal text-slate-400">/{item.target}</span>
                                    </div>
                                    <p className={cn("text-[10px] font-medium mt-0.5",
                                        percent >= 100 ? "text-green-600" : "text-slate-500"
                                    )}>
                                        {percent}%
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-medium truncate mb-1" title={item.label}>{item.label}</p>
                                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-500", item.bar)}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
