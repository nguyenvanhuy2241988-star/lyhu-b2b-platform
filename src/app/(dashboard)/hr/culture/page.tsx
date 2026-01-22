"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import {
    CultureEvent, FundTransaction, HRProfile,
    getCultureEvents, getFundTransactions, getFundBalance, getUpcomingBirthdays, addFundTransaction
} from "@/lib/hrStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Gift, Calendar, TrendingUp, TrendingDown, DollarSign, X } from "lucide-react";

export default function HRCulturePage() {
    const { role } = useAuth();
    const isAdmin = role === ROLES.ADMIN;

    const [events, setEvents] = useState<CultureEvent[]>([]);
    const [transactions, setTransactions] = useState<FundTransaction[]>([]);
    const [birthdays, setBirthdays] = useState<any[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isTransModalOpen, setIsTransModalOpen] = useState(false);
    const [newTrans, setNewTrans] = useState({ description: '', amount: '', type: 'expense', category: 'Ăn uống' });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
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
            } catch (error) {
                console.error("Failed to load culture data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
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
            // Reload Data
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-auto">
            {/* Header */}
            <div className="px-8 py-6 bg-white border-b border-slate-100 mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Gift className="text-pink-500" />
                    Văn hóa & Quỹ Công ty
                </h1>
                <p className="text-slate-500 mt-1">Nơi cập nhật sự kiện và minh bạch tài chính nội bộ</p>
            </div>

            <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">

                {/* LEFT COL: EVENTS */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            Sự kiện sắp tới
                        </h2>

                        {loading ? (
                            <div className="h-20 flex items-center justify-center text-slate-400">Đang tải...</div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 italic">Chưa có sự kiện nào sắp diễn ra.</div>
                        ) : (
                            <div className="space-y-4">
                                {events.map(event => (
                                    <div key={event.id} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 transition">
                                        <div className="flex-shrink-0 w-16 h-16 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                                            <span className="text-xs text-red-500 font-bold uppercase">
                                                {format(new Date(event.start_time), 'MMM', { locale: vi })}
                                            </span>
                                            <span className="text-xl font-bold text-slate-800">
                                                {format(new Date(event.start_time), 'dd')}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{event.title}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-2">{event.description}</p>
                                            <div className="mt-2 text-xs flex gap-2">
                                                <span className={`px-2 py-0.5 rounded-full capitalize ${event.type === 'party' ? 'bg-pink-100 text-pink-700' :
                                                    event.type === 'holiday' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {event.type}
                                                </span>
                                                <span className="text-slate-400 flex items-center gap-1">
                                                    ⏰ {format(new Date(event.start_time), 'HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* BIRTHDAYS WIDGET (Static Placeholder for now or connect to hrStore if implementing) */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                            <Gift size={120} />
                        </div>
                        <h3 className="font-bold text-lg mb-1">Sinh nhật tháng này 🎂</h3>
                        <p className="text-indigo-100 text-sm mb-4">Gửi lời chúc mừng đến các thành viên có sinh nhật trong tháng!</p>

                        {birthdays.length === 0 ? (
                            <p className="text-sm opacity-80 italic">Không có sinh nhật nào trong tháng này.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {birthdays.map((b, idx) => (
                                    <div key={b.id} className="relative group cursor-pointer">
                                        <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-200 flex items-center justify-center overflow-hidden">
                                            {b.avatar_url ? <img src={b.avatar_url} className="w-full h-full object-cover" /> : <span className="text-blue-700 font-bold text-xs">{b.full_name?.charAt(0)}</span>}
                                        </div>
                                        <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                            {b.day}/{b.month + 1} - {b.full_name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COL: FUND */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-fit">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        Quỹ Công Ty
                    </h2>

                    {/* Balance Card */}
                    <div className="bg-slate-900 rounded-xl p-6 text-white text-center mb-8 shadow-md">
                        <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Số dư hiện tại</p>
                        <div className="text-3xl font-bold text-green-400 tracking-tight">
                            {formatCurrency(balance)}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 italic">Cập nhật realtime</p>
                    </div>

                    {/* Recent Transactions */}
                    <h3 className="font-semibold text-sm text-slate-500 uppercase mb-4">Hoạt động gần đây</h3>
                    <div className="space-y-4 flex-1 overflow-auto max-h-[400px] pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center text-slate-400 text-sm">Đang tải giao dịch...</div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center text-slate-400 text-sm italic">Chưa có giao dịch nào.</div>
                        ) : (
                            transactions.map(t => (
                                <div key={t.id} className="flex justify-between items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                    <div className="flex gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                            {t.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 line-clamp-1">{t.description}</p>
                                            <p className="text-xs text-slate-400">
                                                {format(new Date(t.created_at), 'dd/MM/yyyy')} • {t.category}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-slate-800'
                                        }`}>
                                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => setIsTransModalOpen(true)}
                            className="w-full mt-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-lg transition text-sm"
                        >
                            Quản lý Thu/Chi
                        </button>
                    )}
                </div>
            </div>

            {/* Transaction Modal */}
            {
                isTransModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl w-full max-w-sm p-6 relative">
                            <button
                                onClick={() => setIsTransModalOpen(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Thêm giao dịch quỹ</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Loại giao dịch</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setNewTrans({ ...newTrans, type: 'income' })}
                                            className={`flex-1 py-2 rounded text-sm font-medium border ${newTrans.type === 'income' ? 'bg-green-100 border-green-200 text-green-700' : 'border-slate-200 text-slate-500'}`}
                                        >
                                            Thu (Income)
                                        </button>
                                        <button
                                            onClick={() => setNewTrans({ ...newTrans, type: 'expense' })}
                                            className={`flex-1 py-2 rounded text-sm font-medium border ${newTrans.type === 'expense' ? 'bg-red-100 border-red-200 text-red-700' : 'border-slate-200 text-slate-500'}`}
                                        >
                                            Chi (Expense)
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Số tiền</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded px-3 py-2 outline-none"
                                        placeholder="0"
                                        value={newTrans.amount}
                                        onChange={e => setNewTrans({ ...newTrans, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Danh mục</label>
                                    <select
                                        className="w-full border rounded px-3 py-2 outline-none"
                                        value={newTrans.category}
                                        onChange={e => setNewTrans({ ...newTrans, category: e.target.value })}
                                    >
                                        <option value="Ăn uống">Ăn uống / Party</option>
                                        <option value="Sinh nhật">Quà Sinh nhật</option>
                                        <option value="Du lịch">Du lịch / Team Building</option>
                                        <option value="Khác">Khác</option>
                                        <option value="Đóng quỹ">Đóng quỹ hàng tháng</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                                    <input
                                        className="w-full border rounded px-3 py-2 outline-none"
                                        placeholder="Nội dung chi tiêu..."
                                        value={newTrans.description}
                                        onChange={e => setNewTrans({ ...newTrans, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mt-6">
                                <button
                                    onClick={handleAddTransaction}
                                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
                                >
                                    Xác nhận
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
