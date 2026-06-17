"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Loader2, Save } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAffiliateDailyReport, updateAffiliateDailyReport } from "@/lib/affiliateStore";
import AffiliatePostLogManager from "./components/AffiliatePostLogManager";
import { supabase } from "@/lib/supabaseClient";

export default function HrDailyView() {
    const { user } = useAuth();
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [stats, setStats] = useState({ found: 0, contacted: 0, won: 0, lost: 0 });

    const [formData, setFormData] = useState<any>({
        issues: "",
        request_support: "",
        plan_next_day: "",
        other_tasks: "",
        candidate_feedback: "",
        no_post_reason: ""
    });

    useEffect(() => {
        if (user?.id) {
            loadReportForDate(date);
        }
    }, [date, user?.id]);

    const loadReportForDate = async (selectedDate: string) => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const data = await getAffiliateDailyReport(selectedDate, user.id);
            if (data) {
                setFormData(data);
                setStats({
                    found: data.found_actual || 0,
                    contacted: data.contacted_actual || 0,
                    won: data.won_actual || 0,
                    lost: data.lost_actual || 0
                });
            } else {
                setFormData({
                    issues: "",
                    request_support: "",
                    plan_next_day: "",
                    other_tasks: "",
                    candidate_feedback: "",
                    no_post_reason: ""
                });
                setStats({ found: 0, contacted: 0, won: 0, lost: 0 });
            }
        } catch (error) {
            console.error("Error loading report:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (!user?.id || !formData.id) {
                alert("Bạn cần phải có hoạt động trên bảng Kanban trong ngày hôm nay trước khi có thể lưu báo cáo chi tiết.");
                setIsSaving(false);
                return;
            }
            await updateAffiliateDailyReport(formData);
            alert("Đã lưu báo cáo thành công!");
        } catch (error) {
            console.error(error);
            alert("Lỗi khi lưu báo cáo. Vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    if (!user?.id) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h1 className="text-xl font-bold text-slate-900">Báo cáo công việc Affiliate hàng ngày</h1>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="text-sm font-medium bg-transparent outline-none text-slate-700"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <span className="text-sm font-medium text-slate-600">Tìm thấy mới</span>
                    <div className="text-2xl font-bold text-blue-700 mt-1">{stats.found}</div>
                </div>
                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                    <span className="text-sm font-medium text-slate-600">Đã liên hệ</span>
                    <div className="text-2xl font-bold text-purple-700 mt-1">{stats.contacted}</div>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <span className="text-sm font-medium text-slate-600">Chốt hợp tác</span>
                    <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.won}</div>
                </div>
                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                    <span className="text-sm font-medium text-slate-600">Thất bại / Hủy</span>
                    <div className="text-2xl font-bold text-rose-700 mt-1">{stats.lost}</div>
                </div>
            </div>
            
            <div className="text-xs text-slate-500 italic mt-[-10px] ml-2">* Các chỉ số trên được tự động tính toán từ bảng Kanban quản lý Affiliate.</div>

            <div className="space-y-6">
                <AffiliatePostLogManager
                    userId={user.id}
                    date={date}
                />

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                        Công việc & Giải trình
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Công việc khác (Ngoài tìm kiếm Affiliate)
                            </label>
                            <textarea
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]"
                                placeholder="Ví dụ: Phỏng vấn ứng viên, hỗ trợ kịch bản livestream..."
                                value={formData.other_tasks || ""}
                                onChange={e => handleChange('other_tasks', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Lý do không tìm kiếm thêm (Nếu có)
                            </label>
                            <input
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="Ví dụ: Đã đủ số lượng Affiliate cần thiết tuần này..."
                                value={formData.no_post_reason || ""}
                                onChange={e => handleChange('no_post_reason', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

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
                                placeholder="Ví dụ: CTV chê tỷ lệ hoa hồng thấp, KOL không rep tin nhắn..."
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
                                placeholder="Cần tăng % hoa hồng, Cần gửi hàng mẫu dùng thử..."
                                value={formData.request_support || ""}
                                onChange={e => handleChange('request_support', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                <span className="text-purple-600 font-semibold">Phản hồi của Affiliate / Thị trường</span>
                            </label>
                            <textarea
                                className="w-full p-3 border border-purple-200 bg-purple-50/30 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none min-h-[100px] text-purple-900"
                                placeholder="Ví dụ: KOL A đòi phí booking cao, CTV B bảo sản phẩm khó bán..."
                                value={formData.candidate_feedback || ""}
                                onChange={e => handleChange('candidate_feedback', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Kế hoạch ngày mai <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none min-h-[80px]"
                                placeholder="Ví dụ: Liên hệ thêm 10 KOC TikTok, gửi hợp đồng cho KOL X..."
                                value={formData.plan_next_day || ""}
                                onChange={e => handleChange('plan_next_day', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 pb-8">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 flex items-center gap-2 transition-all shadow-lg shadow-teal-500/30"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Lưu Báo Cáo
                    </button>
                </div>
            </div>
        </div>
    );
}
