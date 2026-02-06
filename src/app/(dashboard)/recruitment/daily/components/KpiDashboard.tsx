"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getRecruitmentKpiStats, RecruitmentKpiStats, updateRecruitmentKpiSettings } from "@/lib/recruitmentStore";
import { supabase } from "@/lib/supabaseClient";
import { Settings, X, Save, TrendingUp, Users, MessageSquare, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiDashboardProps {
    date: string;
    userId: string;
}

export default function KpiDashboard({ date, userId }: KpiDashboardProps) {
    const { user, role } = useAuth();
    const [stats, setStats] = useState<RecruitmentKpiStats | null>(null);

    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // Settings Form State
    const [targets, setTargets] = useState({
        posts: 20,
        comments: 50,
        friends: 10,
        fb_personal: 5,
        threads_posts: 10,
        threads_comments: 20,
        zalo: 5
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const isAdmin = role === 'admin' || role === 'manager' || role === 'recruiter_manager';

    const loadStats = async () => {
        if (!userId) return;
        try {
            const data = await getRecruitmentKpiStats(userId, date);
            setStats(data);
            setTargets({
                posts: data.posts_target,
                comments: data.comments_target,
                friends: data.friends_target,
                fb_personal: data.fb_personal_posts_target,
                threads_posts: data.threads_posts_target,
                threads_comments: data.threads_comments_target,
                zalo: data.zalo_posts_target
            });
        } catch (error) {
            console.error("Error loading KPI stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();

        // Realtime Subscription
        const channel = supabase
            .channel('recruitment-kpi-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'recruitment_post_logs',
                    filter: `user_id=eq.${userId}` // Listen to target user changes
                },
                () => {
                    console.log("Realtime update received!");
                    loadStats(); // Re-fetch stats on any change
                }
            )
            .subscribe();

        // Subscribe to Settings changes (if Admin updates targets)
        const settingsChannel = supabase
            .channel('recruitment-kpi-settings-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'recruitment_kpi_settings',
                    filter: `user_id=eq.${userId}`
                },
                () => {
                    console.log("Settings update received!");
                    loadStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(settingsChannel);
        };
    }, [userId, date]);

    const handleSaveSettings = async () => {
        if (!userId || !isAdmin) return;
        setSavingSettings(true);
        try {
            await updateRecruitmentKpiSettings({
                user_id: userId, // Update for target user
                fb_posts_target: targets.posts,
                fb_comments_target: targets.comments,
                fb_friends_target: targets.friends,
                fb_personal_posts_target: targets.fb_personal,
                threads_posts_target: targets.threads_posts,
                threads_comments_target: targets.threads_comments,
                zalo_posts_target: targets.zalo
            });
            setShowSettings(false);
            loadStats(); // Refresh to reflect new targets
        } catch (error: any) {
            console.error(error);
            alert("Lỗi lưu cài đặt: " + (error.message || JSON.stringify(error)));
        } finally {
            setSavingSettings(false);
        }
    };

    if (loading) return <div className="h-24 animate-pulse bg-slate-100 rounded-xl mb-6"></div>;
    if (!stats) return null;

    const items = [
        {
            label: "FB Groups/Page",
            icon: Share2,
            count: stats.posts_count,
            target: stats.posts_target,
            color: "text-blue-600",
            bg: "bg-blue-50",
            bar: "bg-blue-500"
        },
        {
            label: "FB Comment (Seed)",
            icon: MessageSquare,
            count: stats.comments_count,
            target: stats.comments_target,
            color: "text-blue-600",
            bg: "bg-blue-50",
            bar: "bg-blue-500"
        },
        {
            label: "Kết bạn FB",
            icon: Users,
            count: stats.friends_count,
            target: stats.friends_target,
            color: "text-blue-600",
            bg: "bg-blue-50",
            bar: "bg-blue-500"
        },
        {
            label: "FB Cá Nhân",
            icon: Share2,
            count: stats.fb_personal_posts_count,
            target: stats.fb_personal_posts_target,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            bar: "bg-indigo-500"
        },
        {
            label: "Threads Bài",
            icon: Share2,
            count: stats.threads_posts_count,
            target: stats.threads_posts_target,
            color: "text-black",
            bg: "bg-slate-100",
            bar: "bg-slate-800"
        },
        {
            label: "Threads Cmt",
            icon: MessageSquare,
            count: stats.threads_comments_count,
            target: stats.threads_comments_target,
            color: "text-black",
            bg: "bg-slate-100",
            bar: "bg-slate-800"
        },
        {
            label: "Zalo Bài",
            icon: Share2,
            count: stats.zalo_posts_count,
            target: stats.zalo_posts_target,
            color: "text-blue-500",
            bg: "bg-blue-50",
            bar: "bg-blue-400"
        }
    ];

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 relative">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                    Tiến độ công việc
                </h2>
                {isAdmin && (
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        title="Cấu hình KPI"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {items.map((item, idx) => {
                    const percent = Math.min(100, Math.round((item.count / (item.target || 1)) * 100));
                    return (
                        <div key={idx} className="border border-slate-100 rounded-lg p-2 relative overflow-hiddenGroup flex flex-col justify-between min-h-[100px]">
                            <div className="flex justify-between items-start mb-1">
                                <div className={cn("p-1.5 rounded-lg", item.bg)}>
                                    <item.icon className={cn("w-3.5 h-3.5", item.color)} />
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

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-slate-800">Cấu hình Mục tiêu ngày (KPI)</h3>
                            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                            <h4 className="md:col-span-2 font-medium text-slate-900 border-b pb-1 text-sm">Facebook Cơ bản</h4>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">FB Groups/Page (Bài)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-md px-3 py-1.5 text-sm outline-teal-500"
                                    value={targets.posts}
                                    onChange={(e) => setTargets({ ...targets, posts: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">FB Seeding (Cmt)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-md px-3 py-1.5 text-sm outline-teal-500"
                                    value={targets.comments}
                                    onChange={(e) => setTargets({ ...targets, comments: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Kết bạn mới</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-md px-3 py-1.5 text-sm outline-teal-500"
                                    value={targets.friends}
                                    onChange={(e) => setTargets({ ...targets, friends: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <h4 className="md:col-span-2 font-medium text-slate-900 border-b pb-1 text-sm mt-2">Mở rộng</h4>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">FB Cá nhân (Bài)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-md px-3 py-1.5 text-sm outline-teal-500"
                                    value={targets.fb_personal}
                                    onChange={(e) => setTargets({ ...targets, fb_personal: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Zalo (Bài)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-md px-3 py-1.5 text-sm outline-teal-500"
                                    value={targets.zalo}
                                    onChange={(e) => setTargets({ ...targets, zalo: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Threads (Bài)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-md px-3 py-1.5 text-sm outline-teal-500"
                                    value={targets.threads_posts}
                                    onChange={(e) => setTargets({ ...targets, threads_posts: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Threads (Cmt)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-md px-3 py-1.5 text-sm outline-teal-500"
                                    value={targets.threads_comments}
                                    onChange={(e) => setTargets({ ...targets, threads_comments: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-2">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                                className="px-4 py-1.5 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 font-medium flex items-center gap-1"
                            >
                                {savingSettings ? "Đang lưu..." : <><Save className="w-4 h-4" /> Lưu cấu hình</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
