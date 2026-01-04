"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchOrders, Order } from "@/lib/ordersStore";
import { fetchExpenses, Expense } from "@/lib/expensesStore";
import {
    DollarSign, TrendingUp, TrendingDown,
    CreditCard, Loader2, Wallet, ArrowUpRight, ArrowDownRight,
    Calendar, RefreshCcw, BarChart3, PieChart as PieChartIcon,
    ArrowRight
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar,
    Cell, PieChart, Pie
} from "recharts";

export default function AccountantDashboard() {
    const { session } = useAuth();
    const [revenue, setRevenue] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [orders, setOrders] = useState<Order[]>([]);
    const [expenseList, setExpenseList] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const loadStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const [ordersData, expData] = await Promise.all([
                fetchOrders(session?.access_token),
                fetchExpenses(session?.access_token)
            ]);

            setOrders(ordersData);
            setExpenseList(expData);

            // Revenue calculation: Only delivered orders for accuracy
            const totalRev = ordersData
                .filter(o => o.status === 'delivered')
                .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            // Expenses calculation
            const totalExp = expData.reduce((sum, e) => sum + e.amount, 0);

            setRevenue(totalRev);
            setExpenses(totalExp);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Dashboard load error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    // Chart Data Preparation (Last 7 days)
    const chartData = useMemo(() => {
        const result: any[] = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

            const dayRev = orders
                .filter(o => o.status === 'delivered' && new Date(o.createdAt).toDateString() === d.toDateString())
                .reduce((sum, o) => sum + o.totalAmount, 0);

            const dayExp = expenseList
                .filter(e => new Date(e.spent_at).toDateString() === d.toDateString())
                .reduce((sum, e) => sum + e.amount, 0);

            result.push({
                name: dateStr,
                "Doanh thu": dayRev,
                "Chi phí": dayExp,
                "Lợi nhuận": dayRev - dayExp
            });
        }
        return result;
    }, [orders, expenseList]);

    const expenseByCategory = useMemo(() => {
        const cats: Record<string, number> = {};
        expenseList.forEach(e => {
            cats[e.category] = (cats[e.category] || 0) + e.amount;
        });
        return Object.entries(cats).map(([name, value]) => ({ name, value }));
    }, [expenseList]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const stats = [
        {
            label: "Doanh thu thực tế",
            value: revenue,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            sub: "Dựa trên đơn đã giao"
        },
        {
            label: "Tổng chi phí vận hành",
            value: expenses,
            icon: TrendingDown,
            color: "text-red-600",
            bg: "bg-red-50",
            sub: "Điện, nước, thuê kho..."
        },
        {
            label: "Lợi nhuận ước tính",
            value: revenue - expenses,
            icon: DollarSign,
            color: "text-blue-600",
            bg: "bg-blue-50",
            sub: "Sau khi khấu trừ chi phí"
        },
        {
            label: "Công nợ phải thu",
            value: 0,
            icon: CreditCard,
            color: "text-orange-600",
            bg: "bg-orange-50",
            sub: "Khách hàng B2B"
        },
    ];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Accountant Dashboard</h1>
                    <p className="text-slate-500 mt-2">Tổng quan tình hình tài chính doanh nghiệp</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50" onClick={loadStats}>
                    <RefreshCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Cập nhật: {lastUpdated.toLocaleTimeString()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-primary-200 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${stat.bg} ${stat.color}`}>
                                +12.5%
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">
                                {isLoading ? (
                                    <div className="h-8 w-32 bg-slate-50 animate-pulse rounded" />
                                ) : (
                                    formatCurrency(stat.value)
                                )}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-wider">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Flow Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[450px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-emerald-500" />
                            Kết quả kinh doanh (7 ngày qua)
                        </h3>
                    </div>
                    <div className="h-[350px] w-full">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-slate-300 italic">Đang tải biểu đồ...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        tickFormatter={(val) => `${val / 1000000}M`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(val: number) => formatCurrency(val)}
                                    />
                                    <Area type="monotone" dataKey="Doanh thu" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                    <Line type="monotone" dataKey="Chi phí" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Right Column: Mini Charts & Alerts */}
                <div className="space-y-6">
                    {/* Expense Pie Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4 text-violet-500" />
                            Cấu trúc chi phí
                        </h3>
                        <div className="h-[200px] w-full">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center">...</div>
                            ) : expenseList.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">Chưa có chi phí</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseByCategory}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {expenseByCategory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="mt-4 space-y-2">
                            {expenseByCategory.slice(0, 3).map((cat, i) => (
                                <div key={i} className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        {cat.name}
                                    </div>
                                    <span className="font-bold text-slate-700">{formatCurrency(cat.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats/Links */}
                    <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white">
                        <Wallet className="w-8 h-8 opacity-50 mb-4" />
                        <h4 className="text-sm font-medium opacity-80">Lợi nhuận gộp</h4>
                        <div className="text-3xl font-bold mt-1">
                            {isLoading ? "..." : formatCurrency(revenue - expenses)}
                        </div>
                        <div className="mt-6 flex flex-col gap-2">
                            <a href="/accountant/revenue" className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                                <span className="text-xs">Đối soát doanh thu</span>
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </a>
                            <a href="/accountant/expenses" className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                                <span className="text-xs">Phê duyệt chi phí</span>
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
