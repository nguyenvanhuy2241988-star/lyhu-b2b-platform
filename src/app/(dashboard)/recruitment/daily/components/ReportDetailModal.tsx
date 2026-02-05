```tsx
"use client";

import { format } from "date-fns";
import PostLogManager from "./PostLogManager";
import { CheckCircle2, AlertTriangle, Megaphone, Calendar, FileText, X } from "lucide-react";

interface ReportDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: any; // Using any for simplicity as it matches the parent's data shape
}

export default function ReportDetailModal({ isOpen, onClose, report }: ReportDetailModalProps) {
    if (!isOpen || !report) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 transform transition-all" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border">
                            {report.profile.full_name.charAt(0)}
                        </span>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{report.profile.full_name}</h2>
                            <p className="text-sm text-slate-500">{format(new Date(report.date), "dd/MM/yyyy")}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Metrics Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase">Facebook Posts</p>
                            <p className="text-2xl font-bold text-slate-900">{report.fb_posts_paid + report.fb_posts_free}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase">FB Comments</p>
                            <p className="text-2xl font-bold text-slate-900">{report.fb_comments}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase">Threads</p>
                            <p className="text-2xl font-bold text-slate-900">{report.threads_posts}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 uppercase">New Friends</p>
                            <p className="text-2xl font-bold text-slate-900">{report.fb_friends}</p>
                        </div>
                    </div>

                    {/* Additional Tasks & Explanations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-teal-600" />
                                Công việc khác (Ngoài đăng tuyển)
                            </h3>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[80px] text-sm text-slate-700 whitespace-pre-wrap">
                                {report.other_tasks || "Không có ghi chú."}
                            </div>
                        </div>
                         <div className="space-y-2">
                             <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                Lý do không đăng bài
                            </h3>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[80px] text-sm text-slate-700 whitespace-pre-wrap">
                                {report.no_post_reason || "Không có lý do."}
                            </div>
                        </div>
                    </div>

                    {/* Post Evidence (Read Only) */}
                    <div>
                        <PostLogManager 
                            userId={report.user_id} 
                            date={report.date} 
                            readOnly={true} 
                        />
                    </div>

                    {/* Issues and Plans */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                Vấn đề gặp phải
                            </h3>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 min-h-[60px] text-sm text-red-800 whitespace-pre-wrap">
                                {report.issues || "Không có vấn đề."}
                            </div>
                        </div>
                         <div className="space-y-2">
                             <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Megaphone className="w-4 h-4 text-blue-500" />
                                Đề xuất / Cần hỗ trợ
                            </h3>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 min-h-[60px] text-sm text-blue-800 whitespace-pre-wrap">
                                {report.request_support || "Không có đề xuất."}
                            </div>
                        </div>
                    </div>

                     <div className="space-y-2">
                             <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                Kế hoạch ngày mai
                            </h3>
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 min-h-[60px] text-sm text-purple-800 whitespace-pre-wrap">
                                {report.plan_next_day || "Chưa có kế hoạch."}
                            </div>
                        </div>
                </div>
            </div>
        </div>
    );
}
```
