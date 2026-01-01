'use client';

import { useState, useEffect } from 'react';
import { Globe, ShoppingCart, TrendingUp, DollarSign, MessageCircle } from "lucide-react";
import { createClient } from '@/lib/supabaseClient';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function EcommerceDashboard() {
    const [stats, setStats] = useState({
        shopee: 0,
        tiktok: 0,
        web: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    // Mock data for chart (Since we don't have enough real data seeded)
    const chartData = [
        { name: 'Shopee', revenue: 15000000 },
        { name: 'TikTok', revenue: 8500000 },
        { name: 'Web', revenue: 4200000 },
        { name: 'Facebook', revenue: 6800000 },
    ];

    const COLORS = ['#ea580c', '#000000', '#7c3aed', '#2563eb'];

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        // In a real scenario, we would aggregate data from DB.
        // For now, I'll simulate or fetch count if possible.
        // Creating some mock numbers based on DB query for 'orders' could be complex without data.
        // I will stick to mock + whatever real check we can do.
        setStats({
            shopee: 24,
            tiktok: 15,
            web: 8,
            totalRevenue: 34500000
        });
        setLoading(false);
    };

    const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Ecommerce Dashboard</h1>
                <p className="text-slate-500 mt-2">Quản lý bán hàng đa kênh & Biểu đồ doanh thu</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-50 text-green-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Tổng doanh thu</p>
                            <h3 className="text-2xl font-bold text-slate-800">34.5M</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Shopee</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.shopee} đơn</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-slate-100 text-black">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">TikTok Shop</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.tiktok} đơn</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-violet-50 text-violet-600">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Website</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.web} đơn</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Doanh thu theo kêng */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
                    <h3 className="text-lg font-bold mb-6 text-slate-800">Doanh thu theo kênh</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={formatMoney} />
                                <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value as number)} />
                                <Bar dataKey="revenue" fill="#8884d8" radius={[8, 8, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tỷ trọng */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
                    <h3 className="text-lg font-bold mb-6 text-slate-800">Tỷ trọng đơn hàng</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="revenue"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value as number)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
