"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Users,
    DollarSign,
    Plus,
    Search,
    Filter,
    Award,
    ShieldAlert,
    ChevronRight,
    MoreVertical,
    CheckCircle2,
    Clock,
    User as UserIcon,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    Lock,
    ShieldCheck,
    Mail,
    Settings,
    Save as SaveIcon
} from "lucide-react";
import { User, fetchUsers } from "@/lib/usersStore";
import { Order, fetchOrders } from "@/lib/ordersStore";
import {
    FinancialTransaction,
    PayrollConfig,
    PayrollLock,
    fetchPayrollConfig,
    fetchUserTransactions,
    addFinancialTransaction,
    updateTransactionStatus,
    fetchPayrollLocks,
    setPayrollLock,
    UserKpiSettings,
    fetchUserKpiSettings,
    updateUserKpiSettings
} from "@/lib/payrollStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { getRealtimeClient } from "@/lib/supabaseClient";
import { KPI_TEMPLATES, KpiFieldType, formatKpiValue } from "@/lib/kpi_config";
import {
    KpiMetricDefinition,
    fetchKpiMetrics,
    updateKpiMetricsBatch
} from "@/lib/kpiSalaryStore";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

export default function AdminPayrollPage() {
    const [staff, setStaff] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'finance' | 'orders'>('finance');
    const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
    const [locks, setLocks] = useState<PayrollLock[]>([]);

    // KPI Config State
    const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
    const [kpiSettings, setKpiSettings] = useState<UserKpiSettings | null>(null);
    const [isLoadingKpi, setIsLoadingKpi] = useState(false);
    const [kpiMetrics, setKpiMetrics] = useState<KpiMetricDefinition[]>([]);

    // Form state
    const [newTx, setNewTx] = useState({
        type: 'bonus' as 'bonus' | 'penalty',
        category: 'Thưởng Sáng kiến',
        amount: 50000,
        note: '',
        status: 'finalized' as 'estimated' | 'finalized'
    });

    const { session, user } = useAuth();

    const loadStaff = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const allUsers = await fetchUsers(session?.access_token);
            const telesalesStaff = allUsers.filter(u => u.role === 'telesales');
            setStaff(telesalesStaff);
            if (telesalesStaff.length > 0 && !selectedUserId) {
                setSelectedUserId(telesalesStaff[0].id);
            }
        } catch (err) {
            console.error("loadStaff error:", err);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [session?.access_token, selectedUserId]);

    const loadTransactions = useCallback(async (silent = false) => {
        if (!selectedUserId || !session?.access_token) return;
        try {
            const [txs, orders, config] = await Promise.all([
                fetchUserTransactions(selectedUserId, session.access_token),
                fetchOrders(session.access_token, {
                    userId: selectedUserId,
                    startDate: new Date(2024, 11, 1).toISOString(),
                    endDate: new Date(2024, 11, 31, 23, 59, 59).toISOString()
                }),
                fetchPayrollConfig('telesales_parttime', session.access_token)
            ]);

            setTransactions(txs);
            setUserOrders(orders);
            setPayrollConfig(config);
        } catch (err) {
            console.error("loadData error:", err);
        }
    }, [selectedUserId, session?.access_token]);

    const loadLocks = useCallback(async () => {
        if (!session?.access_token) return;
        try {
            const data = await fetchPayrollLocks(new Date().getFullYear(), session.access_token);
            setLocks(data);
        } catch (err) {
            console.error("loadLocks error:", err);
        }
    }, [session?.access_token]);

    const isMonthLocked = (month: number) => {
        return locks.some(l => l.month === month);
    };

    const handleLockMonth = async (month: number) => {
        if (!session?.access_token || !user?.id) return;
        if (!confirm(`Bạn có chắc chắn muốn CHỐT bảng lương tháng ${month}? Sau khi chốt, dữ liệu sẽ không thể thay đổi.`)) return;

        const success = await setPayrollLock(new Date().getFullYear(), month, user.id, session.access_token);
        if (success) {
            loadLocks();
        } else {
            alert("❌ Lỗi khi khóa bảng lương. Có thể tháng này đã được khóa trước đó.");
        }
    };

    useEffect(() => {
        loadStaff();
        loadLocks();
    }, [loadStaff, loadLocks]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    // Realtime Subscriptions
    useEffect(() => {
        const supabase = getRealtimeClient();

        const channel = supabase
            .channel('admin-payroll-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'financial_transactions' },
                (payload: any) => {
                    console.log("[Realtime] Financial transaction changed:", payload);
                    // Reload transactions if the change affects the currently selected user
                    if (payload.new && (payload.new as any).user_id === selectedUserId) {
                        loadTransactions();
                    } else if (payload.old && (payload.old as any).user_id === selectedUserId) {
                        loadTransactions();
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    console.log("[Realtime] Profile changed, reloading staff list...");
                    loadStaff();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedUserId, session?.access_token, loadTransactions, loadStaff]);

    const filteredStaff = useMemo(() => {
        return staff.filter(s =>
            (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [staff, searchTerm]);

    const stats = useMemo(() => {
        const finalized = transactions.filter(t => t.status === 'finalized');
        const bonus = finalized.filter(t => t.type === 'bonus').reduce((sum, t) => sum + t.amount, 0);
        const penalty = finalized.filter(t => t.type === 'penalty').reduce((sum, t) => sum + t.amount, 0);
        const estimated = transactions.filter(t => t.status === 'estimated').reduce((sum, t) => sum + t.amount, 0);

        const decOrderCount = userOrders.length;
        const decOrderTotal = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        const commissionRate = payrollConfig?.commissionRate || 0.03;
        const totalCommission = decOrderTotal * commissionRate;

        return {
            bonus,
            penalty,
            estimated,
            totalCommission,
            total: bonus - penalty + totalCommission + (payrollConfig?.baseSalaryMonthly || 0),
            decOrderCount,
            decOrderTotal,
            commissionRate
        };
    }, [transactions, userOrders, payrollConfig]);

    const handleAddTransaction = async () => {
        if (!selectedUserId) return;

        try {
            await addFinancialTransaction({
                userId: selectedUserId,
                type: newTx.type,
                category: newTx.category,
                amount: newTx.amount,
                status: newTx.status,
                note: newTx.note
            }, session?.access_token);

            // Refresh
            const txs = await fetchUserTransactions(selectedUserId, session?.access_token);
            setTransactions(txs);
            setIsModalOpen(false);
            setNewTx({ ...newTx, note: '', amount: 50000 });
        } catch (err) {
            console.error("Failed to add transaction:", err);
            alert("Lỗi khi thêm giao dịch");
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: 'estimated' | 'finalized') => {
        // Need reference_id or id? My payrollStore.ts updateTransactionStatus uses referenceId.
        // Wait, referenceId is usually orderId. 
        // I should probably add updateTransactionById to payrollStore if I want to update manual ones easily.
        // For now, I'll just skip or do it via fetch.
        alert("Tính năng cập nhật trạng thái theo ID đang được phát triển.");
    };

    const handleOpenKpiConfig = async () => {
        if (!selectedUserId) return;
        setIsLoadingKpi(true);
        setIsKpiModalOpen(true);
        try {
            const [settings, metrics] = await Promise.all([
                fetchUserKpiSettings(selectedUserId, session?.access_token),
                fetchKpiMetrics()
            ]);
            setKpiSettings(settings);
            setKpiMetrics(metrics);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingKpi(false);
        }
    };

    const handleSaveKpiConfigs = async () => {
        if (!kpiSettings) return;
        setIsLoadingKpi(true);
        try {
            // Save user KPI settings (targets, salary, commission)
            const success = await updateUserKpiSettings(kpiSettings, session?.access_token);
            // Save salary weights to kpi_metric_definitions
            if (kpiMetrics.length > 0) {
                await updateKpiMetricsBatch(kpiMetrics);
            }
            if (success) {
                alert("Đã lưu cấu hình KPI thành công!");
                setIsKpiModalOpen(false);
            } else {
                alert("Lỗi khi lưu cấu hình.");
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi hệ thống.");
        } finally {
            setIsLoadingKpi(false);
        }
    };

    const getKpiTemplate = (role: string = 'telesales') => {
        return KPI_TEMPLATES[role] || KPI_TEMPLATES['telesales']; // Default to telesales for now
    };

    if (isLoading) return <div className="p-8">Đang tải dữ liệu nhân sự...</div>;

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6">
            {/* Sidebar: Staff List */}
            <div className="w-full lg:w-80 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-500" />
                        Đội ngũ Telesales
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm nhân viên..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredStaff.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => setSelectedUserId(user.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-1 ${selectedUserId === user.id
                                ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                                : 'hover:bg-slate-50 text-slate-600'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${selectedUserId === user.id ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {(user.name || "?").charAt(0)}
                            </div>
                            <div className="text-left">
                                <div className={`font-bold text-sm truncate w-40 ${selectedUserId === user.id ? 'text-primary-900' : 'text-slate-700'}`}>{user.name || "Chưa đặt tên"}</div>
                                <div className={`text-[10px] ${selectedUserId === user.id ? 'text-primary-600' : 'text-slate-400'}`}>{user.email}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content: Payroll Dashboard */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {selectedUserId ? (
                    <>
                        {/* Selected User Header & Stats */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 text-xl font-bold">
                                    {(staff.find(s => s.id === selectedUserId)?.name || "?").charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                            {staff.find(s => s.id === selectedUserId)?.name || "Chưa đặt tên"}
                                        </h1>
                                        {isMonthLocked(12) ? (
                                            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg flex items-center gap-1 uppercase tracking-wider border border-rose-100">
                                                <Lock className="w-3 h-3" />
                                                Đã khóa
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 bg-primary-50 text-primary-600 text-[10px] font-bold rounded-lg flex items-center gap-1 uppercase tracking-wider border border-primary-100">
                                                <ShieldCheck className="w-3 h-3" />
                                                Đang mở
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">{staff.find(s => s.id === selectedUserId)?.email}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {!isMonthLocked(12) && (
                                    <button
                                        onClick={() => handleLockMonth(12)}
                                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                                    >
                                        <Lock className="w-4 h-4" />
                                        Chốt lương
                                    </button>
                                )}
                                <button
                                    onClick={handleOpenKpiConfig}
                                    className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                >
                                    <Settings className="w-4 h-4" />
                                    Cấu hình KPI
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Thêm khoản chi
                                </button>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thưởng chốt</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900">{formatPrice(stats.bonus)}</div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phạt chốt</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900">{formatPrice(stats.penalty)}</div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ước tính (T12)</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900">{formatPrice(stats.estimated)}</div>
                            </div>
                            <div className="bg-primary-50 border border-primary-100 p-5 rounded-xl shadow-sm relative overflow-hidden group">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="p-2 bg-primary-600 rounded-lg text-white">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-primary-700 uppercase tracking-widest">Thực lĩnh</span>
                                </div>
                                <div className="text-2xl font-bold text-primary-900 tracking-tight">{formatPrice(stats.total)}</div>
                            </div>
                        </div>

                        {/* Lists Section */}
                        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            {viewMode === 'finance' ? (
                                <>
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-slate-400" />
                                            Lịch sử Giao dịch Tài chính
                                        </h3>
                                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                                            <Filter className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest z-10">
                                                <tr>
                                                    <th className="px-6 py-4">Ngày giao dịch</th>
                                                    <th className="px-6 py-4">Loại & Danh mục</th>
                                                    <th className="px-6 py-4">Ghi chú</th>
                                                    <th className="px-6 py-4 text-right">Số tiền</th>
                                                    <th className="px-6 py-4 text-center">Trạng thái</th>
                                                    <th className="px-6 py-4"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {transactions.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Chưa có giao dịch nào được ghi nhận.</td>
                                                    </tr>
                                                ) : (
                                                    transactions.map((t) => (
                                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                                {new Date(t.createdAt).toLocaleDateString('vi-VN', {
                                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className={`text-[10px] font-black uppercase mb-0.5 ${t.type === 'penalty' ? 'text-red-500' : 'text-green-600'}`}>
                                                                    {t.type === 'penalty' ? 'Khấu trừ' : 'Thưởng'}
                                                                </div>
                                                                <div className="font-bold text-slate-900">{t.category}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-slate-500 text-xs italic">
                                                                {t.note || '-'}
                                                            </td>
                                                            <td className={`px-6 py-4 text-right font-black ${t.type === 'penalty' ? 'text-red-500' : 'text-slate-900'}`}>
                                                                {t.type === 'penalty' ? '-' : '+'}{formatPrice(t.amount)}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t.status === 'finalized'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                                    }`}>
                                                                    {t.status === 'finalized' ? 'Đã chốt' : 'Dự kiến'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button className="p-2 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreVertical className="w-4 h-4 text-slate-400" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <Package className="w-5 h-5 text-slate-400" />
                                            Danh sách Đơn hàng Tháng 12
                                        </h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest z-10">
                                                <tr>
                                                    <th className="px-6 py-4">Ngày tạo</th>
                                                    <th className="px-6 py-4">Khách hàng</th>
                                                    <th className="px-6 py-4">Nguồn</th>
                                                    <th className="px-6 py-4 text-right">Giá trị</th>
                                                    <th className="px-6 py-4 text-center">Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {userOrders.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Chưa có đơn hàng nào trong tháng 12.</td>
                                                    </tr>
                                                ) : (
                                                    userOrders.map((o: Order) => (
                                                        <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                                {new Date(o.createdAt).toLocaleDateString('vi-VN', {
                                                                    day: '2-digit', month: '2-digit', year: 'numeric'
                                                                })}
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                                {o.customerName}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-[10px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                                                    {o.source}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-black text-slate-900">
                                                                {formatPrice(o.totalAmount || 0)}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {o.status === 'delivered' ? 'Thành công' : 'Đang xử lý'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
                        <UserIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p className="font-medium">Vui lòng chọn nhân viên để xem chi tiết bảng lương</p>
                    </div>
                )}
            </div>

            {/* Modal: KPI Configuration */}
            {isKpiModalOpen && kpiSettings && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-primary-600" />
                                    Cấu hình Lương & KPI
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Thiết lập chỉ tiêu cho nhân sự {staff.find(s => s.id === selectedUserId)?.name}</p>
                            </div>
                            <button onClick={() => setIsKpiModalOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {isLoadingKpi ? (
                                <div className="text-center py-12 text-slate-400">Đang tải dữ liệu...</div>
                            ) : (
                                <>
                                    {/* Section 1: Base Salary & Commission */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-primary-500 pl-3">
                                            1. Cơ chế Lương & Thưởng
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Lương cứng (VNĐ/Tháng)</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="number"
                                                        className="w-full pl-9 pr-4 py-2 rounded-lg border-slate-200 text-sm font-bold focus:ring-primary-500 focus:border-primary-500"
                                                        value={kpiSettings.base_salary_monthly || 0}
                                                        onChange={(e) => setKpiSettings({ ...kpiSettings, base_salary_monthly: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 italic">Mức lương cứng riêng cho nhân sự này.</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Hoa hồng (% Doanh thu)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full pl-9 pr-4 py-2 rounded-lg border-slate-200 text-sm font-bold focus:ring-primary-500 focus:border-primary-500"
                                                        value={(kpiSettings.commission_rate || 0) * 100}
                                                        onChange={(e) => setKpiSettings({ ...kpiSettings, commission_rate: parseFloat(e.target.value) / 100 })}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 italic">VD: Nhập 3 là 3%.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: KPI Targets + Salary Weights */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-rose-500 pl-3">
                                            2. Chỉ tiêu KPI & Trọng số Lương
                                        </h3>
                                        {(() => {
                                            const activeMetrics = kpiMetrics.filter(m => m.is_active);
                                            const totalSalary = activeMetrics.reduce((s, m) => s + (m.salary_percent || 0), 0);
                                            return (
                                                <>
                                                    {totalSalary !== 100 && (
                                                        <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-bold ${totalSalary > 100 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                            ⚠️ Tổng trọng số: {totalSalary}% (cần = 100%)
                                                        </div>
                                                    )}
                                                    {totalSalary === 100 && (
                                                        <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                                            ✅ Tổng trọng số: 100%
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                        <div className="space-y-3">
                                            {(kpiMetrics.length > 0 ? kpiMetrics.filter(m => m.is_active) : getKpiTemplate(staff.find(s => s.id === selectedUserId)?.role).fields.map(f => ({
                                                id: f.key, key: f.key, label: f.label, description: f.description || '', data_source: 'manual' as const,
                                                icon: 'Target', field_type: f.type, is_active: true, sort_order: 0, salary_percent: 0, monthly_target: 0
                                            }))).map((metric) => {
                                                const metricDef = metric as KpiMetricDefinition;
                                                return (
                                                    <div key={metricDef.key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-primary-200 transition-colors">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="text-xs font-bold text-slate-700">{metricDef.label}</label>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${metricDef.data_source === 'auto' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                {metricDef.data_source === 'auto' ? '🤖 Tự động' : '📝 Nhập tay'}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-semibold block mb-1">Target /tháng</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                                    value={kpiSettings.kpi_targets?.[metricDef.key] || 0}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value) || 0;
                                                                        setKpiSettings({
                                                                            ...kpiSettings,
                                                                            kpi_targets: {
                                                                                ...kpiSettings.kpi_targets,
                                                                                [metricDef.key]: val
                                                                            }
                                                                        });
                                                                    }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-semibold block mb-1">% Lương</span>
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full py-2 px-3 bg-primary-50 border border-primary-200 rounded-lg text-sm font-black text-primary-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                                        value={metricDef.salary_percent || 0}
                                                                        onChange={(e) => {
                                                                            const val = parseFloat(e.target.value) || 0;
                                                                            setKpiMetrics(prev => prev.map(m =>
                                                                                m.id === metricDef.id ? { ...m, salary_percent: val } : m
                                                                            ));
                                                                        }}
                                                                    />
                                                                    <span className="text-xs font-bold text-primary-500">%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {metricDef.description && (
                                                            <p className="text-[10px] text-slate-400 mt-2 leading-snug">{metricDef.description}</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsKpiModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSaveKpiConfigs}
                                disabled={isLoadingKpi}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary-600 text-white shadow-lg shadow-primary-200 hover:bg-primary-700 hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoadingKpi ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                                Lưu cấu hình
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal: Add Transaction */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-900">Ghi nhận Thưởng/Phạt</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
                                <button
                                    onClick={() => setNewTx({ ...newTx, type: 'bonus' })}
                                    className={`py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${newTx.type === 'bonus' ? 'bg-white shadow text-green-600' : 'text-slate-500 hover:bg-white/50'}`}
                                >
                                    Thưởng
                                </button>
                                <button
                                    onClick={() => setNewTx({ ...newTx, type: 'penalty' })}
                                    className={`py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${newTx.type === 'penalty' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:bg-white/50'}`}
                                >
                                    Phạt
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Danh mục</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500"
                                    value={newTx.category}
                                    onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                                >
                                    {newTx.type === 'bonus' ? (
                                        <>
                                            <option>Thưởng Sáng kiến</option>
                                            <option>Thưởng Chốt NPP</option>
                                            <option>Thưởng Chốt Đại lý</option>
                                            <option>Thưởng Lễ/Tết</option>
                                            <option>Thưởng Chuyên cần</option>
                                            <option>Khác</option>
                                        </>
                                    ) : (
                                        <>
                                            <option>Phạt Đi muộn</option>
                                            <option>Phạt Vi phạm Trang phục</option>
                                            <option>Phạt Nghỉ không phép</option>
                                            <option>Phạt Thái độ phục vụ</option>
                                            <option>Khác</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Số tiền (VNĐ)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-lg font-black focus:ring-2 focus:ring-primary-500 text-primary-600"
                                    value={newTx.amount}
                                    onChange={(e) => setNewTx({ ...newTx, amount: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ghi chú chi tiết</label>
                                <textarea
                                    rows={3}
                                    placeholder="Lý do cụ thể..."
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                    value={newTx.note}
                                    onChange={(e) => setNewTx({ ...newTx, note: e.target.value })}
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleAddTransaction}
                                    className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary-100 hover:bg-primary-500 transition-all active:scale-[0.98]"
                                >
                                    Xác nhận ghi nhận
                                </button>
                                <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed px-4">
                                    Mọi giao dịch sau khi xác nhận sẽ được hiển thị ngay lập tức lên Dashboard của nhân viên.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
