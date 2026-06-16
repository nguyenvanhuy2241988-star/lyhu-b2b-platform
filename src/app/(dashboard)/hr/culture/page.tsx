"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import {
    CultureEvent, FundTransaction, FundContribution,
    getCultureEvents, getFundTransactions, getFundBalance, getUpcomingBirthdays,
    addFundTransaction, updateFundTransaction, deleteFundTransaction,
    getFundContributions, upsertFundContribution, confirmFundContribution, unmarkFundPaid,
    getFundMonthlyReport, getHRProfiles, hideHRProfile, unhideHRProfile, uploadReceiptImages
} from "@/lib/hrStore";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, TrendingUp, TrendingDown, Wallet, X, Cake, Plus, QrCode, ChevronLeft, ChevronRight, Check, Clock, Receipt, Settings, Pencil, Trash2, EyeOff, Eye, Edit3 } from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

const DEFAULT_BANK_CONFIG = {
    bankId: 'MB',
    accountNo: '',
    accountName: '',
    monthlyAmount: 50000,
    companyAmount: 950000,
    initialBalance: 0
};

export default function HRCulturePage() {
    const { role: userRole, user } = useAuth();
    const isAdmin = userRole === ROLES.ADMIN || userRole === ROLES.ACCOUNTANT || userRole === ROLES.RECRUITER;
    const isSuperAdmin = userRole === ROLES.ADMIN || userRole === ROLES.ACCOUNTANT;

    const [events, setEvents] = useState<CultureEvent[]>([]);
    const [transactions, setTransactions] = useState<FundTransaction[]>([]);
    const [birthdays, setBirthdays] = useState<any[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [showHidden, setShowHidden] = useState(false);

    // Bank config from DB
    const [bankConfig, setBankConfig] = useState(DEFAULT_BANK_CONFIG);
    const [settingsId, setSettingsId] = useState<string | null>(null);
    const [showBankSettings, setShowBankSettings] = useState(false);
    const [editBank, setEditBank] = useState(DEFAULT_BANK_CONFIG);

    // Contribution tracking
    const [contributions, setContributions] = useState<FundContribution[]>([]);
    const [contribMonth, setContribMonth] = useState(new Date().getMonth() + 1);
    const [contribYear, setContribYear] = useState(new Date().getFullYear());

    // Monthly report
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [monthlyReport, setMonthlyReport] = useState<any>(null);

    // Overview time filter
    const [overviewMonth, setOverviewMonth] = useState(new Date().getMonth() + 1);
    const [overviewYear, setOverviewYear] = useState(new Date().getFullYear());

    // QR Modal
    const [showQr, setShowQr] = useState(false);

    // Transaction Modal (add/edit)
    const [isTransModalOpen, setIsTransModalOpen] = useState(false);
    const [editingTrans, setEditingTrans] = useState<FundTransaction | null>(null);
    const [newTrans, setNewTrans] = useState({ description: '', amount: '', type: 'expense', category: 'Ăn uống', created_at: '' });
    const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Delete confirmation
    const [deletingTransId, setDeletingTransId] = useState<string | null>(null);

    // Active tab
    const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'report'>('overview');

    // Realtime refresh functions
    const refreshBalance = useCallback(() => {
        getFundBalance().then(setBalance);
    }, []);

    const refreshTransactions = useCallback(() => {
        getFundTransactions().then(setTransactions);
    }, []);

    const refreshProfiles = useCallback(() => {
        getHRProfiles(undefined, showHidden).then(setAllProfiles);
        getUpcomingBirthdays().then(setBirthdays);
    }, [showHidden]);

    useEffect(() => {
        refreshProfiles();
    }, [refreshProfiles]);

    const loadBankConfig = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('id, fund_bank_config')
                .limit(1)
                .single();
            if (!error && data) {
                setSettingsId(data.id);
                if (data.fund_bank_config) {
                    setBankConfig({ ...DEFAULT_BANK_CONFIG, ...data.fund_bank_config });
                }
            }
        } catch (e) { console.error(e); }
    }, []);

    const saveBankConfig = async () => {
        if (!settingsId) return;
        try {
            const { error } = await supabase
                .from('app_settings')
                .update({ fund_bank_config: editBank })
                .eq('id', settingsId);
            if (error) throw error;
            setBankConfig(editBank);
            refreshBalance();
            setShowBankSettings(false);
        } catch (e) {
            console.error(e);
            alert("Lỗi lưu cấu hình");
        }
    };

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            try {
                const [eventsData, transData, balanceData] = await Promise.all([
                    getCultureEvents(),
                    getFundTransactions(),
                    getFundBalance()
                ]);
                setEvents(eventsData);
                setTransactions(transData);
                setBalance(balanceData);
            } catch (error) {
                console.error("Failed to load culture data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
        loadBankConfig();
    }, [loadBankConfig]);

    // Realtime subscriptions
    useEffect(() => {
        const channel = supabase
            .channel('hr-culture-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                refreshProfiles();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'fund_transactions' }, () => {
                refreshTransactions();
                refreshBalance();
                // Refresh report if on report tab
                getFundMonthlyReport(reportMonth, reportYear).then(setMonthlyReport).catch(console.error);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'fund_contributions' }, () => {
                getFundContributions(contribMonth, contribYear).then(setContributions);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
                loadBankConfig();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [refreshBalance, refreshTransactions, refreshProfiles, loadBankConfig, contribMonth, contribYear, reportMonth, reportYear]);

    // Load contributions when month changes
    useEffect(() => {
        getFundContributions(contribMonth, contribYear).then(setContributions).catch(console.error);
    }, [contribMonth, contribYear]);

    // Load monthly report when month changes
    useEffect(() => {
        getFundMonthlyReport(reportMonth, reportYear).then(setMonthlyReport).catch(console.error);
    }, [reportMonth, reportYear]);

    // Filter transactions by overview month
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const d = new Date(t.created_at);
            return d.getMonth() + 1 === overviewMonth && d.getFullYear() === overviewYear;
        });
    }, [transactions, overviewMonth, overviewYear]);

    // Overview balance for selected month
    const overviewIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0), [filteredTransactions]);
    const overviewExpense = useMemo(() => filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [filteredTransactions]);

    // ADD / EDIT transaction
    const openAddTransaction = () => {
        setEditingTrans(null);
        setNewTrans({ description: '', amount: '', type: 'expense', category: 'Ăn uống', created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm") });
        setReceiptFiles([]);
        setIsTransModalOpen(true);
    };

    const openEditTransaction = (t: FundTransaction) => {
        setEditingTrans(t);
        setNewTrans({
            description: t.description,
            amount: String(t.amount),
            type: t.type,
            category: t.category || 'Khác',
            created_at: format(new Date(t.created_at), "yyyy-MM-dd'T'HH:mm")
        });
        setReceiptFiles([]);
        setIsTransModalOpen(true);
    };

    const handleSaveTransaction = async () => {
        if (!newTrans.description || !newTrans.amount) return;
        setIsUploading(true);
        try {
            let uploadedUrls: string[] = [];
            if (receiptFiles.length > 0) {
                uploadedUrls = await uploadReceiptImages(receiptFiles);
            }
            
            // Retain old attachments if no new ones are uploaded during edit
            const attachment_url = uploadedUrls.length > 0 
                ? JSON.stringify(uploadedUrls) 
                : editingTrans?.attachment_url;

            if (editingTrans) {
                await updateFundTransaction(editingTrans.id, {
                    description: newTrans.description,
                    amount: Number(newTrans.amount),
                    type: newTrans.type as 'income' | 'expense',
                    category: newTrans.category,
                    attachment_url,
                    ...(newTrans.created_at ? { created_at: new Date(newTrans.created_at).toISOString() } : {})
                });
            } else {
                await addFundTransaction({
                    description: newTrans.description,
                    amount: Number(newTrans.amount),
                    type: newTrans.type as 'income' | 'expense',
                    category: newTrans.category,
                    attachment_url,
                    ...(newTrans.created_at ? { created_at: new Date(newTrans.created_at).toISOString() } : {})
                });
            }
            refreshTransactions();
            refreshBalance();
            setIsTransModalOpen(false);
            setEditingTrans(null);
            setReceiptFiles([]);
        } catch (error) {
            console.error(error);
            alert("Lỗi lưu giao dịch");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        try {
            await deleteFundTransaction(id);
            refreshTransactions();
            refreshBalance();
            setDeletingTransId(null);
        } catch (e) {
            console.error(e);
            alert("Lỗi xóa giao dịch");
        }
    };

    const handleConfirmContribution = async (contribId: string) => {
        if (!user?.id) return;
        try {
            await confirmFundContribution(contribId, user.id);
            getFundContributions(contribMonth, contribYear).then(setContributions);
        } catch (e) { console.error(e); alert("Lỗi xác nhận"); }
    };

    const handleMarkPaid = async (userId: string) => {
        try {
            await upsertFundContribution(userId, contribMonth, contribYear, 'confirmed');
            getFundContributions(contribMonth, contribYear).then(setContributions);
        } catch (e) { console.error(e); alert("Lỗi"); }
    };

    const handleMarkUnpaid = async (userId: string) => {
        try {
            await unmarkFundPaid(userId, contribMonth, contribYear);
            getFundContributions(contribMonth, contribYear).then(setContributions);
        } catch (e) { console.error(e); alert("Lỗi"); }
    };

    const handleHideProfile = async (userId: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn ẩn nhân sự ${name}?`)) return;
        try {
            await hideHRProfile(userId);
            refreshProfiles();
        } catch (e) { console.error(e); alert("Lỗi ẩn nhân sự"); }
    };

    const handleUnhideProfile = async (userId: string, name: string) => {
        if (!confirm(`Khôi phục lại nhân sự ${name}?`)) return;
        try {
            await unhideHRProfile(userId);
            refreshProfiles();
        } catch (e) { console.error(e); alert("Lỗi khôi phục nhân sự"); }
    };

    const fmt = (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const employeeCount = allProfiles.filter(p => p.status !== 'inactive').length;
    const monthlyPerPerson = bankConfig.monthlyAmount || 50000;
    const monthlyCompany = bankConfig.companyAmount || (monthlyPerPerson * employeeCount);

    const contributionList = useMemo(() => {
        return allProfiles.map(p => {
            const contrib = contributions.find(c => c.user_id === p.id);
            return {
                userId: p.id,
                fullName: p.full_name,
                avatarUrl: p.avatar_url,
                status: contrib?.status || 'pending',
                contribId: contrib?.id,
                confirmedAt: contrib?.confirmed_at,
                profileStatus: p.status
            };
        });
    }, [allProfiles, contributions]);

    const paidCount = contributionList.filter(c => c.status === 'confirmed').length;

    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    const qrMemo = `Dong quy T${contribMonth}/${contribYear}`;
    const qrUrl = bankConfig.accountNo
        ? `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact.png?amount=${monthlyPerPerson}&addInfo=${encodeURIComponent(qrMemo)}&accountName=${encodeURIComponent(bankConfig.accountName)}`
        : '';

    const bankNames: Record<string, string> = {
        'MB': 'MB Bank', 'VCB': 'Vietcombank', 'TCB': 'Techcombank', 'ACB': 'ACB',
        'BIDV': 'BIDV', 'VTB': 'VietinBank', 'TPB': 'TPBank', 'VPB': 'VPBank',
        'STB': 'Sacombank', 'MSB': 'MSB', 'SHB': 'SHB', 'EIB': 'Eximbank',
    };

    const MonthNav = ({ month, year, setMonth, setYear }: { month: number; year: number; setMonth: (m: number | ((p: number) => number)) => void; setYear: (y: number | ((p: number) => number)) => void }) => (
        <div className="flex items-center gap-2">
            <button onClick={() => { if (month === 1) { setMonth(12); setYear((y: number) => y - 1); } else setMonth((m: number) => m - 1); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <span className="text-sm font-semibold text-slate-900 min-w-[120px] text-center">
                {monthNames[month - 1]}, {year}
            </span>
            <button onClick={() => { if (month === 12) { setMonth(1); setYear((y: number) => y + 1); } else setMonth((m: number) => m + 1); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Văn hóa & Quỹ Công ty</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Cập nhật sự kiện và minh bạch tài chính nội bộ</p>
                </div>
                {isAdmin && (
                    <button onClick={() => { setEditBank(bankConfig); setShowBankSettings(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" /> Cài đặt
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                {[
                    { key: 'overview', label: 'Tổng quan' },
                    { key: 'contributions', label: 'Đóng quỹ' },
                    { key: 'report', label: 'Báo cáo tháng' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ===================== TAB: OVERVIEW ===================== */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Events */}
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
                                                                }`}>{event.type}</span>
                                                            <span className="text-[10px] text-slate-400">{format(new Date(event.start_time), 'HH:mm')}</span>
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
                                                        {b.avatar_url ? <img src={b.avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-xs font-semibold text-slate-500">{b.full_name?.charAt(0)}</span>}
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-900 truncate flex-1">{b.full_name}</p>
                                                    <span className="text-xs text-slate-400 shrink-0">{String(b.day).padStart(2, '0')}/{String(b.month + 1).padStart(2, '0')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right: Fund */}
                        <div className="space-y-6">
                            <section className="bg-white rounded-xl border border-slate-200">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                                    <Wallet className="w-4 h-4 text-slate-400" />
                                    <h2 className="text-sm font-semibold text-slate-900">Quỹ Công ty</h2>
                                </div>
                                <div className="p-5">
                                    <p className="text-xs text-slate-400 mb-1">Số dư hiện tại</p>
                                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(balance)}</p>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="px-3 py-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => isAdmin && setShowBankSettings(true)}>
                                            <p className="text-[10px] text-slate-400">Nhân sự đóng</p>
                                            <p className="text-sm font-semibold text-slate-900">{fmt(monthlyPerPerson)}/người</p>
                                        </div>
                                        <div className="px-3 py-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => isAdmin && setShowBankSettings(true)}>
                                            <p className="text-[10px] text-slate-400">Công ty đóng</p>
                                            <p className="text-sm font-semibold text-slate-900">{fmt(monthlyCompany)}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Recent Transactions with time filter */}
                            <section className="bg-white rounded-xl border border-slate-200">
                                <div className="px-5 py-4 border-b border-slate-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-slate-900">Hoạt động gần đây</h3>
                                        {isAdmin && (
                                            <button onClick={openAddTransaction} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
                                                <Plus className="w-3.5 h-3.5" /> Thêm
                                            </button>
                                        )}
                                    </div>
                                    <MonthNav month={overviewMonth} year={overviewYear} setMonth={setOverviewMonth} setYear={setOverviewYear} />
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span>Thu: <strong className="text-emerald-600">{fmt(overviewIncome)}</strong></span>
                                        <span>Chi: <strong className="text-rose-600">{fmt(overviewExpense)}</strong></span>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100 max-h-[400px] overflow-auto">
                                    {filteredTransactions.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-6">Không có giao dịch nào trong tháng này.</p>
                                    ) : filteredTransactions.map(t => (
                                        <div key={t.id} className="p-4 flex items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-slate-900">{t.description}</p>
                                                    {t.attachment_url && (
                                                        <a href={JSON.parse(t.attachment_url)[0]} target="_blank" rel="noreferrer" title="Xem hóa đơn/chứng từ" className="text-slate-400 hover:text-primary-600 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500">{format(new Date(t.created_at), 'dd/MM/yyyy HH:mm')}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="text-xs text-slate-500">{t.category}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                                                </span>
                                                {isSuperAdmin && (
                                                    <div className="hidden group-hover:flex items-center gap-1">
                                                        <button onClick={() => openEditTransaction(t)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"><Edit3 className="w-4 h-4" /></button>
                                                        <button onClick={() => setDeletingTransId(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== TAB: CONTRIBUTIONS ===================== */}
            {activeTab === 'contributions' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <MonthNav month={contribMonth} year={contribYear} setMonth={setContribMonth} setYear={setContribYear} />
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500">
                                <strong className="text-emerald-600">{paidCount}</strong>/{employeeCount} đã đóng
                            </span>
                            <button onClick={() => setShowQr(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                <QrCode className="w-4 h-4" /> Mã QR
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-400 mb-1">Đã thu</p>
                            <p className="text-lg font-bold text-emerald-600">{fmt(paidCount * monthlyPerPerson)}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-400 mb-1">Chưa thu</p>
                            <p className="text-lg font-bold text-amber-600">{fmt((employeeCount - paidCount) * monthlyPerPerson)}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-400 mb-1">Công ty đóng thêm</p>
                            <p className="text-lg font-bold text-slate-900">{fmt(monthlyCompany)}</p>
                        </div>
                    </div>

                    <section className="bg-white rounded-xl border border-slate-200">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">Danh sách đóng quỹ</h3>
                            <div className="flex items-center gap-4">
                                {isAdmin && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500" />
                                        <span className="text-xs text-slate-500">Hiển thị người bị ẩn</span>
                                    </label>
                                )}
                                <span className="text-xs text-slate-400">{fmt(monthlyPerPerson)}/người</span>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {contributionList.map((c) => (
                                <div key={c.userId} className="px-5 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                            {c.avatarUrl ? <img src={c.avatarUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-xs font-semibold text-slate-500">{c.fullName?.charAt(0)}</span>}
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 truncate">{c.fullName}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {c.status === 'confirmed' ? (
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                    <Check className="w-3 h-3" /> Đã đóng
                                                </span>
                                                {isAdmin && (
                                                    <button onClick={() => handleMarkUnpaid(c.userId)}
                                                        className="text-xs text-rose-600 hover:text-rose-700 font-medium ml-2">Bỏ đã đóng</button>
                                                )}
                                            </div>
                                        ) : c.status === 'paid' ? (
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                                    <Clock className="w-3 h-3" /> Chờ xác nhận
                                                </span>
                                                {isAdmin && c.contribId && (
                                                    <button onClick={() => handleConfirmContribution(c.contribId!)}
                                                        className="text-xs text-primary-600 hover:text-primary-700 font-medium">Xác nhận</button>
                                                )}
                                                {isAdmin && (
                                                    <button onClick={() => handleMarkUnpaid(c.userId)}
                                                        className="text-xs text-rose-600 hover:text-rose-700 font-medium ml-2">Bỏ</button>
                                                )}
                                            </div>
                                        ) : c.profileStatus === 'inactive' ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400 italic">Đã ẩn</span>
                                                {isAdmin && (
                                                    <button onClick={() => handleUnhideProfile(c.userId, c.fullName)} title="Khôi phục lại nhân sự"
                                                        className="text-primary-600 hover:text-primary-700 p-1 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">Chưa đóng</span>
                                                {isAdmin && (
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => handleMarkPaid(c.userId)}
                                                            className="text-xs text-primary-600 hover:text-primary-700 font-medium">Đánh dấu đã đóng</button>
                                                        <button onClick={() => handleHideProfile(c.userId, c.fullName)} title="Ẩn nhân sự khỏi danh sách"
                                                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"><EyeOff className="w-4 h-4" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {contributionList.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-8">Chưa có dữ liệu nhân sự.</p>
                        )}
                    </section>
                </div>
            )}

            {/* ===================== TAB: MONTHLY REPORT ===================== */}
            {activeTab === 'report' && (
                <div className="space-y-6">
                    <MonthNav month={reportMonth} year={reportYear} setMonth={setReportMonth} setYear={setReportYear} />

                    {monthlyReport && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <section className="bg-white rounded-xl border border-slate-200 p-5">
                                    <p className="text-xs text-slate-400 mb-1">Tổng thu trong tháng</p>
                                    <p className="text-xl font-bold text-emerald-600">{fmt(monthlyReport.totalIncome)}</p>
                                </section>
                                <section className="bg-white rounded-xl border border-slate-200 p-5">
                                    <p className="text-xs text-slate-400 mb-1">Tổng chi trong tháng</p>
                                    <p className="text-xl font-bold text-rose-600">{fmt(monthlyReport.totalExpense)}</p>
                                </section>
                                <section className="bg-white rounded-xl border border-slate-200 p-5">
                                    <p className="text-xs text-slate-400 mb-1">Thặng dư / Thâm hụt</p>
                                    <p className={`text-xl font-bold ${monthlyReport.totalIncome - monthlyReport.totalExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {fmt(monthlyReport.totalIncome - monthlyReport.totalExpense)}
                                    </p>
                                </section>
                            </div>

                            {Object.keys(monthlyReport.byCategory).length > 0 && (
                                <section className="bg-white rounded-xl border border-slate-200">
                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                                        <Receipt className="w-4 h-4 text-slate-400" />
                                        <h3 className="text-sm font-semibold text-slate-900">Chi tiết theo danh mục</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {Object.entries(monthlyReport.byCategory).map(([cat, vals]: [string, any]) => {
                                            const net = vals.income - vals.expense;
                                            return (
                                                <div key={cat} className="px-5 py-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium text-slate-900">{cat}</span>
                                                        <span className={`text-sm font-bold ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {net >= 0 ? '+' : ''}{fmt(net)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                                        {vals.income > 0 && <span>Thu: <strong className="text-emerald-600">{fmt(vals.income)}</strong></span>}
                                                        {vals.expense > 0 && <span>Chi: <strong className="text-rose-600">{fmt(vals.expense)}</strong></span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            <section className="bg-white rounded-xl border border-slate-200">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-900">Tất cả giao dịch trong tháng</h3>
                                    <span className="text-xs text-slate-400">{monthlyReport.transactions.length} giao dịch</span>
                                </div>
                                {monthlyReport.transactions.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-8">Không có giao dịch nào trong tháng này.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-left">
                                                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400">Ngày</th>
                                                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400">Nội dung</th>
                                                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400">Danh mục</th>
                                                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400">Loại</th>
                                                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400 text-right">Số tiền</th>
                                                    {isAdmin && <th className="px-3 py-2.5 text-xs font-medium text-slate-400 w-16"></th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {monthlyReport.transactions.map((t: FundTransaction) => (
                                                    <tr key={t.id} className="hover:bg-slate-50/50 group">
                                                        <td className="px-5 py-2.5 text-slate-500 whitespace-nowrap">{format(new Date(t.created_at), 'dd/MM/yyyy')}</td>
                                                        <td className="px-5 py-2.5 text-slate-900">{t.description}</td>
                                                        <td className="px-5 py-2.5">
                                                            <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{t.category || 'Khác'}</span>
                                                        </td>
                                                        <td className="px-5 py-2.5">
                                                            <span className={`text-xs font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {t.type === 'income' ? 'Thu' : 'Chi'}
                                                            </span>
                                                        </td>
                                                        <td className={`px-5 py-2.5 text-right font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                                                        </td>
                                                        {isAdmin && (
                                                            <td className="px-3 py-2.5">
                                                                <div className="hidden group-hover:flex items-center gap-1 justify-center">
                                                                    <button onClick={() => openEditTransaction(t)} className="p-1 text-slate-400 hover:text-primary-600 rounded"><Pencil className="w-3 h-3" /></button>
                                                                    <button onClick={() => setDeletingTransId(t.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded"><Trash2 className="w-3 h-3" /></button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-slate-200 bg-slate-50">
                                                    <td colSpan={4} className="px-5 py-2.5 text-sm font-medium text-slate-700">Tổng cộng</td>
                                                    <td className={`px-5 py-2.5 text-right font-bold ${monthlyReport.totalIncome - monthlyReport.totalExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {fmt(monthlyReport.totalIncome - monthlyReport.totalExpense)}
                                                    </td>
                                                    {isAdmin && <td></td>}
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            )}

            {/* ===================== DELETE CONFIRM ===================== */}
            {deletingTransId && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeletingTransId(null)}>
                    <div className="bg-white rounded-xl w-full max-w-xs p-5 space-y-4" onClick={e => e.stopPropagation()}>
                        <p className="text-sm font-semibold text-slate-900">Xác nhận xóa giao dịch?</p>
                        <p className="text-xs text-slate-400">Thao tác này không thể hoàn tác. Số dư quỹ sẽ được cập nhật lại.</p>
                        <div className="flex gap-2">
                            <button onClick={() => setDeletingTransId(null)} className="flex-1 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Hủy</button>
                            <button onClick={() => handleDeleteTransaction(deletingTransId)} className="flex-1 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors">Xóa</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== QR MODAL ===================== */}
            {showQr && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowQr(false)}>
                    <div className="bg-white rounded-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Chuyển khoản đóng quỹ</h3>
                            <button onClick={() => setShowQr(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {!bankConfig.accountNo ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-slate-500">Chưa cấu hình tài khoản ngân hàng.</p>
                                    {isAdmin && <p className="text-xs text-slate-400 mt-1">Vào Cài đặt để thêm thông tin ngân hàng.</p>}
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-center">
                                        <img src={qrUrl} alt="VietQR" className="w-48 h-48 rounded-lg border border-slate-200" />
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-400">Ngân hàng</span><span className="font-medium text-slate-900">{bankNames[bankConfig.bankId] || bankConfig.bankId}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Số tài khoản</span><span className="font-medium text-slate-900">{bankConfig.accountNo}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Chủ tài khoản</span><span className="font-medium text-slate-900">{bankConfig.accountName}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Số tiền</span><span className="font-bold text-emerald-600">{fmt(monthlyPerPerson)}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Nội dung CK</span><span className="font-medium text-slate-900">{qrMemo}</span></div>
                                    </div>
                                    <p className="text-xs text-slate-400 text-center">Quét mã QR hoặc chuyển khoản thủ công theo thông tin trên</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== BANK SETTINGS MODAL ===================== */}
            {showBankSettings && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowBankSettings(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Cài đặt Quỹ Công ty</h3>
                            <button onClick={() => setShowBankSettings(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Ngân hàng</label>
                                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors"
                                    value={editBank.bankId} onChange={e => setEditBank({ ...editBank, bankId: e.target.value })}>
                                    <option value="MB">MB Bank</option><option value="VCB">Vietcombank</option><option value="TCB">Techcombank</option>
                                    <option value="ACB">ACB</option><option value="BIDV">BIDV</option><option value="VTB">VietinBank</option>
                                    <option value="TPB">TPBank</option><option value="VPB">VPBank</option><option value="STB">Sacombank</option>
                                    <option value="MSB">MSB</option><option value="SHB">SHB</option><option value="EIB">Eximbank</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Số tài khoản</label>
                                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors"
                                    placeholder="VD: 0388123456" value={editBank.accountNo} onChange={e => setEditBank({ ...editBank, accountNo: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Tên chủ tài khoản <span className="text-slate-300">(không dấu)</span></label>
                                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors"
                                    placeholder="VD: CONG TY TNHH LYHU" value={editBank.accountName} onChange={e => setEditBank({ ...editBank, accountName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Nhân sự đóng / tháng / người</label>
                                <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors"
                                    placeholder="50000" value={editBank.monthlyAmount} onChange={e => setEditBank({ ...editBank, monthlyAmount: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Công ty đóng / tháng</label>
                                <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors"
                                    placeholder="950000" value={editBank.companyAmount} onChange={e => setEditBank({ ...editBank, companyAmount: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Số dư ban đầu (VNĐ)</label>
                                <input type="number" disabled={!isSuperAdmin} className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors ${!isSuperAdmin ? 'bg-slate-50 cursor-not-allowed text-slate-400' : ''}`}
                                    placeholder="0" value={editBank.initialBalance} onChange={e => setEditBank({ ...editBank, initialBalance: Number(e.target.value) })} />
                                {!isSuperAdmin && <p className="text-[10px] text-slate-400 mt-1">Chỉ Admin và Kế toán được sửa số dư đầu kỳ.</p>}
                            </div>
                        </div>
                        <div className="px-5 pb-5">
                            <button onClick={saveBankConfig} className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">Lưu cài đặt</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== TRANSACTION MODAL (ADD/EDIT) ===================== */}
            {isTransModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setIsTransModalOpen(false); setEditingTrans(null); }}>
                    <div className="bg-white rounded-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">{editingTrans ? 'Sửa giao dịch' : 'Thêm giao dịch quỹ'}</h3>
                            <button onClick={() => { setIsTransModalOpen(false); setEditingTrans(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Loại giao dịch</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setNewTrans({ ...newTrans, type: 'income' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${newTrans.type === 'income' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Thu</button>
                                    <button onClick={() => setNewTrans({ ...newTrans, type: 'expense' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${newTrans.type === 'expense' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Chi</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Số tiền</label>
                                <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors" placeholder="0"
                                    value={newTrans.amount} onChange={e => setNewTrans({ ...newTrans, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Danh mục</label>
                                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors"
                                    value={newTrans.category} onChange={e => setNewTrans({ ...newTrans, category: e.target.value })}>
                                    <option value="Đóng quỹ">Đóng quỹ hàng tháng</option>
                                    <option value="Ăn uống">Ăn uống / Party</option>
                                    <option value="Sinh nhật">Quà Sinh nhật</option>
                                    <option value="Du lịch">Du lịch / Team Building</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Mô tả</label>
                                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors" placeholder="Nội dung giao dịch..."
                                    value={newTrans.description} onChange={e => setNewTrans({ ...newTrans, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Thời gian giao dịch</label>
                                <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-colors"
                                    value={newTrans.created_at} onChange={e => setNewTrans({ ...newTrans, created_at: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Hóa đơn / Chứng từ (Nhiều ảnh)</label>
                                <input type="file" multiple accept="image/*" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                    onChange={e => setReceiptFiles(e.target.files ? Array.from(e.target.files) : [])} />
                                {editingTrans?.attachment_url && receiptFiles.length === 0 && (
                                    <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        Đã có hóa đơn đính kèm
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="px-5 pb-5">
                            <button onClick={handleSaveTransaction} disabled={isUploading}
                                className={`w-full py-2.5 text-white rounded-lg text-sm font-medium transition-colors ${isUploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}>
                                {isUploading ? 'Đang lưu và tải ảnh...' : 'Lưu giao dịch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
