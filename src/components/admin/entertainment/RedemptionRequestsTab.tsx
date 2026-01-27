"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Check, X, Clock, User, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface Request {
    id: string;
    user_id: string;
    item_id: string;
    cost: number;
    status: string;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
    };
    reward?: {
        name: string;
    };
}

export const RedemptionRequestsTab = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('redemption_requests')
            .select(`
                *,
                user:profiles!user_id(full_name, email),
                reward:reward_store_items(name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Lỗi tải danh sách: " + error.message);
        } else {
            setRequests((data as any) || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('redemption_requests')
            .update({ status })
            .eq('id', id);

        if (error) {
            toast.error("Lỗi cập nhật: " + error.message);
        } else {
            toast.success(`Đã cập nhật trạng thái thành: ${status}`);
            fetchRequests();
        }
    };

    // Filter displaying logic can be added later, currently show all
    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    const historyRequests = requests.filter(r => r.status !== 'PENDING');

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Pending Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-500" /> Cần duyệt ({pendingRequests.length})
                    </h3>
                    <button onClick={fetchRequests} className="text-sm text-blue-600 hover:underline">Làm mới</button>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {pendingRequests.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">Không có yêu cầu nào đang chờ.</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-yellow-50 text-yellow-800 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Nhân viên</th>
                                    <th className="px-4 py-3">Đổi quà</th>
                                    <th className="px-4 py-3">Giá trị</th>
                                    <th className="px-4 py-3">Thời gian</th>
                                    <th className="px-4 py-3 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <div>
                                                    <p className="font-bold text-slate-800">{req.user?.full_name || 'N/A'}</p>
                                                    <p className="text-xs text-slate-500">{req.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700">
                                            <div className="flex items-center gap-2">
                                                <Gift className="w-4 h-4 text-pink-500" />
                                                {req.reward?.name || 'Unknown Item'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-600">{req.cost} điểm</td>
                                        <td className="px-4 py-3 text-slate-500">{new Date(req.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => updateStatus(req.id, 'APPROVED')}
                                                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-bold"
                                                >
                                                    <Check className="w-3 h-3" /> Duyệt
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(req.id, 'REJECTED')}
                                                    className="flex items-center gap-1 px-3 py-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 text-xs font-bold"
                                                >
                                                    <X className="w-3 h-3" /> Từ chối
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* History Section */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-600">Lịch sử xử lý</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left opacity-80">
                        <thead className="bg-slate-100 text-slate-500">
                            <tr>
                                <th className="px-4 py-2">Nhân viên</th>
                                <th className="px-4 py-2">Vật phẩm</th>
                                <th className="px-4 py-2">Trạng thái</th>
                                <th className="px-4 py-2 text-right">Thời gian</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {historyRequests.map(req => (
                                <tr key={req.id}>
                                    <td className="px-4 py-2">{req.user?.full_name}</td>
                                    <td className="px-4 py-2">{req.reward?.name}</td>
                                    <td className="px-4 py-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                req.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right text-xs">{new Date(req.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {historyRequests.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-4 text-xs">Chưa có lịch sử.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
