// src/app/(dashboard)/telesales/components/TelesalesActivityLogModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Save, Calendar, CheckSquare } from "lucide-react";
import { getDailyReportTelesales, upsertDailyReportTelesales, TelesalesDailyActivity } from "@/lib/telesalesDailyStore";

interface TelesalesActivityLogModalProps {
    date: string;
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TelesalesActivityLogModal({ date, userId, onClose, onSuccess }: TelesalesActivityLogModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<TelesalesDailyActivity>>({
        user_id: userId,
        report_date: date,
        calls_completed: 0,
        self_sourced_data: 0,
        fb_group_posts: 0,
        fb_comments: 0,
        fb_friends: 0,
        fb_personal_posts: 0,
        zalo_posts: 0,
        notes: "",
    });

    useEffect(() => {
        const fetchExistingReport = async () => {
            try {
                const existing = await getDailyReportTelesales(date, userId);
                if (existing) {
                    setFormData({
                        user_id: userId,
                        report_date: date,
                        calls_completed: existing.calls_completed || 0,
                        self_sourced_data: existing.self_sourced_data || 0,
                        fb_group_posts: existing.fb_group_posts || 0,
                        fb_comments: existing.fb_comments || 0,
                        fb_friends: existing.fb_friends || 0,
                        fb_personal_posts: existing.fb_personal_posts || 0,
                        zalo_posts: existing.zalo_posts || 0,
                        notes: existing.notes || "",
                    });
                }
            } catch (err: any) {
                console.error("Error fetching report:", err);
                // Not a fatal error if report doesn't exist yet
            } finally {
                setLoading(false);
            }
        };

        if (userId && date) {
            fetchExistingReport();
        }
    }, [userId, date]);

    const handleInputChange = (field: keyof TelesalesDailyActivity, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!userId || !date) return;
        setSaving(true);
        setError(null);

        try {
            await upsertDailyReportTelesales(formData);
            onSuccess();
        } catch (err: any) {
            console.error("Error saving report:", err);
            setError(err.message || "Đã xảy ra lỗi khi lưu báo cáo.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <CheckSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Cập nhật Tiến độ công việc</h2>
                            <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Ngày báo cáo: <span className="text-blue-600 font-semibold">{date}</span></span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* Section: Cuộc gọi & Data */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider text-blue-800/70 border-b border-slate-100 pb-2">Cuộc gọi & Data Tự kiếm</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-700 text-sm">Số cuộc gọi</p>
                                        </div>
                                        <input
                                            type="number" min="0"
                                            value={formData.calls_completed}
                                            onChange={(e) => handleInputChange('calls_completed', parseInt(e.target.value) || 0)}
                                            className="w-20 text-center font-bold text-lg text-blue-700 bg-white border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
                                        />
                                    </div>
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-teal-200 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-700 text-sm">Data tự kiếm</p>
                                        </div>
                                        <input
                                            type="number" min="0"
                                            value={formData.self_sourced_data}
                                            onChange={(e) => handleInputChange('self_sourced_data', parseInt(e.target.value) || 0)}
                                            className="w-20 text-center font-bold text-lg text-teal-700 bg-white border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none shadow-sm transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Tương tác Mạng Xã Hội */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider text-indigo-800/70 border-b border-slate-100 pb-2">Marketing Online (FB/Zalo)</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-700 text-sm">FB Groups (Bài đăng)</p>
                                        </div>
                                        <input
                                            type="number" min="0"
                                            value={formData.fb_group_posts}
                                            onChange={(e) => handleInputChange('fb_group_posts', parseInt(e.target.value) || 0)}
                                            className="w-20 text-center font-bold text-lg text-indigo-700 bg-white border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                                        />
                                    </div>

                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-700 text-sm">FB Seeding (Comment)</p>
                                        </div>
                                        <input
                                            type="number" min="0"
                                            value={formData.fb_comments}
                                            onChange={(e) => handleInputChange('fb_comments', parseInt(e.target.value) || 0)}
                                            className="w-20 text-center font-bold text-lg text-indigo-700 bg-white border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                                        />
                                    </div>

                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-700 text-sm">FB Bạn mới (Add Friend)</p>
                                        </div>
                                        <input
                                            type="number" min="0"
                                            value={formData.fb_friends}
                                            onChange={(e) => handleInputChange('fb_friends', parseInt(e.target.value) || 0)}
                                            className="w-20 text-center font-bold text-lg text-indigo-700 bg-white border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                                        />
                                    </div>

                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-700 text-sm">Zalo Cá nhân (Bài)</p>
                                        </div>
                                        <input
                                            type="number" min="0"
                                            value={formData.zalo_posts}
                                            onChange={(e) => handleInputChange('zalo_posts', parseInt(e.target.value) || 0)}
                                            className="w-20 text-center font-bold text-lg text-blue-700 bg-white border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
                                        />
                                    </div>

                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center group hover:border-purple-200 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-700 text-sm">FB Cá nhân (Bài đăng)</p>
                                        </div>
                                        <input
                                            type="number" min="0"
                                            value={formData.fb_personal_posts}
                                            onChange={(e) => handleInputChange('fb_personal_posts', parseInt(e.target.value) || 0)}
                                            className="w-20 text-center font-bold text-lg text-purple-700 bg-white border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Ghi chú thêm */}
                            <div>
                                <label className="text-sm font-bold text-slate-800 mb-2 block">Ghi chú (Không bắt buộc)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Có khó khăn hoặc vấn đề gì trong lúc thực hiện công việc không?"
                                    className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-24 bg-slate-50 hover:bg-white transition-colors"
                                ></textarea>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <p className="text-xs text-slate-500 hidden sm:block">Các chỉ số sẽ kích hoạt tính toán KPI trên Dashboard.</p>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
                        >
                            Đóng
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {saving ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    <span>Đang lưu...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Lưu báo cáo</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
