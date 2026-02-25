"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import { Save, Calendar, Loader2, CheckCircle, ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDailyReportTelesales, upsertDailyReportTelesales, getMyReportsHistoryTelesales, TelesalesDailyActivity } from "@/lib/telesalesDailyStore";
import { supabase } from "@/lib/supabaseClient";
import TelesalesPostLogManager from "./components/TelesalesPostLogManager";

export default function TelesalesDailyReportPage() {
    const { user, role } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const paramUserId = searchParams.get('userId');
    const paramDate = searchParams.get('date');

    const [date, setDate] = useState(paramDate || format(new Date(), "yyyy-MM-dd"));
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [history, setHistory] = useState<TelesalesDailyActivity[]>([]);

    // Target User Logic (For Admin View)
    const isAdmin = role === 'admin' || role === 'manager' || role === 'telesales_manager';
    const effectiveUserId = (isAdmin && paramUserId) ? paramUserId : user?.id;
    const [targetUserProfile, setTargetUserProfile] = useState<{ full_name: string, email: string } | null>(null);

    const [formData, setFormData] = useState<Partial<TelesalesDailyActivity>>({
        calls_completed: 0,
        fb_group_posts: 0,
        fb_comments: 0,
        fb_friends: 0,
        fb_personal_posts: 0,
        zalo_posts: 0,
        self_sourced_data: 0,
        issues: "",
        request_support: "",
        other_tasks: "",
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
            const data = await getDailyReportTelesales(selectedDate, effectiveUserId);
            if (data) {
                setFormData(data);
            } else {
                // Reset form if no report exists
                setFormData({
                    calls_completed: 0,
                    fb_group_posts: 0,
                    fb_comments: 0,
                    fb_friends: 0,
                    fb_personal_posts: 0,
                    zalo_posts: 0,
                    self_sourced_data: 0,
                    issues: "",
                    request_support: "",
                    other_tasks: "",
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
            const data = await getMyReportsHistoryTelesales(effectiveUserId);
            setHistory(data || []);
        } catch (error) {
            console.error("Error loading history:", error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (!effectiveUserId) return;
            await upsertDailyReportTelesales({
                ...formData,
                user_id: effectiveUserId,
                report_date: date
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

    const handleChange = (field: keyof TelesalesDailyActivity, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (!effectiveUserId) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Admin Back Navigation */}
            {targetUserProfile && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-blue-700" />
                        </button>
                        <div>
                            <p className="text-xs text-blue-600 font-semibold uppercase">Đang xem báo cáo của:</p>
                            <h2 className="text-lg font-bold text-blue-900">{targetUserProfile.full_name} ({targetUserProfile.email})</h2>
                        </div>
                    </div>
                    <div className="text-sm text-blue-800 bg-white/50 px-3 py-1 rounded">
                        Chế độ Admin
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Báo cáo KPI Hàng ngày (Telesales)</h1>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="text-sm font-medium outline-none text-slate-700 bg-transparent"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Input */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Minh chứng - Tích hợp Evidence Component */}
                    <TelesalesPostLogManager
                        userId={effectiveUserId}
                        date={date}
                        readOnly={isAdmin && effectiveUserId !== user?.id}
                        onUpdate={() => loadReportForDate(date)}
                    />
                    {/* KPI Metrics Input Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                            Chỉ số KPI Hôm nay
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Cuộc gọi (Hệ thống tự đến)
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
                                    value={formData.calls_completed || 0}
                                    readOnly
                                    title="Hệ thống tự động cộng điểm khi bạn Ghi nhận cuộc gọi trên CRM"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Data tự tìm (Hệ thống tự đếm)
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
                                    value={formData.self_sourced_data || 0}
                                    readOnly
                                    title="Hệ thống tự động cộng điểm khi bạn tạo Khách mới nguồn Data Mới"
                                />
                            </div>

                            {/* Read-Only Social Stats (Aggregated from Evidence Logs) */}
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Bài đăng nhóm Facebook
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-transparent bg-blue-50/50 rounded-lg text-slate-600 outline-none cursor-not-allowed"
                                    value={formData.fb_group_posts || 0}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Comment Seeding FB
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-transparent bg-blue-50/50 rounded-lg text-slate-600 outline-none cursor-not-allowed"
                                    value={formData.fb_comments || 0}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Kết bạn Facebook
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-transparent bg-blue-50/50 rounded-lg text-slate-600 outline-none cursor-not-allowed"
                                    value={formData.fb_friends || 0}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Đăng bài FB cá nhân
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-transparent bg-blue-50/50 rounded-lg text-slate-600 outline-none cursor-not-allowed"
                                    value={formData.fb_personal_posts || 0}
                                    readOnly
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Tương tác Zalo (Đăng ảnh / Chào hàng)
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-transparent bg-blue-50/50 rounded-lg text-slate-600 outline-none cursor-not-allowed"
                                    value={formData.zalo_posts || 0}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Report & Plan Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                            Báo cáo & Kế hoạch
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Công việc khác (Thanh toán, Lên đơn...)
                                </label>
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]"
                                    placeholder="Ghi chú thêm công việc phát sinh..."
                                    value={formData.other_tasks || ""}
                                    onChange={e => handleChange('other_tasks', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Vấn đề gặp phải hôm nay
                                </label>
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]"
                                    placeholder="Khách hàng phàn nàn, Lỗi hệ thống..."
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
                                    placeholder="Xin thêm ngân sách, Hỏi xin tài liệu marketing..."
                                    value={formData.request_support || ""}
                                    onChange={e => handleChange('request_support', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Kế hoạch ngày mai <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                                    placeholder="Mục tiêu số cuộc gọi ngày mai, số đơn chốt..."
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
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30"
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
                                        key={h.report_date}
                                        onClick={() => setDate(h.report_date!)}
                                        className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition ${h.report_date === date ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-slate-900">{format(new Date(h.report_date!), 'dd/MM/yyyy')}</span>
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Gọi: {h.calls_completed} | Data: {h.self_sourced_data}
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
