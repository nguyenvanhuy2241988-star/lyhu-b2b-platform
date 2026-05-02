"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Save, Filter, MessageSquare, Briefcase, FileText } from "lucide-react";
import { DailyPlatformFunnel, getDailyPlatformFunnels, upsertDailyPlatformFunnels, getPostLogs } from "@/lib/recruitmentStore";

interface PlatformFunnelManagerProps {
    userId: string;
    date: string;
}

const PLATFORMS = [
    { id: 'facebook', label: 'Facebook' },
    { id: 'zalo', label: 'Zalo' },
    { id: 'threads', label: 'Threads' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'linkedin', label: 'LinkedIn' },
];

export default function PlatformFunnelManager({ userId, date }: PlatformFunnelManagerProps) {
    const [funnels, setFunnels] = useState<DailyPlatformFunnel[]>([]);
    const [postCounts, setPostCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [userId, date]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [funnelData, logsData] = await Promise.all([
                getDailyPlatformFunnels(userId, date),
                getPostLogs(userId, date)
            ]);

            // Map existing funnels
            const funnelMap = new Map(funnelData.map(f => [f.platform, f]));
            
            // Ensure all platforms have an entry
            const initializedFunnels: DailyPlatformFunnel[] = PLATFORMS.map(p => {
                return funnelMap.get(p.id) || {
                    user_id: userId,
                    date: date,
                    platform: p.id,
                    inquiries_count: 0,
                    cvs_count: 0,
                    interviews_count: 0
                };
            });
            setFunnels(initializedFunnels);

            // Calculate auto post counts
            const counts: Record<string, number> = {};
            logsData.forEach(log => {
                if (log.activity_type !== 'post') return;
                let platformKey: string = log.platform;
                if (platformKey.startsWith('facebook')) platformKey = 'facebook';
                counts[platformKey] = (counts[platformKey] || 0) + 1;
            });
            setPostCounts(counts);

        } catch (error) {
            console.error("Error loading funnels:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (platform: string, field: keyof DailyPlatformFunnel, value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) && value !== '') return;
        
        setFunnels(prev => prev.map(f => {
            if (f.platform === platform) {
                return { ...f, [field]: value === '' ? 0 : numValue };
            }
            return f;
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await upsertDailyPlatformFunnels(funnels);
            alert("Đã lưu ma trận phễu chuyển đổi thành công!");
        } catch (error) {
            console.error("Error saving funnels:", error);
            alert("Lỗi khi lưu phễu chuyển đổi.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500" /></div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                    Hiệu quả Nguồn Tuyển dụng (Platform Funnel)
                </h2>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center gap-2 transition-colors"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu Bảng
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-medium">
                        <tr>
                            <th className="px-4 py-3 rounded-tl-lg">Nền tảng</th>
                            <th className="px-4 py-3 text-center">Đầu vào (Bài đã đăng)</th>
                            <th className="px-4 py-3 text-center text-blue-600"><MessageSquare className="w-4 h-4 inline mr-1"/>Số người hỏi việc</th>
                            <th className="px-4 py-3 text-center text-orange-600"><FileText className="w-4 h-4 inline mr-1"/>Số CV thu được</th>
                            <th className="px-4 py-3 text-center text-green-600 rounded-tr-lg"><Briefcase className="w-4 h-4 inline mr-1"/>Số hẹn Phỏng vấn</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {PLATFORMS.map(platform => {
                            const funnel = funnels.find(f => f.platform === platform.id);
                            if (!funnel) return null;
                            const postsCount = postCounts[platform.id] || 0;

                            return (
                                <tr key={platform.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-700">{platform.label}</td>
                                    <td className="px-4 py-3 text-center font-bold text-slate-500">
                                        {postsCount} bài
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full text-center p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-blue-700 bg-blue-50/50"
                                            value={funnel.inquiries_count || ''}
                                            onChange={(e) => handleChange(platform.id, 'inquiries_count', e.target.value)}
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full text-center p-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none text-orange-700 bg-orange-50/50"
                                            value={funnel.cvs_count || ''}
                                            onChange={(e) => handleChange(platform.id, 'cvs_count', e.target.value)}
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full text-center p-2 border border-green-200 rounded-md focus:ring-2 focus:ring-green-500 outline-none text-green-700 bg-green-50/50"
                                            value={funnel.interviews_count || ''}
                                            onChange={(e) => handleChange(platform.id, 'interviews_count', e.target.value)}
                                            placeholder="0"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
