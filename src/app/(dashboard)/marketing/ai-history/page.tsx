"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Bot, Calendar, Clock, Download, ChevronRight, Activity } from "lucide-react";
import dayjs from "dayjs";
import 'dayjs/locale/vi';
import { toast } from "sonner";

dayjs.locale('vi');

export default function AiHistoryPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('marketing_action_logs')
                .select('*')
                .eq('action_type', 'AI_OPTIMIZATION')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) {
                setLogs(data);
            }
            setIsLoading(false);
        };

        fetchHistory();
    }, []);

    const handleExportCSV = (log: any) => {
        const recommendations = log.details?.recommendations;
        if (!recommendations || recommendations.length === 0) {
            toast.error("Không có dữ liệu chi tiết để xuất");
            return;
        }

        const headers = ["Tên Nhóm QC", "Quyết định AI", "Lý do", "Chi tiêu (VND)", "Tin nhắn", "Giá/Tin", "Số SĐT", "Giá/SĐT"];
        
        const rows = recommendations.map((r: any) => [
            `"${(r.name || '').replace(/"/g, '""')}"`,
            r.action || '',
            `"${(r.reason || '').replace(/"/g, '""')}"`,
            r.spend || 0,
            r.messages || 0,
            r.cost_per_message || 0,
            r.phone_count || 0,
            r.cost_per_phone || 0
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Bot_AI_History_${dayjs(log.created_at).format('YYYY-MM-DD_HHmm')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Đã tải lại file báo cáo!");
    };

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Bot className="w-8 h-8 text-purple-600" />
                        Lịch sử Tối ưu AI
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Tra cứu lại những lần AI Media Buyer đã phân tích và tự động đưa ra quyết định cho tài khoản quảng cáo của bạn.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl"></div>
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">Chưa có dữ liệu</h3>
                    <p className="text-slate-500">Bạn chưa chạy phân tích AI Media Buyer lần nào.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {logs.map((log) => (
                        <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-purple-300 transition-colors shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg">
                                        [AI OPTIMIZE]
                                    </span>
                                    <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> {dayjs(log.created_at).format('DD/MM/YYYY')}
                                    </span>
                                    <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> {dayjs(log.created_at).format('HH:mm:ss')}
                                    </span>
                                </div>
                                <p className="text-slate-800 font-medium">
                                    {log.details?.message || "Đã phân tích hệ thống."}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => handleExportCSV(log)}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-medium transition-colors text-sm flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Tải File Excel
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
