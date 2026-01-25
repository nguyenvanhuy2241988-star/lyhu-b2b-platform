"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Trash2, ExternalLink, RefreshCcw } from "lucide-react";
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Danh Sách Đã Mời</h2>
                    <p className="text-slate-500">Quản lý những người Bot đã gửi lời mời kết bạn</p>
                </div>
                <button
                    onClick={fetchLeads}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                    <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Thời gian</th>
                            <th className="px-6 py-3">Nguồn</th>
                            <th className="px-6 py-3">Profile Link</th>
                            <th className="px-6 py-3">Trạng thái</th>
                            <th className="px-6 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leads.length > 0 ? (
                            leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-slate-600">
                                        {dayjs(lead.created_at).format('DD/MM/YYYY HH:mm')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                                            {lead.source === 'fb_search' ? 'Săn tìm' : lead.source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {lead.profile_url ? (
                                            <a
                                                href={lead.profile_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-blue-600 hover:underline"
                                            >
                                                Xem Facebook <ExternalLink className="w-3 h-3" />
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">Không có link</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
                                            {lead.status === 'pending' ? 'Chờ xác nhận' : lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(lead.id)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
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
