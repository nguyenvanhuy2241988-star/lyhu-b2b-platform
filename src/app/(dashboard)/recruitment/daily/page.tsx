"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import { Save, Calendar, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDailyReport, upsertDailyReport, getMyReportsHistory, DailyActivity } from "@/lib/recruitmentStore";
import { supabase } from "@/lib/supabaseClient";
import PostLogManager from "./components/PostLogManager";
import KpiDashboard from "./components/KpiDashboard";

export default function DailyReportPage() {
    const { user, role } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const paramUserId = searchParams.get('userId');
    const paramDate = searchParams.get('date');

    const [date, setDate] = useState(paramDate || format(new Date(), "yyyy-MM-dd"));
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [history, setHistory] = useState<DailyActivity[]>([]);

    // Target User Logic (For Admin View)
    const isAdmin = role === 'admin' || role === 'manager' || role === 'recruiter_manager';
    const effectiveUserId = (isAdmin && paramUserId) ? paramUserId : user?.id;
    const [targetUserProfile, setTargetUserProfile] = useState<{ full_name: string, email: string } | null>(null);

    const [formData, setFormData] = useState<Partial<DailyActivity>>({
        fb_posts_paid: 0,
        fb_posts_free: 0,
        fb_comments: 0,
        fb_friends: 0,
        threads_posts: 0,
        threads_comments: 0,
        issues: "",
        request_support: "",
        other_tasks: "",
        no_post_reason: "",
        plan_next_day: ""
    });

    useEffect(() => {
        if (effectiveUserId) {
            loadReportForDate(date);
            loadHistory();

            // If viewing someone else, fetch their name
            if (effectiveUserId !== user?.id) {
                fetchTargetProfile(effectiveUserId);
            } else {
                setTargetUserProfile(null);
            }
        }
    }, [date, effectiveUserId, user?.id]);

    const fetchTargetProfile = async (uid: string) => {
        const { data } = await supabase.from('profiles').select('full_name, email').eq('id', uid).single();
        if (data) setTargetUserProfile(data);
    };

    const loadReportForDate = async (selectedDate: string) => {
        if (!effectiveUserId) return;
        setIsLoading(true);
        try {
            const data = await getDailyReport(selectedDate, effectiveUserId);
            if (data) {
                setFormData(data);
            } else {
                // Reset form if no report exists
                setFormData({
                    fb_posts_paid: 0,
                    fb_posts_free: 0,
                    fb_comments: 0,
                    fb_friends: 0,
                    threads_posts: 0,
                    threads_comments: 0,
                    issues: "",
                    request_support: "",
                    other_tasks: "",
                    no_post_reason: "",
                    plan_next_day: ""
                });
            }
        } catch (error) {
            console.error("Error loading report:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadHistory = async () => {
        if (!effectiveUserId) return;
        try {
            const data = await getMyReportsHistory(effectiveUserId);
            setHistory(data || []);
        } catch (error) {
            console.error("Error loading history:", error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (!effectiveUserId) return;
            await upsertDailyReport({
                ...formData,
                user_id: effectiveUserId,
                date: date
            });
            alert("Đã lưu báo cáo thành công!");
            loadHistory();
        } catch (error) {
            console.error(error);
            alert("Lỗi khi lưu báo cáo.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof DailyActivity, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (!effectiveUserId) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600" /></div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Admin Back Navigation */}
            {targetUserProfile && (
                <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-primary-700" />
                        </button>
                        <div>
                            <p className="text-xs text-primary-600 font-semibold uppercase">Đang xem báo cáo của:</p>
                            <h2 className="text-lg font-bold text-primary-900">{targetUserProfile.full_name} ({targetUserProfile.email})</h2>
                        </div>
                    </div>
                    <div className="text-sm text-primary-800 bg-white/50 px-3 py-1 rounded">
                        Chế độ Admin
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Báo cáo công việc hàng ngày</h1>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="text-sm font-medium outline-none"
                    />
                </div>
            </div>

            {/* KPI Dashboard */}
            <KpiDashboard date={date} userId={effectiveUserId} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Input */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Evidence Manager */}
                    <PostLogManager
                        userId={effectiveUserId}
                        date={date}
                        onUpdate={() => {
                            loadReportForDate(date);
                            loadHistory();
                        }}
                    />

                    {/* Non-recruitment / Explanation Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                            Công việc & Giải trình
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Công việc khác (Ngoài đăng tuyển)
                                </label>
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]"
                                    placeholder="Ví dụ: Phỏng vấn 3 ứng viên, Làm thủ tục nhận việc cho NV mới..."
                                    value={formData.other_tasks || ""}
                                    onChange={e => handleChange('other_tasks', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Lý do không đăng bài (Nếu có)
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Ví dụ: Đã đủ hồ sơ tuần này, Tập trung lọc CV cũ..."
                                    value={formData.no_post_reason || ""}
                                    onChange={e => handleChange('no_post_reason', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Report & Plan Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-red-600 rounded-full"></span>
                            Báo cáo & Kế hoạch
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Vấn đề gặp phải hôm nay
                                </label>
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]"
                                    placeholder="Ví dụ: Tài khoản bị checkpoint, nhóm không duyệt bài..."
                                    value={formData.issues || ""}
                                    onChange={e => handleChange('issues', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Đề xuất / Cần hỗ trợ
                                </label>
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]"
                                    placeholder="Cần cấp thêm ngân sách chạy ads..."
                                    value={formData.request_support || ""}
                                    onChange={e => handleChange('request_support', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Kế hoạch ngày mai <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none min-h-[80px]"
                                    placeholder="Ví dụ: Đăng 10 bài nhóm X, Phỏng vấn 2 ứng viên..."
                                    value={formData.plan_next_day || ""}
                                    onChange={e => handleChange('plan_next_day', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 flex items-center gap-2 transition-all shadow-lg shadow-primary-500/30"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Lưu Báo Cáo
                        </button>
                    </div>
                </div>

                {/* Sidebar History */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-semibold text-slate-900 mb-4">Lịch sử báo cáo</h3>
                        <div className="space-y-3">
                            {history.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">Chưa có lịch sử</p>
                            ) : (
                                history.map((h) => (
                                    <div
                                        key={h.date}
                                        onClick={() => setDate(h.date)}
                                        className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition ${h.date === date ? 'border-primary-500 bg-primary-50' : 'border-slate-100'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-slate-900">{format(new Date(h.date), 'dd/MM/yyyy')}</span>
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            FB: {h.fb_posts_paid + h.fb_posts_free} bài | Threads: {h.threads_posts}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
