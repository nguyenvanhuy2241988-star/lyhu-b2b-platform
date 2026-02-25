"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTelesalesKpiStats, TelesalesKpiStats, updateTelesalesKpiSettings } from "@/lib/telesalesDailyStore";
import { supabase } from "@/lib/supabaseClient";
import { Settings, X, Save, TrendingUp, Phone, Users, MessageSquare, Share2, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface TelesalesKpiDashboardProps {
    date: string;
    userId: string;
}

export default function TelesalesKpiDashboard({ date, userId }: TelesalesKpiDashboardProps) {
    const { user, role } = useAuth();
    const [stats, setStats] = useState<TelesalesKpiStats | null>(null);

    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Settings Form State
    const [targets, setTargets] = useState({
        calls: 50,
        self_sourced_data: 10,
        fb_group_posts: 20,
        fb_comments: 50,
        fb_friends: 10,
        fb_personal_posts: 5,
        zalo_posts: 5
    });
    const [savingSettings, setSavingSettings] = useState(false);

    const isAdmin = role === 'admin' || role === 'manager' || role === 'telesales_manager';

    const loadStats = async () => {
        if (!userId) return;
        try {
            const data = await getTelesalesKpiStats(userId, date);
            setStats(data);
            setTargets({
                calls: data.calls_target,
                self_sourced_data: data.self_sourced_data_target,
                fb_group_posts: data.fb_group_posts_target,
                fb_comments: data.fb_comments_target,
                fb_friends: data.fb_friends_target,
                fb_personal_posts: data.fb_personal_posts_target,
                zalo_posts: data.zalo_posts_target
            });
        } catch (error: any) {
            console.error("Error loading KPI stats:", error);
            setError(error.message || JSON.stringify(error) || "Lỗi không xác định");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();

        // Realtime Subscription
        const channel = supabase
            .channel('telesales-kpi-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'telesales_daily_activities',
                    filter: `user_id=eq.${userId}` // Listen to target user changes
                },
                () => {
                    console.log("Realtime update received for activities!");
                    loadStats(); // Re-fetch stats on any change
                }
            )
            .subscribe();

        // Subscribe to Settings changes (if Admin updates targets)
        const settingsChannel = supabase
            .channel('telesales-kpi-settings-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'telesales_kpi_settings',
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
            await updateTelesalesKpiSettings({
                user_id: userId, // Update for target user
                calls_target: targets.calls,
                self_sourced_data_target: targets.self_sourced_data,
                fb_group_posts_target: targets.fb_group_posts,
                fb_comments_target: targets.fb_comments,
                fb_friends_target: targets.fb_friends,
                fb_personal_posts_target: targets.fb_personal_posts,
                zalo_posts_target: targets.zalo_posts
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
    if (error) return (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 mb-6 text-sm flex flex-col gap-1">
            <span className="font-bold">Lỗi tải dữ liệu KPI:</span>
            <span>{error}</span>
            <span className="text-red-500 text-xs mt-1">(Vui lòng kiểm tra xem Database đã được cập nhật chưa hoặc báo lỗi này cho Dev)</span>
        </div>
    );
    if (!stats) return null;

    const items = [
        {
            label: "Cuộc gọi",
            icon: Phone,
            count: stats.calls_count,
            target: stats.calls_target,
            color: "text-blue-600",
            bg: "bg-blue-50",
            bar: "bg-blue-500"
        },
        {
            label: "Data tự tìm",
            icon: Database,
            count: stats.self_sourced_data_count,
            target: stats.self_sourced_data_target,
            color: "text-teal-600",
            bg: "bg-teal-50",
            bar: "bg-teal-500"
        },
        {
            label: "FB Groups/Page",
            icon: Share2,
            count: stats.fb_group_posts_count,
            target: stats.fb_group_posts_target,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            bar: "bg-indigo-500"
        },
        {
            label: "FB Comment (Seed)",
            icon: MessageSquare,
            count: stats.fb_comments_count,
            target: stats.fb_comments_target,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            bar: "bg-indigo-500"
        },
        {
            label: "Kết bạn FB",
            icon: Users,
            count: stats.fb_friends_count,
            target: stats.fb_friends_target,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            bar: "bg-indigo-500"
        },
        {
            label: "FB Cá Nhân",
            icon: Share2,
            count: stats.fb_personal_posts_count,
            target: stats.fb_personal_posts_target,
            color: "text-purple-600",
            bg: "bg-purple-50",
            bar: "bg-purple-500"
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
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Tiến độ Thực hiện Target KPI
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
                        <div key={idx} className="border border-slate-100 rounded-lg p-3 relative overflow-hidden flex flex-col justify-between min-h-[100px] hover:border-blue-100 hover:shadow-sm transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div className={cn("p-2 rounded-lg", item.bg)}>
                                    <item.icon className={cn("w-4 h-4", item.color)} />
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-slate-900 leading-none">
                                        {item.count}<span className="text-[11px] font-normal text-slate-400 ml-1">/{item.target}</span>
                                    </div>
                                    <p className={cn("text-[11px] font-bold mt-1",
                                        percent >= 100 ? "text-green-600" : "text-slate-500"
                                    )}>
                                        {percent}%
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-600 font-semibold truncate mb-1.5" title={item.label}>{item.label}</p>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-700 ease-out", item.bar)}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Settings Modal */}
            {showSettings && isAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-slate-800">Cấu hình Mục tiêu ngày (KPI) Telesales</h3>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                            <h4 className="md:col-span-2 font-bold text-slate-800 border-b pb-1 text-sm text-blue-900">Chỉ số Cốt lõi</h4>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Cuộc gọi (Target)</label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={targets.calls}
                                        onChange={(e) => setTargets({ ...targets, calls: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Data Tự tìm</label>
                                <div className="relative">
                                    <Database className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                        value={targets.self_sourced_data}
                                        onChange={(e) => setTargets({ ...targets, self_sourced_data: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <h4 className="md:col-span-2 font-bold text-slate-800 border-b pb-1 text-sm mt-3 text-indigo-900">Facebook Marketing</h4>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">FB Groups/Page (Bài)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={targets.fb_group_posts}
                                    onChange={(e) => setTargets({ ...targets, fb_group_posts: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">FB Seeding (Cmt)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={targets.fb_comments}
                                    onChange={(e) => setTargets({ ...targets, fb_comments: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Kết bạn FB</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={targets.fb_friends}
                                    onChange={(e) => setTargets({ ...targets, fb_friends: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">FB Cá nhân (Bài)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={targets.fb_personal_posts}
                                    onChange={(e) => setTargets({ ...targets, fb_personal_posts: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <h4 className="md:col-span-2 font-bold text-slate-800 border-b pb-1 text-sm mt-3 text-blue-900">Nền tảng khác</h4>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Zalo (Bài)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={targets.zalo_posts}
                                    onChange={(e) => setTargets({ ...targets, zalo_posts: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 rounded-b-xl">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                                className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
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
