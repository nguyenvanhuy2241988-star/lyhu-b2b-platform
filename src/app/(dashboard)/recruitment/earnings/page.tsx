"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, ChevronDown, Download, Target, Award, Receipt, Info, Users, CalendarCheck, UserCheck, Clock, Percent } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    FinancialTransaction,
    fetchUserTransactions
} from "@/lib/payrollStore";
import { supabase, getRealtimeClient } from "@/lib/supabaseClient";
import { KPI_TEMPLATES, formatKpiValue } from "@/lib/kpi_config";
import { KpiSalaryResult, calculateKpiSalary, calculateKpiSalaryForRange } from "@/lib/kpiSalaryStore";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

type DateRangeOption = 'today' | 'this_week' | 'this_month';

export default function RecruiterEarningsPage() {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [kpiSettings, setKpiSettings] = useState<any>(null);
    const [kpiSalary, setKpiSalary] = useState<KpiSalaryResult | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [baseSalaryMonthly, setBaseSalaryMonthly] = useState(0);
    const [dateRange, setDateRange] = useState<DateRangeOption>('this_month');

    const { user, session } = useAuth();

    const loadData = useCallback(async () => {
        if (!user || !session?.access_token) return;
        setIsLoading(true);
        try {
            const startOfMonth = new Date(selectedYear, selectedMonth, 1);
            const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

            const [txRes, kpiRes] = await Promise.all([
                fetchUserTransactions(user.id, session.access_token, {
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfMonth.toISOString()
                }),
                supabase.rpc('get_user_kpi_settings', { p_user_id: user.id }),
            ]);

            setTransactions(txRes);
            if (kpiRes.data) setKpiSettings(kpiRes.data);

            const baseSalary = kpiRes.data?.base_salary_monthly || 0;
            setBaseSalaryMonthly(baseSalary);
            const salaryResult = await calculateKpiSalary(user.id, selectedMonth + 1, selectedYear, baseSalary, 'recruiter');
            setKpiSalary(salaryResult);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("loadData error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user, session?.access_token, selectedMonth, selectedYear]);

    // Recalculate KPI salary when dateRange changes (day/week/month scaling)
    useEffect(() => {
        if (!user || baseSalaryMonthly <= 0) return;

        if (dateRange === 'this_month') {
            const recalc = async () => {
                const result = await calculateKpiSalary(user.id, selectedMonth + 1, selectedYear, baseSalaryMonthly, 'recruiter');
                setKpiSalary(result);
            };
            recalc();
        } else {
            const divisor = dateRange === 'today' ? 26 : 4;
            const now = new Date();
            let rangeStart: Date, rangeEnd: Date;

            if (dateRange === 'today') {
                rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            } else {
                const dayOfWeek = now.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                rangeStart = new Date(now);
                rangeStart.setDate(now.getDate() + mondayOffset);
                rangeStart.setHours(0, 0, 0, 0);
                rangeEnd = new Date(rangeStart);
                rangeEnd.setDate(rangeStart.getDate() + 6);
                rangeEnd.setHours(23, 59, 59, 999);
            }

            const recalc = async () => {
                const result = await calculateKpiSalaryForRange(
                    user.id, rangeStart, rangeEnd, baseSalaryMonthly, divisor, 'recruiter'
                );
                setKpiSalary(result);
            };
            recalc();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    useEffect(() => {
        if (user && session?.access_token) loadData();
        else setIsLoading(false);
    }, [user, session?.access_token, loadData]);

    // Realtime
    useEffect(() => {
        if (!user || !session?.access_token) return;
        const rt = getRealtimeClient();
        const channel = rt
            .channel('recruiter-earnings-rt')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions', filter: `user_id=eq.${user.id}` }, () => loadData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_kpi_settings', filter: `user_id=eq.${user.id}` }, () => loadData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_metric_definitions' }, () => loadData())
            .subscribe();
        return () => { rt.removeChannel(channel); };
    }, [user, session?.access_token, loadData]);

    // Month navigation
    const goToPrevMonth = () => {
        if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
        else setSelectedMonth(m => m - 1);
        setDateRange('this_month');
    };
    const goToNextMonth = () => {
        const now = new Date();
        if (selectedYear === now.getFullYear() && selectedMonth >= now.getMonth()) return;
        if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
        else setSelectedMonth(m => m + 1);
        setDateRange('this_month');
    };
    const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    const getDateRangeText = () => {
        switch (dateRange) {
            case 'today': return "Hôm nay";
            case 'this_week': return "Tuần này";
            case 'this_month': return `${monthNames[selectedMonth]}, ${selectedYear}`;
            default: return "";
        }
    };
    const rangeLabel = getDateRangeText();

    // Date range for filtering transactions
    const currentRange = useMemo(() => {
        const now = new Date();
        switch (dateRange) {
            case 'today':
                return {
                    from: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
                    to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
                };
            case 'this_week': {
                const dayOfWeek = now.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const rangeFrom = new Date(now);
                rangeFrom.setDate(now.getDate() + mondayOffset);
                rangeFrom.setHours(0, 0, 0, 0);
                const rangeTo = new Date(rangeFrom);
                rangeTo.setDate(rangeFrom.getDate() + 6);
                rangeTo.setHours(23, 59, 59, 999);
                return { from: rangeFrom, to: rangeTo };
            }
            case 'this_month':
            default:
                return {
                    from: new Date(selectedYear, selectedMonth, 1),
                    to: new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999)
                };
        }
    }, [dateRange, selectedMonth, selectedYear]);

    // Financial
    const payrollMetrics = useMemo(() => {
        const rangeFiltered = transactions.filter(t => {
            const d = new Date(t.createdAt);
            return d >= currentRange.from && d <= currentRange.to;
        });
        const bonusTotal = rangeFiltered.filter(t => t.type === 'bonus' && t.status === 'finalized').reduce((s, t) => s + t.amount, 0);
        const penaltyTotal = rangeFiltered.filter(t => t.type === 'penalty' && t.status === 'finalized').reduce((s, t) => s + t.amount, 0);
        const estimatedBonuses = rangeFiltered.filter(t => t.type === 'bonus' && t.status === 'estimated').reduce((s, t) => s + t.amount, 0);
        const kpiBasedSalary = kpiSalary?.totalKpiSalary ?? baseSalaryMonthly;
        const totalNetSalary = kpiBasedSalary + bonusTotal - penaltyTotal;
        return { bonusTotal, penaltyTotal, estimatedBonuses, totalNetSalary };
    }, [transactions, kpiSalary, baseSalaryMonthly, currentRange]);

    // Get KPI icon
    const getKpiIcon = (key: string) => {
        switch (key) {
            case 'kpi_candidates_sourced': return <Users className="w-4 h-4 text-blue-500" />;
            case 'kpi_interviews_scheduled': return <CalendarCheck className="w-4 h-4 text-purple-500" />;
            case 'kpi_hires_closed': return <UserCheck className="w-4 h-4 text-emerald-500" />;
            case 'kpi_offer_acceptance_rate': return <Percent className="w-4 h-4 text-amber-500" />;
            case 'kpi_time_to_fill': return <Clock className="w-4 h-4 text-slate-500" />;
            default: return <Target className="w-4 h-4 text-slate-400" />;
        }
    };

    // CSV Export
    const handleExportCsv = () => {
        if (!kpiSalary || kpiSalary.items.length === 0) {
            alert("Không có dữ liệu để xuất.");
            return;
        }
        const headers = ["Chỉ tiêu", "Thực hiện", "Mục tiêu", "Hoàn thành (%)", "Trọng số (%)", "Lương (VNĐ)"];
        const rows = kpiSalary.items.map(item => [
            item.label, item.actual, item.target, `${item.completionPercent.toFixed(1)}%`, `${item.salaryPercent}%`, item.salaryAmount
        ]);
        const csvContent = [
            "BÁO CÁO THU NHẬP & KPI - TUYỂN DỤNG",
            `Kỳ: ${rangeLabel}`,
            `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`,
            "", headers.join(","), ...rows.map(r => r.join(","))
        ].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `recruiter_kpi_${selectedMonth + 1}_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <div className="p-6">Đang tải báo cáo...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-xl font-bold text-slate-900">Thu nhập & KPI</h1>
                <div className="flex items-center gap-2">
                    {/* Month Navigator */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <button onClick={goToPrevMonth} className="px-2 py-2 hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600">
                            <ChevronDown className="w-4 h-4 rotate-90" />
                        </button>
                        <button
                            onClick={() => {
                                const input = document.getElementById('hr-earnings-month-picker') as HTMLInputElement;
                                if (input) input.showPicker();
                            }}
                            className={`px-3 py-2 text-sm font-medium transition-colors min-w-[140px] text-center relative ${isCurrentMonth ? 'text-primary-600' : 'text-slate-700 hover:text-primary-600'}`}
                        >
                            <Calendar className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                            {rangeLabel}
                            <input
                                id="hr-earnings-month-picker"
                                type="month"
                                value={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`}
                                onChange={(e) => {
                                    const [y, m] = e.target.value.split('-').map(Number);
                                    if (y && m) {
                                        setSelectedYear(y);
                                        setSelectedMonth(m - 1);
                                        setDateRange('this_month');
                                    }
                                }}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                style={{ pointerEvents: 'none' }}
                            />
                        </button>
                        <button onClick={goToNextMonth}
                            className={`px-2 py-2 transition-colors ${isCurrentMonth ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            disabled={isCurrentMonth}>
                            <ChevronDown className="w-4 h-4 -rotate-90" />
                        </button>
                    </div>
                    {/* Quick Filters: Ngày / Tuần / Tháng */}
                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        <button
                            onClick={() => setDateRange('today')}
                            className={`px-2.5 py-1.5 text-[11px] font-medium rounded transition-colors ${dateRange === 'today' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Ngày
                        </button>
                        <button
                            onClick={() => setDateRange('this_week')}
                            className={`px-2.5 py-1.5 text-[11px] font-medium rounded transition-colors ${dateRange === 'this_week' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tuần
                        </button>
                        <button
                            onClick={() => setDateRange('this_month')}
                            className={`px-2.5 py-1.5 text-[11px] font-medium rounded transition-colors ${dateRange === 'this_month' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tháng
                        </button>
                    </div>
                    <button onClick={handleExportCsv}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <Download className="w-4 h-4 text-slate-400" /> Xuất
                    </button>
                </div>
            </div>

            {/* KPI Progress Cards */}
            {kpiSalary && kpiSalary.items.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {kpiSalary.items.map((item) => {
                        const pct = Math.min(item.completionPercent, 100);
                        let barColor = "bg-primary-500";
                        let badgeClass = "text-primary-600 bg-primary-50";
                        if (pct >= 100) { barColor = "bg-emerald-500"; badgeClass = "text-emerald-700 bg-emerald-50"; }
                        else if (pct >= 80) { barColor = "bg-emerald-500"; badgeClass = "text-emerald-600 bg-emerald-50"; }
                        else if (pct < 50) { barColor = "bg-rose-400"; badgeClass = "text-rose-600 bg-rose-50"; }
                        else { barColor = "bg-amber-400"; badgeClass = "text-amber-600 bg-amber-50"; }

                        return (
                            <div key={item.key} className="bg-white p-4 rounded-lg border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        {getKpiIcon(item.key)}
                                        <span className="text-xs font-medium text-slate-500">{item.label}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>
                                        {item.completionPercent.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-lg font-bold text-slate-900">{formatKpiValue(item.actual, item.field_type as any)}</span>
                                    <span className="text-xs text-slate-400">/ {formatKpiValue(item.target, item.field_type as any)}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <Target className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-600">Chưa có chỉ tiêu KPI nào được cấu hình</p>
                    <p className="text-xs text-slate-400 mt-1">Admin có thể thiết lập KPI tuyển dụng từ trang <strong>Lương & Thưởng</strong></p>
                </div>
            )}

            {/* Payroll Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Salary Summary */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-primary-500" />
                                Chi tiết Bảng lương {rangeLabel}
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] text-slate-400">
                                    {lastUpdated ? (
                                        <>{lastUpdated.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} lúc {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>
                                    ) : 'Chưa cập nhật'}
                                </span>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="space-y-4">
                                {/* KPI-Based Salary Breakdown */}
                                {kpiSalary && kpiSalary.items.length > 0 ? (
                                    <div>
                                        <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-200">
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">
                                                    {dateRange === 'today' ? 'Lương ngày hôm nay' : dateRange === 'this_week' ? 'Lương tuần này' : 'Lương theo KPI'}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    {dateRange === 'today' ? `Lương cơ bản ngày: ${formatPrice(kpiSalary.baseSalary)} (${formatPrice(baseSalaryMonthly)}/tháng ÷26)` :
                                                        dateRange === 'this_week' ? `Lương cơ bản tuần: ${formatPrice(kpiSalary.baseSalary)} (${formatPrice(baseSalaryMonthly)}/tháng ÷4)` :
                                                            `Lương cơ bản: ${formatPrice(kpiSalary.baseSalary)}`}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-base font-bold text-primary-600">{formatPrice(kpiSalary.totalKpiSalary)}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {kpiSalary.items.map(item => {
                                                const pct = Math.min(item.completionPercent, 100);
                                                const barColor = pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
                                                const badgeClass = pct >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : pct >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200';
                                                return (
                                                    <div key={item.key} className="bg-slate-50 rounded-lg p-3">
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <div className="flex items-center gap-2">
                                                                {getKpiIcon(item.key)}
                                                                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badgeClass}`}>
                                                                    {item.completionPercent.toFixed(0)}%
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-slate-400">×{item.salaryPercent}%</span>
                                                                <span className="text-sm font-bold text-slate-900">{formatPrice(item.salaryAmount)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs text-slate-500">
                                                                {formatKpiValue(item.actual, item.field_type as any)} / {formatKpiValue(item.target, item.field_type as any)}
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                                        <span className="text-sm text-slate-600">Lương cố định tháng</span>
                                        <span className="text-sm font-bold text-slate-900">{formatPrice(baseSalaryMonthly)}</span>
                                    </div>
                                )}

                                {/* Summary Items */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                        <div className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide mb-1">Thưởng</div>
                                        <div className="text-sm font-bold text-emerald-700">+{formatPrice(payrollMetrics.bonusTotal)}</div>
                                    </div>
                                    <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                                        <div className="text-[10px] font-medium text-rose-600 uppercase tracking-wide mb-1">Phạt</div>
                                        <div className="text-sm font-bold text-rose-700">-{formatPrice(payrollMetrics.penaltyTotal)}</div>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 flex justify-between items-center">
                                    <div>
                                        <div className="text-xs font-semibold text-primary-700 uppercase tracking-wide">
                                            {dateRange === 'today' ? 'Thu nhập hôm nay' : dateRange === 'this_week' ? 'Thu nhập tuần này' : 'Tổng thu nhập'}
                                        </div>
                                        <div className="text-[10px] text-primary-500 mt-0.5">
                                            {dateRange === 'today' ? 'Ước tính thu nhập ngày hôm nay' : dateRange === 'this_week' ? 'Ước tính thu nhập tuần này' : 'Ước tính thực nhận tháng này'}
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-primary-700">{formatPrice(payrollMetrics.totalNetSalary)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-800">Biến động số dư mới nhất</h4>
                            <Award className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="max-h-[280px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100">
                                        <th className="p-3 font-medium">Thời gian</th>
                                        <th className="p-3 font-medium">Nội dung</th>
                                        <th className="p-3 font-medium text-right">Số tiền</th>
                                        <th className="p-3 font-medium text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-6 text-center text-slate-400 text-sm">Chưa có biến động tài chính.</td>
                                        </tr>
                                    ) : (
                                        transactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-3 text-slate-400">
                                                    {new Date(t.createdAt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                                    <div className="text-[9px] text-slate-300 mt-0.5">{new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium text-slate-700">{t.category}</div>
                                                    {t.note && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t.note}</div>}
                                                </td>
                                                <td className={`p-3 text-right font-medium ${t.type === 'penalty' ? 'text-red-500' : 'text-primary-600'}`}>
                                                    {t.type === 'penalty' ? '-' : '+'}{formatPrice(t.amount)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${t.status === 'finalized' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        {t.status === 'finalized' ? 'Đã chốt' : 'Dự kiến'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Area */}
                <div className="space-y-4">
                    {/* Pending Bonuses Card */}
                    <div className="bg-primary-50 border border-primary-100 rounded-lg p-5">
                        <h4 className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">Đang chờ xử lý</h4>
                        <div className="text-2xl font-bold text-primary-700 mb-1">{formatPrice(payrollMetrics.estimatedBonuses)}</div>
                        <p className="text-xs text-primary-600/70 leading-relaxed">
                            Tổng thưởng dự kiến đang chờ admin xác nhận.
                        </p>
                    </div>

                    {/* Quick Rules Link */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <h4 className="font-semibold text-slate-800 text-sm mb-2">Chính sách Lương Thưởng</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                            Tìm hiểu chi tiết về các chỉ tiêu KPI tuyển dụng, thưởng hoàn thành và quy định xử phạt.
                        </p>
                        <a
                            href="/recruitment/rules"
                            className="block w-full py-2 bg-slate-800 text-white text-center rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
                        >
                            Xem Quy định Chi tiết
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
