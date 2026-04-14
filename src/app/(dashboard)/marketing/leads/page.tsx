"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Trash2, ExternalLink, RefreshCcw, User } from "lucide-react";
import dayjs from "dayjs";
import 'dayjs/locale/vi';
import { toast } from "sonner";

dayjs.locale('vi');

export default function LeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    const fetchLeads = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('marketing_leads_staging')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setLeads(data);
        if (error) toast.error("Lỗi tải danh sách");
        setIsLoading(false);
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa liên hệ này?")) return;

        const { error } = await supabase
            .from('marketing_leads_staging')
            .delete()
            .eq('id', id);

        if (!error) {
            toast.success("Đã xóa thành công");
            setLeads(prev => prev.filter(l => l.id !== id));
        } else {
            toast.error("Lỗi xóa liên hệ");
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                        Danh Sách Đã Mời (Leads)
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Quản lý kho dữ liệu Khách hàng mà hệ thống Bot Săn Khách đã gửi lời mời chặn đkết bạn</p>
                </div>
                <button
                    onClick={fetchLeads}
                    className="flex items-center gap-2 p-2 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors font-medium border border-emerald-200"
                >
                    <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Tên Khách Hàng</th>
                            <th className="px-6 py-4 font-semibold">Thời gian thêm</th>
                            <th className="px-6 py-4 font-semibold">Nguồn / Từ khóa</th>
                            <th className="px-6 py-4 font-semibold text-center">Trạng thái Bot</th>
                            <th className="px-6 py-4 font-semibold text-right">Gỡ bỏ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leads.length > 0 ? (
                            leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800">
                                                    {lead.name && lead.name !== 'Facebook User' ? lead.name : 'Khách hàng Ẩn danh'}
                                                </span>
                                                {lead.profile_url && (
                                                    <a
                                                        href={lead.profile_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline mt-0.5 w-fit"
                                                    >
                                                        <ExternalLink className="w-3 h-3" /> Xem trang Facebook
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 font-medium">
                                            {dayjs(lead.created_at).format('HH:mm')}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {dayjs(lead.created_at).format('DD/MM/YYYY')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                                            {lead.source === 'fb_search' ? 'Săn theo từ khóa' : lead.source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs border border-yellow-200 font-medium inline-flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                                            {lead.status === 'pending' ? 'Chờ Khách đồng ý' : lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(lead.id)}
                                            className="text-slate-300 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Xóa khỏi danh sách"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic">
                                    Chưa có dữ liệu. Hãy chạy Bot để săn khách hàng!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
