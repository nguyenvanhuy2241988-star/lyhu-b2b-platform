"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Copy, Plus, Trash, CheckCircle, XCircle } from "lucide-react";

export default function AdminAffiliatesPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnon);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('affiliate_profiles')
                .select(`
                    id, affiliate_code, commission_rate, status, created_at,
                    profiles:user_id ( full_name, email, phone )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error("Error fetching affiliates", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('affiliate_profiles')
                .update({ status })
                .eq('id', id);
            
            if (error) throw error;
            fetchProfiles();
        } catch (error) {
            alert("Lỗi cập nhật trạng thái");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Quản lý Đối tác Affiliate</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-medium text-slate-500">Đối tác</th>
                                <th className="p-4 font-medium text-slate-500">Mã Affiliate</th>
                                <th className="p-4 font-medium text-slate-500">Hoa hồng (%)</th>
                                <th className="p-4 font-medium text-slate-500">Trạng thái</th>
                                <th className="p-4 font-medium text-slate-500">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Đang tải...</td>
                                </tr>
                            ) : profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Chưa có đối tác Affiliate nào.</td>
                                </tr>
                            ) : profiles.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="font-medium">{p.profiles?.full_name || 'No Name'}</div>
                                        <div className="text-sm text-slate-500">{p.profiles?.email}</div>
                                        <div className="text-sm text-slate-500">{p.profiles?.phone}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-mono text-sm border border-blue-100 flex items-center w-max gap-2">
                                            {p.affiliate_code}
                                            <button onClick={() => navigator.clipboard.writeText(p.affiliate_code)} className="hover:text-blue-900">
                                                <Copy size={14} />
                                            </button>
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-green-600">{p.commission_rate}%</td>
                                    <td className="p-4">
                                        {p.status === 'active' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Đang hoạt động</span>}
                                        {p.status === 'pending' && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">Chờ duyệt</span>}
                                        {p.status === 'suspended' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Bị khóa</span>}
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        {p.status !== 'active' && (
                                            <button onClick={() => updateStatus(p.id, 'active')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Duyệt / Kích hoạt">
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        {p.status !== 'suspended' && (
                                            <button onClick={() => updateStatus(p.id, 'suspended')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Khóa tài khoản">
                                                <XCircle size={18} />
                                            </button>
                                        )}
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
