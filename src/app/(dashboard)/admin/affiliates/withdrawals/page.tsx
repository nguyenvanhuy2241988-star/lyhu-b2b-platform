"use client";

import { useEffect, useState } from "react";
import { getAllWithdrawals, updateWithdrawalStatus, AffiliateWithdrawal } from "@/lib/affiliateStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { DollarSign, Clock, CheckCircle, XCircle, Search, Loader2 } from "lucide-react";

export default function AdminWithdrawalsPage() {
    const { token } = useAuth();
    const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (token) {
            fetchWithdrawals();
        }
    }, [token]);

    const fetchWithdrawals = async () => {
        setLoading(true);
        const data = await getAllWithdrawals(token!);
        setWithdrawals(data as any);
        setLoading(false);
    };

    const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected', amount: number, affiliateId: string) => {
        let note = "";
        if (newStatus === 'rejected') {
            const reason = window.prompt("Nhập lý do từ chối (bắt buộc):");
            if (!reason) return;
            note = reason;
        } else {
            const conf = window.confirm(`Bạn xác nhận ĐÃ CHUYỂN KHOẢN ${amount.toLocaleString()}đ thành công và muốn Duyệt yêu cầu này?`);
            if (!conf) return;
            note = "Đã chuyển khoản thành công";
        }

        setProcessingId(id);
        const success = await updateWithdrawalStatus(id, newStatus, note, amount, affiliateId);
        setProcessingId(null);

        if (success) {
            alert(`Đã ${newStatus === 'approved' ? 'duyệt' : 'từ chối'} yêu cầu rút tiền.`);
            fetchWithdrawals();
        } else {
            alert("Đã xảy ra lỗi, vui lòng thử lại.");
        }
    };

    const filteredData = withdrawals.filter(w => {
        const profile = w.affiliate_profiles as any;
        const searchStr = `${profile?.users?.name} ${profile?.users?.phone} ${profile?.affiliate_code} ${w.bank_info?.bank_account_name}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <DollarSign className="w-8 h-8 text-emerald-600 p-1.5 bg-emerald-100 rounded-lg" />
                        Quản lý Yêu cầu Rút tiền
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Duyệt và quản lý các lệnh rút hoa hồng của Cộng tác viên</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg flex items-center gap-2">
                        <Clock size={16} className="text-amber-600"/>
                        <span className="text-sm font-medium text-amber-800">
                            <strong>{pendingCount}</strong> yêu cầu chờ duyệt
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên CTV, số điện thoại, mã affiliate, tên chủ thẻ..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-slate-500">Mã / Thời gian</th>
                                <th className="p-4 text-xs font-semibold text-slate-500">Thông tin CTV</th>
                                <th className="p-4 text-xs font-semibold text-slate-500">Số tiền rút</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 min-w-[250px]">Thông tin chuyển khoản</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 text-center">Trạng thái</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        Không tìm thấy yêu cầu rút tiền nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((w: any) => (
                                    <tr key={w.id} className="hover:bg-slate-50 text-sm align-top">
                                        <td className="p-4">
                                            <div className="font-mono text-xs text-slate-500 mb-1">...{w.id.substring(w.id.length - 8)}</div>
                                            <div className="text-slate-600 text-xs">{new Date(w.created_at).toLocaleString('vi-VN')}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-800">{w.affiliate_profiles?.users?.name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{w.affiliate_profiles?.users?.phone}</div>
                                            <div className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded inline-block mt-1">
                                                {w.affiliate_profiles?.affiliate_code}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-emerald-600 text-base">{Number(w.amount).toLocaleString()}đ</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs">
                                                <div className="font-semibold text-slate-800">{w.bank_info?.bank_name}</div>
                                                <div className="text-slate-600 mt-1">Chủ thẻ: <span className="font-medium">{w.bank_info?.bank_account_name}</span></div>
                                                <div className="text-slate-600 flex items-center gap-2 mt-0.5">
                                                    STK: <span className="font-mono font-medium">{w.bank_info?.bank_account_number}</span>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(w.bank_info?.bank_account_number);
                                                            alert("Đã copy số tài khoản!");
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 rounded"
                                                        title="Copy STK"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {w.status === 'pending' && <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-bold"><Clock size={12}/> CHỜ DUYỆT</span>}
                                            {w.status === 'approved' && <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold"><CheckCircle size={12}/> ĐÃ DUYỆT</span>}
                                            {w.status === 'rejected' && <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold"><XCircle size={12}/> TỪ CHỐI</span>}
                                            
                                            {w.note && (
                                                <div className="mt-2 text-[10px] text-slate-500 italic max-w-[150px] mx-auto text-center line-clamp-2" title={w.note}>
                                                    Ghi chú: {w.note}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {w.status === 'pending' ? (
                                                <div className="flex flex-col gap-2 items-end">
                                                    <button
                                                        onClick={() => handleUpdateStatus(w.id, 'approved', Number(w.amount), w.affiliate_id)}
                                                        disabled={processingId === w.id}
                                                        className="inline-flex justify-center items-center gap-1.5 w-[90px] bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        {processingId === w.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(w.id, 'rejected', Number(w.amount), w.affiliate_id)}
                                                        disabled={processingId === w.id}
                                                        className="inline-flex justify-center items-center gap-1.5 w-[90px] bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Đã xử lý</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
