"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Copy, Plus, Trash2, KeyRound, CheckCircle2, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";

export default function B2bCodesManager() {
    const { user } = useAuth();
    const supabase = createClient();
    const [codes, setCodes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCode, setNewCode] = useState("");

    const fetchCodes = async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('b2b_customer_codes')
            .select(`*, customer:profiles!customer_id(full_name, phone)`)
            .eq('telesales_id', user.id)
            .order('created_at', { ascending: false });
        
        if (!error && data) setCodes(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCodes();
    }, [user]);

    const handleCreateCode = async () => {
        const codeToCreate = newCode.trim().toUpperCase();
        if (!codeToCreate) return toast.warning("Vui lòng nhập mã để tạo!");
        
        // Ensure user obj exists
        if (!user) return toast.error("Phiên đăng nhập hết hạn");

        const { error } = await supabase.from('b2b_customer_codes').insert({
            code: codeToCreate,
            telesales_id: user.id,
            is_active: true
        });

        if (error) {
            if (error.code === '23505') toast.error("Mã này đã bị trùng trên hệ thống!");
            else toast.error("Lỗi: " + error.message);
            return;
        }

        toast.success("Tạo mã thành công!");
        setNewCode("");
        fetchCodes();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Xóa mã này? Khách hàng đang dùng mã sẽ mất quyền truy cập giá sỉ.")) return;
        const { error } = await supabase.from('b2b_customer_codes').delete().eq('id', id);
        if (error) toast.error("Lỗi: " + error.message);
        else {
            toast.success("Đã xóa");
            fetchCodes();
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã copy mã!");
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-indigo-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex flex-col items-center justify-center text-indigo-600">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800">Quản lý Mã Cấp Sỉ (B2B Access)</h2>
                        <p className="text-xs text-slate-500">Cấp mã này cho khách hàng để họ mua giá sỉ trên Web/App</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input 
                            type="text" 
                            className="pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-sm w-48 uppercase font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500" 
                            placeholder="Mã: VIP-HANOI..."
                            value={newCode}
                            onChange={e => setNewCode(e.target.value.toUpperCase())}
                        />
                    </div>
                    <button 
                        onClick={handleCreateCode}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                        <Plus className="w-4 h-4"/> Tạo mã
                    </button>
                </div>
            </div>

            <div className="p-0">
                {isLoading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
                ) : codes.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">Bạn chưa tạo mã cấp sỉ nào.</div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mã Code</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium">Khách hàng kích hoạt</th>
                                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {codes.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 tracking-wider bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{c.code}</span>
                                            <button onClick={() => copyToClipboard(c.code)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.customer_id ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Đã Sử Dụng</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">Chưa Dùng</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.customer ? (
                                            <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                                <User className="w-4 h-4 text-emerald-600" />
                                                <span>{c.customer.full_name || 'Khách hàng'} - {c.customer.phone || ''}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Đang chờ kích hoạt...</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
