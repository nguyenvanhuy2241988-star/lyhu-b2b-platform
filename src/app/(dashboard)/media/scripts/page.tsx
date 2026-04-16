"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Plus, Search, FileText, Calendar, PenTool, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function MediaScriptsList() {
    const router = useRouter();
    const [scripts, setScripts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScripts();
    }, []);

    const fetchScripts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('media_scripts')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setScripts(data);
        }
        setLoading(false);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const _map: any = {
            draft: { c: 'bg-slate-100 text-slate-700', t: 'Nháp' },
            approved: { c: 'bg-green-100 text-green-700', t: 'Đã duyệt' },
            shooting: { c: 'bg-blue-100 text-blue-700', t: 'Đang quay' },
            completed: { c: 'bg-purple-100 text-purple-700', t: 'Hoàn thành' },
            cancelled: { c: 'bg-red-100 text-red-700', t: 'Đã huỷ' }
        };
        const conf = _map[status] || _map['draft'];
        return <span className={`px-2 py-1 rounded text-xs font-semibold ${conf.c}`}>{conf.t}</span>;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-teal-500 pl-3">Kịch bản Media</h1>
                    <p className="text-sm text-gray-500 mt-1 pl-4">Quản lý và soạn thảo kịch bản quay dựng tự động với AI</p>
                </div>
                <button 
                    onClick={() => router.push('/media/scripts/new')}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow flex items-center transition-all"
                >
                    <Plus className="w-5 h-5 mr-1" /> Tạo Kịch bản mới
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-4 p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm kịch bản nhanh..." 
                            className="w-full pl-9 pr-4 py-2 text-sm border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Kịch bản</th>
                                <th className="px-6 py-4 font-medium">Hệ sinh thái</th>
                                <th className="px-6 py-4 font-medium">Trạng thái</th>
                                <th className="px-6 py-4 font-medium">Thời lượng (s)</th>
                                <th className="px-6 py-4 font-medium">Cập nhật</th>
                                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">Đang tải dữ liệu...</td>
                                </tr>
                            ) : scripts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="w-12 h-12 text-gray-300 mb-2" />
                                            <p className="text-gray-500">Chưa có kịch bản nào. Tạo mới ngay bằng AI nhé!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : scripts.map(s => (
                                <tr key={s.id} className="hover:bg-teal-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-800 line-clamp-1">{s.title}</div>
                                        <div className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{s.notes || 'Không có ghi chú'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                        {s.script_type.replace('_', ' ')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={s.status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                        {s.estimated_duration_sec}s
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1.5" />
                                        {format(new Date(s.updated_at), 'dd/MM/yyyy HH:mm')}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button 
                                            onClick={() => router.push(`/media/scripts/${s.id}`)}
                                            className="p-1.5 text-teal-600 hover:bg-teal-50 bg-teal-50/50 rounded inline-flex transition-colors"
                                            title="Sửa / Xem chi tiết"
                                        >
                                            <PenTool className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                if(confirm('Bạn có chắc xoá kịch bản này?')){
                                                    await supabase.from('media_scripts').delete().eq('id', s.id);
                                                    fetchScripts();
                                                }
                                            }}
                                            className="p-1.5 text-red-500 hover:bg-red-50 bg-red-50/50 rounded inline-flex"
                                            title="Xoá"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
