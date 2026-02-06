"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getRecruitmentKpiStats, RecruitmentKpiStats, updateRecruitmentKpiSettings } from "@/lib/recruitmentStore";
import { supabase } from "@/lib/supabaseClient";
import { Settings, X, Save, TrendingUp, Users, MessageSquare, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiDashboardProps {
    date: string;
}

export default function KpiDashboard({ date }: KpiDashboardProps) {
    const { user, role } = useAuth();
    const [stats, setStats] = useState<RecruitmentKpiStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // Settings Form State
    const [targets, setTargets] = useState({
        posts: 20,
        comments: 50,
        friends: 10
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const isAdmin = role === 'admin' || role === 'manager' || role === 'recruiter_manager';

    const loadStats = async () => {
        if (!user) return;
        try {
            const data = await getRecruitmentKpiStats(user.id, date);
            setStats(data);
            setTargets({
                posts: data.posts_target,
                comments: data.comments_target,
                friends: data.friends_target
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
                    filter: `user_id=eq.${user?.id}` // Only listen to my own changes
                },
                () => {
                    console.log("Realtime update received!");
                    loadStats(); // Re-fetch stats on any change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, date]);

    const handleSaveSettings = async () => {
        if (!user || !isAdmin) return;
        setSavingSettings(true);
        try {
            await updateRecruitmentKpiSettings({
                user_id: user.id,
                fb_posts_target: targets.posts,
                fb_comments_target: targets.comments,
                fb_friends_target: targets.friends
            });
            setShowSettings(false);
            loadStats(); // Refresh to reflect new targets
        } catch (error) {
            alert("Lỗi lưu cài đặt: " + error);
        } finally {
            setSavingSettings(false);
        }
    };

    if (loading) return <div className="h-24 animate-pulse bg-slate-100 rounded-xl mb-6"></div>;
    if (!stats) return null;

    const items = [
        {
            label: "Bài đăng",
            icon: Share2,
            count: stats.posts_count,
            target: stats.posts_target,
            color: "text-blue-600",
            bg: "bg-blue-50",
            bar: "bg-blue-500"
        },
        {
            label: "Bình luận",
            icon: MessageSquare,
            count: stats.comments_count,
            target: stats.comments_target,
            color: "text-orange-600",
            bg: "bg-orange-50",
            bar: "bg-orange-500"
        },
        {
            label: "Kết bạn",
            icon: Users,
            count: stats.friends_count,
            target: stats.friends_target,
            color: "text-purple-600",
            bg: "bg-purple-50",
            bar: "bg-purple-500"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {items.map((item, idx) => {
                    const percent = Math.min(100, Math.round((item.count / (item.target || 1)) * 100));
                    return (
                        <div key={idx} className="border border-slate-100 rounded-lg p-3 relative overflow-hiddenGroup">
                            <div className="flex justify-between items-start mb-2">
                                <div className={cn("p-2 rounded-lg", item.bg)}>
                                    <item.icon className={cn("w-4 h-4", item.color)} />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-900 leading-none">
                                        {item.count}<span className="text-sm font-normal text-slate-400">/{item.target}</span>
                                    </div>
                                    <p className={cn("text-xs font-medium mt-1",
                                        percent >= 100 ? "text-green-600" : "text-slate-500"
                                    )}>
                                        {percent}%
                                    </p>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", item.bar)}
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-slate-800">Cấu hình Mục tiêu ngày (KPI)</h3>
                            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mục tiêu Bài đăng</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-md px-3 py-2 text-sm outline-teal-500"
                                    value={targets.posts}
                                    onChange={(e) => setTargets({ ...targets, posts: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mục tiêu Bình luận (Seeding)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-md px-3 py-2 text-sm outline-teal-500"
                                    value={targets.comments}
                                    onChange={(e) => setTargets({ ...targets, comments: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mục tiêu Kết bạn</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-md px-3 py-2 text-sm outline-teal-500"
                                    value={targets.friends}
                                    onChange={(e) => setTargets({ ...targets, friends: parseInt(e.target.value) || 0 })}
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
