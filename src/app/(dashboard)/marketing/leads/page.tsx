"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Trash2, ExternalLink, RefreshCcw, User, Loader2, UserPlus, Radar } from "lucide-react";
import dayjs from "dayjs";
import 'dayjs/locale/vi';
import { toast } from "sonner";

dayjs.locale('vi');

export default function LeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSniperActive, setIsSniperActive] = useState(false);
    const [isRadarActive, setIsRadarActive] = useState(false);
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
            setSelectedLeads(prev => prev.filter(selectedId => selectedId !== id));
        } else {
            toast.error("Lỗi xóa liên hệ");
        }
    };

    const handleExecuteSniper = async () => {
        if (selectedLeads.length === 0) return;
        setIsSniperActive(true);
        const selectedMates = leads.filter(l => selectedLeads.includes(l.id));
        const urls = selectedMates.map(l => l.profile_url).filter(url => url);

        try {
            const res = await fetch('/api/marketing/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scriptName: 'execute_sniper_add.js',
                    args: JSON.stringify(urls),
                    profileId: null
                })
            });

            if (res.ok) {
                toast.success(`Đã đưa ${urls.length} mục tiêu vào hàng đợi Bắn tỉa!`);
                
                // Update local UI
                setLeads(prev => prev.map(l => selectedLeads.includes(l.id) ? { ...l, status: 'pending' } : l));
                setSelectedLeads([]);
                
                // Cập nhật lên CSDL tránh Bot quét lại
                await supabase.from('marketing_leads_staging').update({ status: 'pending' }).in('id', selectedLeads);
            } else {
                toast.error("Lỗi khởi động Sniper");
            }
        } catch (e) {
            toast.error("Lỗi kết nối Server");
        } finally {
            setIsSniperActive(false);
        }
    };

    const handleExecuteRadar = async () => {
        if (selectedLeads.length === 0) return;
        setIsRadarActive(true);
        const selectedMates = leads.filter(l => selectedLeads.includes(l.id));
        const urls = selectedMates.map(l => l.profile_url).filter(url => url);

        try {
            const res = await fetch('/api/marketing/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scriptName: 'execute_radar_check.js',
                    args: JSON.stringify(urls),
                    profileId: null
                })
            });

            if (res.ok) {
                toast.success(`Đã phái Bot Radar đi dò sóng ${urls.length} đối tượng!`);
                setSelectedLeads([]);
            } else {
                toast.error("Lỗi khởi động Radar");
            }
        } catch (e) {
            toast.error("Lỗi kết nối Server");
        } finally {
            setIsRadarActive(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedLeads(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        const scrapedLeads = leads; // You can filter specifically for 'scraped' if desired, but any lead is fine.
        if (selectedLeads.length === scrapedLeads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(scrapedLeads.map(l => l.id));
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
                <div className="flex items-center gap-3">
                    {selectedLeads.length > 0 && (
                        <>
                            <button
                                onClick={handleExecuteSniper}
                                disabled={isSniperActive || isRadarActive}
                                className="flex items-center gap-2 p-2 px-4 bg-orange-500 text-white hover:bg-orange-600 rounded-xl transition-colors font-medium shadow-sm shadow-orange-500/20 disabled:opacity-75"
                            >
                                {isSniperActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} 
                                Duyệt & Bắn Tỉa ({selectedLeads.length})
                            </button>
                            <button
                                onClick={handleExecuteRadar}
                                disabled={isRadarActive || isSniperActive}
                                className="flex items-center gap-2 p-2 px-4 bg-blue-500 text-white hover:bg-blue-600 rounded-xl transition-colors font-medium shadow-sm shadow-blue-500/20 disabled:opacity-75"
                            >
                                {isRadarActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />} 
                                Tự Dò Radar ({selectedLeads.length})
                            </button>
                        </>
                    )}
                    <button
                        onClick={fetchLeads}
                        className="flex items-center gap-2 p-2 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors font-medium border border-emerald-200"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b">
                        <tr>
                            <th className="px-6 py-4 w-12 rounded-tl-xl text-center">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                    checked={leads.length > 0 && selectedLeads.length === leads.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="px-6 py-4 font-semibold">Tên Khách Hàng</th>
                            <th className="px-6 py-4 font-semibold">Thời gian thêm</th>
                            <th className="px-6 py-4 font-semibold">Nguồn / Từ khóa</th>
                            <th className="px-6 py-4 font-semibold text-center">Trạng thái Bot</th>
                            <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leads.length > 0 ? (
                            leads.map((lead) => (
                                <tr key={lead.id} className={`hover:bg-slate-50/80 transition-colors group ${selectedLeads.includes(lead.id) ? 'bg-orange-50/30' : ''}`}>
                                    <td className="px-6 py-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-orange-500 bg-slate-100 border-slate-300 rounded focus:ring-orange-500 cursor-pointer"
                                            checked={selectedLeads.includes(lead.id)}
                                            onChange={() => toggleSelect(lead.id)}
                                        />
                                    </td>
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
                                        {lead.status === 'friend' ? (
                                            <span className="px-2.5 py-1 bg-green-500 text-white rounded-full text-xs font-semibold shadow-sm shadow-green-500/30 inline-flex items-center gap-1">
                                                ✅ Khách Đã Đồng Ý
                                            </span>
                                        ) : lead.status === 'rejected' ? (
                                            <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs border border-red-200 font-medium inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                                Bị Từ Chối
                                            </span>
                                        ) : lead.status === 'pending' ? (
                                            <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs border border-yellow-200 font-medium inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                                                Đã Add (Chờ đồng ý)
                                            </span>
                                        ) : lead.status === 'scraped' || lead.status === 'pending_manual_review' ? (
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs border border-slate-300 font-medium inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                                                Chỉ Vơ Vét Data
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs border border-emerald-200 font-medium inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                {lead.status}
                                            </span>
                                        )}
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
                                <td colSpan={6} className="px-6 py-10 text-center text-slate-500 italic">
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
