"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Wallet, Gift, AlertTriangle, Clock, CheckCircle2, Info, ChevronLeft, Settings, Pencil, Plus, Trash2, Save as SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

interface PolicyData {
    baseSalary: number;
    paymentDay: number;
    hoursPerDay: number;
    maxUnexcusedAbsences: number;
    allowances: { name: string; amount: string }[];
    bonuses: { title: string; amount: string; desc: string }[];
    penalties: { name: string; desc: string; fine: string }[];
    penaltyNote: string;
    commissionNote: string;
    version: string;
}

const DEFAULT_POLICY: PolicyData = {
    baseSalary: 3000000,
    paymentDay: 5,
    hoursPerDay: 8,
    maxUnexcusedAbsences: 2,
    allowances: [
        { name: "Xăng xe", amount: "300.000đ" },
        { name: "Điện thoại", amount: "100.000đ" },
        { name: "Trang phục", amount: "Cấp theo quý" },
    ],
    bonuses: [
        { title: "Mở mới điểm bán", amount: "+100.000đ", desc: "Mỗi điểm bán mới được duyệt" },
        { title: "Hoàn thành tuyến 100%", amount: "+50.000đ", desc: "Check-in đủ 100% điểm bán trong ngày" },
        { title: "Đơn hàng mới từ NPP/Đại lý", amount: "+300.000đ", desc: "Đơn hàng đầu tiên từ NPP/ĐL mới" },
        { title: "Sáng kiến cải tiến", amount: "+50 - 200k", desc: "Ý kiến cải tiến quy trình hiệu quả" },
    ],
    penalties: [
        { name: "Đi muộn / Về sớm", desc: "Không có lý do chính đáng & chưa báo Admin", fine: "50.000đ" },
        { name: "Không check-in GPS", desc: "Ghé điểm bán nhưng không check-in trên hệ thống", fine: "30.000đ" },
        { name: "Sai lệch Trang phục", desc: "Quên mặc đồng phục khi đi thị trường", fine: "50.000đ" },
    ],
    penaltyNote: "Mọi khoản phí phạt đều được gom vào quỹ Bonding để dùng cho các hoạt động ngoại khóa, liên hoan của tập thể Sales GT.",
    commissionNote: "Sales GT được hưởng hoa hồng theo doanh số đạt được và mức hoàn thành KPI tuyến hàng tháng.",
    version: "v1.0"
};

