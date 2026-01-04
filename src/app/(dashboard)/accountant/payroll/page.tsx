"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    fetchUsers, User
} from "@/lib/usersStore";
import {
    fetchUserTransactions, fetchPayrollConfig, FinancialTransaction, PayrollConfig,
    fetchPayrollLocks, setPayrollLock, PayrollLock
} from "@/lib/payrollStore";
import {
    DollarSign, Search, Filter, Loader2,
    CheckCircle2, AlertCircle, Download,
    Users, Wallet, Calculator, Calendar,
    ChevronLeft, ChevronRight, Lock
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import { exportPayrollToMISA } from "@/lib/misaExportStore";

interface UserEarning {
    user: User;
    baseSalary: number;
    commissions: number;
    bonuses: number;
    penalties: number;
    total: number;
    isLocked: boolean;
}

export default function AccountantPayrollPage() {
    const { user: currentUser, session } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [earnings, setEarnings] = useState<UserEarning[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Month/Year Filtering
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [locks, setLocks] = useState<PayrollLock[]>([]);

    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [allUsers, yearLocks] = await Promise.all([
                fetchUsers(session?.access_token),
                fetchPayrollLocks(year, session?.access_token)
            ]);

            setUsers(allUsers);
            setLocks(yearLocks);

            // Filter users who eligible for payroll (Sales, Telesales, CTV)
            const eligibleUsers = allUsers.filter(u =>
                [ROLES.SALES, ROLES.TELESALES, ROLES.CTV].includes(u.role as any)
            );

            // Fetch transactions and configs for each user
            const earningsData = await Promise.all(eligibleUsers.map(async (u) => {
                const [transactions, config] = await Promise.all([
                    fetchUserTransactions(u.id, session?.access_token),
                    fetchPayrollConfig(u.role, session?.access_token)
                ]);

                // Filter transactions by selected month/year
                const monthlyTx = transactions.filter(t => {
                    const d = new Date(t.createdAt);
                    return d.getMonth() + 1 === month && d.getFullYear() === year;
                });

                const commissions = monthlyTx.filter(t => t.type === 'commission').reduce((sum, t) => sum + t.amount, 0);
                const bonuses = monthlyTx.filter(t => t.type === 'bonus').reduce((sum, t) => sum + t.amount, 0);
                const penalties = monthlyTx.filter(t => t.type === 'penalty').reduce((sum, t) => sum + t.amount, 0);
                const baseSalary = config?.baseSalaryMonthly || 0;

                return {
                    user: u,
                    baseSalary,
                    commissions,
                    bonuses,
                    penalties,
                    total: baseSalary + commissions + bonuses - penalties,
                    isLocked: yearLocks.some(l => l.month === month && l.year === year)
                };
            }));

            setEarnings(earningsData);
        } catch (err) {
            console.error("Load Payroll error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [session, month, year]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredEarnings = useMemo(() => {
        return earnings.filter(e =>
            e.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [earnings, searchQuery]);

    const handlePrevMonth = () => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() - 1);
        setSelectedDate(d);
    };

    const handleNextMonth = () => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() + 1);
        setSelectedDate(d);
    };

    const handleLockPayroll = async () => {
        if (!currentUser) return;
        if (!confirm(`Bạn có chắc muốn chốt sổ lương tháng ${month}/${year}? Sau khi chốt sẽ không thể chỉnh sửa.`)) return;

        const success = await setPayrollLock(year, month, currentUser.id, session?.access_token);
        if (success) {
            alert("Đã chốt sổ lương thành công!");
            loadData();
        } else {
            alert("Lỗi khi chốt sổ lương.");
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const exportMisa = () => {
        exportPayrollToMISA(earnings, month, year);
    };

    const isCurrentMonthLocked = locks.some(l => l.month === month && l.year === year);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tính Lương & Hoa hồng</h1>
                    <p className="text-sm text-slate-600 mt-1">Quản lý thu nhập nhân viên và CTV</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-50 rounded-md">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-4 text-sm font-bold text-slate-700 min-w-[120px] text-center">
                            Tháng {month} / {year}
                        </div>
                        <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-50 rounded-md">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={exportMisa}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Xuất MISA
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Tổng quỹ lương & hoa hồng</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(earnings.reduce((sum, e) => sum + e.total, 0))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Số nhân sự & CTV</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{earnings.length}</div>
                    {isCurrentMonthLocked && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            <Lock className="w-3 h-3" /> CHỐT SỔ
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-center">
                    {!isCurrentMonthLocked ? (
                        <button
                            onClick={handleLockPayroll}
                            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                            <Lock className="w-5 h-5" />
                            Chốt sổ lương Tháng {month}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-6 py-3 rounded-xl border border-emerald-100">
                            <CheckCircle2 className="w-5 h-5" />
                            Đã chốt sổ lương
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm nhân viên, CTV..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex-1" />
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-sm text-slate-500 mt-2">Đang tính toán lương...</p>
                    </div>
                ) : filteredEarnings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Wallet className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-slate-500">Không có dữ liệu thu nhập phù hợp.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Nhân sự</th>
                                    <th className="px-6 py-4">Vai trò</th>
                                    <th className="px-6 py-4">Lương cứng</th>
                                    <th className="px-6 py-4">Hoa hồng</th>
                                    <th className="px-6 py-4">Thưởng / Phạt</th>
                                    <th className="px-6 py-4 font-bold text-slate-900">Thực nhận</th>
                                    <th className="px-6 py-4 text-right">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEarnings.map((e) => (
                                    <tr key={e.user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{e.user.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{e.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                                                {e.user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {formatCurrency(e.baseSalary)}
                                        </td>
                                        <td className="px-6 py-4 text-emerald-600 font-bold">
                                            +{formatCurrency(e.commissions)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                {e.bonuses > 0 && (
                                                    <span className="text-blue-600 text-[11px] font-bold">+{formatCurrency(e.bonuses)}</span>
                                                )}
                                                {e.penalties > 0 && (
                                                    <span className="text-red-500 text-[11px] font-bold">-{formatCurrency(e.penalties)}</span>
                                                )}
                                                {e.bonuses === 0 && e.penalties === 0 && (
                                                    <span className="text-slate-300 italic">--</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 bg-slate-50/50">
                                            <div className="font-extrabold text-blue-700 text-base">
                                                {formatCurrency(e.total)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary-600 hover:underline font-medium text-xs">
                                                Xem bảng kê
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
