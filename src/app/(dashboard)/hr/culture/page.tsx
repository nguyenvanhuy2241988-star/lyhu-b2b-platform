"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import {
    CultureEvent, FundTransaction,
    getCultureEvents, getFundTransactions, getFundBalance, getUpcomingBirthdays, addFundTransaction
} from "@/lib/hrStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, TrendingUp, TrendingDown, Wallet, Users, X, Cake, Plus } from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

export default function HRCulturePage() {
    const { role } = useAuth();
    const isAdmin = role === ROLES.ADMIN;

    const [events, setEvents] = useState<CultureEvent[]>([]);
    const [transactions, setTransactions] = useState<FundTransaction[]>([]);
    const [birthdays, setBirthdays] = useState<any[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [employeeCount, setEmployeeCount] = useState(0);

    // Modal State
    const [isTransModalOpen, setIsTransModalOpen] = useState(false);
    const [newTrans, setNewTrans] = useState({ description: '', amount: '', type: 'expense', category: 'Ăn uống' });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [eventsData, transData, balanceData, birthdaysData] = await Promise.all([
                    getCultureEvents(),
                    getFundTransactions(),
                    getFundBalance(),
                    getUpcomingBirthdays()
                ]);
                setEvents(eventsData);
                setTransactions(transData);
                setBalance(balanceData);
                setBirthdays(birthdaysData);

                // Get employee count for contribution calculation
                const { count } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });
                setEmployeeCount(count || 0);
            } catch (error) {
                console.error("Failed to load culture data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();

        const channel = supabase
            .channel('hr-culture-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    getUpcomingBirthdays().then(setBirthdays);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleAddTransaction = async () => {
        if (!newTrans.description || !newTrans.amount) return;
        try {
            await addFundTransaction({
                description: newTrans.description,
                amount: Number(newTrans.amount),
                type: newTrans.type as 'income' | 'expense',
                category: newTrans.category
            });
            const [transData, balanceData] = await Promise.all([getFundTransactions(), getFundBalance()]);
            setTransactions(transData);
            setBalance(balanceData);
            setIsTransModalOpen(false);
            setNewTrans({ description: '', amount: '', type: 'expense', category: 'Ăn uống' });
        } catch (error) {
            console.error(error);
            alert("Lỗi thêm giao dịch");
        }
    };

    const fmt = (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const monthlyPerPerson = 50000;
    const monthlyCompany = monthlyPerPerson * employeeCount;
    const monthlyTotal = (monthlyPerPerson * employeeCount) + monthlyCompany;

    return (
        <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-slate-900">Văn hóa & Quỹ Công ty</h1>
                <p className="text-sm text-slate-500 mt-0.5">Cập nhật sự kiện và minh bạch tài chính nội bộ</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: Events + Birthdays */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Upcoming Events */}
                    <section className="bg-white rounded-xl border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <h2 className="text-sm font-semibold text-slate-900">Sự kiện sắp tới</h2>
                        </div>
                        <div className="p-5">
                            {loading ? (
                                <p className="text-sm text-slate-400 text-center py-6">Đang tải...</p>
                            ) : events.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-6">Chưa có sự kiện nào sắp diễn ra.</p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {events.map(event => (
                                        <div key={event.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                                            {/* Date badge */}
                                            <div className="w-12 h-12 shrink-0 bg-slate-50 rounded-lg border border-slate-200 flex flex-col items-center justify-center">
                                                <span className="text-[10px] text-slate-400 uppercase font-medium">
                                                    {format(new Date(event.start_time), 'MMM', { locale: vi })}
                                                </span>
                                                <span className="text-lg font-bold text-slate-900 leading-tight">
                                                    {format(new Date(event.start_time), 'dd')}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{event.title}</p>
                                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{event.description}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${event.type === 'party' ? 'bg-pink-50 text-pink-600' :
                                                            event.type === 'holiday' ? 'bg-red-50 text-red-600' :
                                                                'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {event.type}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {format(new Date(event.start_time), 'HH:mm')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Birthdays */}
                    <section className="bg-white rounded-xl border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                            <Cake className="w-4 h-4 text-slate-400" />
                            <h2 className="text-sm font-semibold text-slate-900">Sinh nhật tháng này</h2>
                        </div>
                        <div className="p-5">
                            {birthdays.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">Không có sinh nhật nào trong tháng này.</p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {birthdays.map((b) => (
                                        <div key={b.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                {b.avatar_url ? (
                                                    <img src={b.avatar_url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        {b.full_name?.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-slate-900 truncate">{b.full_name}</p>
                                            </div>
                                            <span className="text-xs text-slate-400 shrink-0">
                                                {String(b.day).padStart(2, '0')}/{String(b.month + 1).padStart(2, '0')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Fund Contribution Model */}
                    <section className="bg-white rounded-xl border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            <h2 className="text-sm font-semibold text-slate-900">Đóng góp quỹ hàng tháng</h2>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="px-4 py-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-400 mb-1">Mỗi nhân sự</p>
                                    <p className="text-lg font-bold text-slate-900">{fmt(monthlyPerPerson)}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">/tháng/người</p>
                                </div>
                                <div className="px-4 py-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-400 mb-1">Công ty đóng thêm</p>
                                    <p className="text-lg font-bold text-slate-900">{fmt(monthlyCompany)}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">50k × {employeeCount} nhân sự</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                <span className="text-sm text-emerald-700 font-medium">Tổng quỹ mỗi tháng</span>
                                <span className="text-sm font-bold text-emerald-700">{fmt(monthlyTotal)}</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Quỹ dùng cho các hoạt động: Team Building, sinh nhật, liên hoan, và các hoạt động ngoại khóa chung.
                            </p>
                        </div>
                    </section>
                </div>

                {/* RIGHT: Fund Balance + Transactions */}
                <div className="space-y-6">
                    {/* Balance */}
                    <section className="bg-white rounded-xl border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                            <Wallet className="w-4 h-4 text-slate-400" />
                            <h2 className="text-sm font-semibold text-slate-900">Quỹ Công ty</h2>
                        </div>
                        <div className="p-5">
                            <p className="text-xs text-slate-400 mb-1">Số dư hiện tại</p>
                            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {fmt(balance)}
                            </p>
                        </div>
                    </section>

                    {/* Recent Transactions */}
                    <section className="bg-white rounded-xl border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Hoạt động gần đây</h3>
                            {isAdmin && (
                                <button
                                    onClick={() => setIsTransModalOpen(true)}
                                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Thêm
                                </button>
                            )}
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[420px] overflow-auto">
                            {loading ? (
                                <p className="text-sm text-slate-400 text-center py-6">Đang tải...</p>
                            ) : transactions.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-6">Chưa có giao dịch nào.</p>
                            ) : (
                                transactions.map(t => (
                                    <div key={t.id} className="px-5 py-3 flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                                                }`}>
                                                {t.type === 'income' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm text-slate-900 truncate">{t.description}</p>
                                                <p className="text-[11px] text-slate-400">
                                                    {format(new Date(t.created_at), 'dd/MM/yyyy')} · {t.category}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-700'
                                            }`}>
                                            {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Transaction Modal */}
            {isTransModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setIsTransModalOpen(false)}>
                    <div className="bg-white rounded-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Thêm giao dịch quỹ</h3>
                            <button onClick={() => setIsTransModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Loại giao dịch</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setNewTrans({ ...newTrans, type: 'income' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${newTrans.type === 'income'
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        Thu
                                    </button>
                                    <button
                                        onClick={() => setNewTrans({ ...newTrans, type: 'expense' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${newTrans.type === 'expense'
                                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        Chi
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Số tiền</label>
                                <input
                                    type="number"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors"
                                    placeholder="0"
                                    value={newTrans.amount}
                                    onChange={e => setNewTrans({ ...newTrans, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Danh mục</label>
                                <select
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors"
                                    value={newTrans.category}
                                    onChange={e => setNewTrans({ ...newTrans, category: e.target.value })}
                                >
                                    <option value="Đóng quỹ">Đóng quỹ hàng tháng</option>
                                    <option value="Ăn uống">Ăn uống / Party</option>
                                    <option value="Sinh nhật">Quà Sinh nhật</option>
                                    <option value="Du lịch">Du lịch / Team Building</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Mô tả</label>
                                <input
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors"
                                    placeholder="Nội dung giao dịch..."
                                    value={newTrans.description}
                                    onChange={e => setNewTrans({ ...newTrans, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="px-5 pb-5">
                            <button
                                onClick={handleAddTransaction}
                                className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