const formatNumber = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export default function GTRulesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'sale_admin';
    const [policy, setPolicy] = useState<PolicyData>(DEFAULT_POLICY);
    const [isEditing, setIsEditing] = useState(false);
    const [editPolicy, setEditPolicy] = useState<PolicyData>(DEFAULT_POLICY);
    const [isSaving, setIsSaving] = useState(false);

    const loadPolicy = useCallback(async () => {
        const { data } = await supabase
            .from('app_settings')
            .select('income_policies')
            .limit(1)
            .single();
        const policies = data?.income_policies || {};
        if (policies.sales_gt) {
            setPolicy({ ...DEFAULT_POLICY, ...policies.sales_gt });
        }
    }, []);

    useEffect(() => { loadPolicy(); }, [loadPolicy]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { data: current } = await supabase
                .from('app_settings')
                .select('income_policies')
                .limit(1)
                .single();
            const policies = current?.income_policies || {};
            policies.sales_gt = editPolicy;

            const { error } = await supabase
                .from('app_settings')
                .update({ income_policies: policies })
                .not('id', 'is', null);
            if (!error) {
                setPolicy(editPolicy);
                setIsEditing(false);
            } else {
                alert("Lỗi khi lưu: " + error.message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const openEdit = () => {
        setEditPolicy({ ...policy });
        setIsEditing(true);
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
            <div className="flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>
                {isAdmin && !isEditing && (
                    <button onClick={openEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa chính sách
                    </button>
                )}
            </div>

            <div>
                <h1 className="text-xl font-bold text-slate-900">Chính sách Thu nhập Sales GT</h1>
                <p className="text-sm text-slate-500 mt-1">Minh bạch, công bằng và tập trung vào hiệu suất thị trường.</p>
            </div>

            {/* 1. Lương cố định */}
            <section className="bg-white rounded-xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-900">Lương cố định</h2>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-baseline justify-between">
                        <div>
                            <p className="text-xs text-slate-400 font-medium mb-1">Mức lương Sales GT</p>
                            <p className="text-2xl font-bold text-slate-900">{formatNumber(policy.baseSalary)} <span className="text-sm font-normal text-slate-400">VND</span></p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Thanh toán vào ngày {policy.paymentDay} hàng tháng</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Định mức {policy.hoursPerDay} tiếng/ngày</span>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs font-medium text-slate-500 mb-3">Phụ cấp & Phúc lợi</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {policy.allowances.map((a, idx) => (
                                <div key={idx} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg">
                                    <span className="text-sm text-slate-600">{a.name}</span>
                                    <span className="text-sm font-semibold text-slate-900">{a.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                        <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Lương cứng được đảm bảo dựa trên sự chuyên cần. Nghỉ không phép quá {policy.maxUnexcusedAbsences} buổi sẽ bị xem xét lại định mức.
                        </p>
                    </div>
                </div>
            </section>

            {/* Commission Note */}
            {policy.commissionNote && (
                <section className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
                    <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-emerald-800 font-medium leading-relaxed">{policy.commissionNote}</p>
                    </div>
                </section>
            )}

            {/* 2. Hệ thống thưởng */}
            <section className="bg-white rounded-xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <Gift className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-900">Hệ thống thưởng</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {policy.bonuses.map((item, idx) => (
                        <div key={idx} className="px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                            </div>
                            <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">{item.amount}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Chế tài */}
            <section className="bg-white rounded-xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-900">Chế tài & Kỷ luật</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {policy.penalties.map((v, idx) => (
                        <div key={idx} className="px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{v.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{v.desc}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-rose-600">-{v.fine}</span>
                                <p className="text-[10px] text-slate-400 mt-0.5">mỗi lần</p>
                            </div>
                        </div>
                    ))}
                </div>
                {policy.penaltyNote && (
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                        <div className="flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-500 leading-relaxed">{policy.penaltyNote}</p>
                        </div>
                    </div>
                )}
            </section>

            <div className="text-center">
                <p className="text-xs text-slate-400">Cập nhật: {new Date().toLocaleDateString('vi-VN')} · {policy.version}</p>
            </div>

            {/* Edit Modal - Admin only */}
            {isEditing && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-teal-500" /> Chỉnh sửa Chính sách Sales GT
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase">Lương cố định</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-400 block mb-1">Lương cơ bản (VNĐ)</label>
                                        <input type="text" className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm font-bold"
                                            value={formatNumber(editPolicy.baseSalary)}
                                            onChange={(e) => setEditPolicy({ ...editPolicy, baseSalary: parseInt(e.target.value.replace(/\./g, '')) || 0 })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block mb-1">Ngày thanh toán</label>
                                        <input type="number" className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm"
                                            value={editPolicy.paymentDay}
                                            onChange={(e) => setEditPolicy({ ...editPolicy, paymentDay: parseInt(e.target.value) || 5 })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 block mb-1">Giờ/ngày</label>
                                        <input type="number" step="0.5" className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm"
                                            value={editPolicy.hoursPerDay}
                                            onChange={(e) => setEditPolicy({ ...editPolicy, hoursPerDay: parseFloat(e.target.value) || 8 })} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase">Phụ cấp</h3>
                                {editPolicy.allowances.map((a, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input className="flex-1 py-1.5 px-3 rounded border border-slate-200 text-sm" value={a.name}
                                            onChange={(e) => { const arr = [...editPolicy.allowances]; arr[i] = { ...a, name: e.target.value }; setEditPolicy({ ...editPolicy, allowances: arr }); }} />
                                        <input className="w-32 py-1.5 px-3 rounded border border-slate-200 text-sm" value={a.amount}
                                            onChange={(e) => { const arr = [...editPolicy.allowances]; arr[i] = { ...a, amount: e.target.value }; setEditPolicy({ ...editPolicy, allowances: arr }); }} />
                                        <button onClick={() => setEditPolicy({ ...editPolicy, allowances: editPolicy.allowances.filter((_, j) => j !== i) })}
                                            className="p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                                <button onClick={() => setEditPolicy({ ...editPolicy, allowances: [...editPolicy.allowances, { name: "", amount: "" }] })}
                                    className="text-xs text-teal-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Thêm phụ cấp</button>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase">Hệ thống thưởng</h3>
                                {editPolicy.bonuses.map((b, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input className="flex-1 py-1.5 px-3 rounded border border-slate-200 text-sm" placeholder="Tên" value={b.title}
                                            onChange={(e) => { const arr = [...editPolicy.bonuses]; arr[i] = { ...b, title: e.target.value }; setEditPolicy({ ...editPolicy, bonuses: arr }); }} />
                                        <input className="w-28 py-1.5 px-3 rounded border border-slate-200 text-sm" placeholder="Số tiền" value={b.amount}
                                            onChange={(e) => { const arr = [...editPolicy.bonuses]; arr[i] = { ...b, amount: e.target.value }; setEditPolicy({ ...editPolicy, bonuses: arr }); }} />
                                        <input className="flex-1 py-1.5 px-3 rounded border border-slate-200 text-sm" placeholder="Mô tả" value={b.desc}
                                            onChange={(e) => { const arr = [...editPolicy.bonuses]; arr[i] = { ...b, desc: e.target.value }; setEditPolicy({ ...editPolicy, bonuses: arr }); }} />
                                        <button onClick={() => setEditPolicy({ ...editPolicy, bonuses: editPolicy.bonuses.filter((_, j) => j !== i) })}
                                            className="p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                                <button onClick={() => setEditPolicy({ ...editPolicy, bonuses: [...editPolicy.bonuses, { title: "", amount: "", desc: "" }] })}
                                    className="text-xs text-teal-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Thêm mục thưởng</button>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase">Chế tài</h3>
                                {editPolicy.penalties.map((p, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input className="flex-1 py-1.5 px-3 rounded border border-slate-200 text-sm" placeholder="Tên" value={p.name}
                                            onChange={(e) => { const arr = [...editPolicy.penalties]; arr[i] = { ...p, name: e.target.value }; setEditPolicy({ ...editPolicy, penalties: arr }); }} />
                                        <input className="w-28 py-1.5 px-3 rounded border border-slate-200 text-sm" placeholder="Phạt" value={p.fine}
                                            onChange={(e) => { const arr = [...editPolicy.penalties]; arr[i] = { ...p, fine: e.target.value }; setEditPolicy({ ...editPolicy, penalties: arr }); }} />
                                        <input className="flex-1 py-1.5 px-3 rounded border border-slate-200 text-sm" placeholder="Mô tả" value={p.desc}
                                            onChange={(e) => { const arr = [...editPolicy.penalties]; arr[i] = { ...p, desc: e.target.value }; setEditPolicy({ ...editPolicy, penalties: arr }); }} />
                                        <button onClick={() => setEditPolicy({ ...editPolicy, penalties: editPolicy.penalties.filter((_, j) => j !== i) })}
                                            className="p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                                <button onClick={() => setEditPolicy({ ...editPolicy, penalties: [...editPolicy.penalties, { name: "", desc: "", fine: "" }] })}
                                    className="text-xs text-teal-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Thêm chế tài</button>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase">Ghi chú hoa hồng</h3>
                                <textarea className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm" rows={2}
                                    value={editPolicy.commissionNote}
                                    onChange={(e) => setEditPolicy({ ...editPolicy, commissionNote: e.target.value })} />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100">Hủy</button>
                            <button onClick={handleSave} disabled={isSaving}
                                className="px-5 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
                                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                                Lưu chính sách
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
