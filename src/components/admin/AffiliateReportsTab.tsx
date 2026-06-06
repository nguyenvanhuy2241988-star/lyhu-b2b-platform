"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { Users, MousePointerClick, TrendingUp, DollarSign, Loader2, Award } from "lucide-react";

export function AffiliateReportsTab() {
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeAffiliates: 0,
        totalClicks: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCommissionPaid: 0,
    });
    const [topAffiliates, setTopAffiliates] = useState<any[]>([]);

    useEffect(() => {
        if (session) {
            fetchReportData();
        }
    }, [session]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            // 1. Total Active Affiliates
            const { count: affiliatesCount } = await supabase
                .from('affiliate_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // 2. Total Clicks
            const { count: clicksCount } = await supabase
                .from('affiliate_clicks')
                .select('*', { count: 'exact', head: true });

            // 3. Orders stats (Only consider delivered or finalized orders for actual revenue)
            // But let's get all orders with an affiliate_id
            const { data: orders } = await supabase
                .from('orders')
                .select('total_amount, commission_amount, affiliate_status')
                .not('affiliate_id', 'is', null);

            let totalOrders = 0;
            let totalRevenue = 0;
            let totalCommissionPaid = 0; // Total approved/paid commission

            if (orders) {
                totalOrders = orders.length;
                orders.forEach(o => {
                    if (o.affiliate_status !== 'cancelled') {
                        totalRevenue += Number(o.total_amount);
                    }
                    if (o.affiliate_status === 'approved' || o.affiliate_status === 'paid') {
                        totalCommissionPaid += Number(o.commission_amount);
                    }
                });
            }

            setStats({
                activeAffiliates: affiliatesCount || 0,
                totalClicks: clicksCount || 0,
                totalOrders,
                totalRevenue,
                totalCommissionPaid
            });

            // 4. Top Affiliates by Commission/Revenue
            const { data: profiles } = await supabase
                .from('affiliate_profiles')
                .select(`
                    id,
                    affiliate_code,
                    total_withdrawn,
                    profiles:user_id ( full_name, email, phone )
                `)
                .eq('status', 'active');

            if (profiles) {
                // Fetch orders grouped by affiliate manually (as Supabase RPC grouping is complex without writing one)
                const { data: affOrders } = await supabase
                    .from('orders')
                    .select('affiliate_id, total_amount, commission_amount, affiliate_status')
                    .not('affiliate_id', 'is', null);
                
                const affiliateStatsMap = new Map();
                
                profiles.forEach(p => {
                    affiliateStatsMap.set(p.id, {
                        ...p,
                        total_revenue: 0,
                        total_commission: 0,
                        orders_count: 0
                    });
                });

                if (affOrders) {
                    affOrders.forEach(o => {
                        if (affiliateStatsMap.has(o.affiliate_id) && o.affiliate_status !== 'cancelled') {
                            const stat = affiliateStatsMap.get(o.affiliate_id);
                            stat.orders_count += 1;
                            stat.total_revenue += Number(o.total_amount);
                            if (o.affiliate_status === 'approved' || o.affiliate_status === 'paid') {
                                stat.total_commission += Number(o.commission_amount);
                            }
                        }
                    });
                }

                const sortedAffiliates = Array.from(affiliateStatsMap.values())
                    .sort((a, b) => b.total_revenue - a.total_revenue)
                    .slice(0, 10); // Top 10

                setTopAffiliates(sortedAffiliates);
            }

        } catch (error) {
            console.error("Error fetching report data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="p-2 bg-blue-50 rounded-full mb-3 text-blue-600">
                        <Users size={20} />
                    </div>
                    <div className="text-sm font-medium text-slate-500 mb-1">Tổng số CTV</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.activeAffiliates}</div>
                </div>
                
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="p-2 bg-indigo-50 rounded-full mb-3 text-indigo-600">
                        <MousePointerClick size={20} />
                    </div>
                    <div className="text-sm font-medium text-slate-500 mb-1">Lượt Click Link</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.totalClicks.toLocaleString()}</div>
                </div>
                
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="p-2 bg-orange-50 rounded-full mb-3 text-orange-600">
                        <Award size={20} />
                    </div>
                    <div className="text-sm font-medium text-slate-500 mb-1">Đơn thành công</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.totalOrders.toLocaleString()}</div>
                </div>
                
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="p-2 bg-emerald-50 rounded-full mb-3 text-emerald-600">
                        <TrendingUp size={20} />
                    </div>
                    <div className="text-sm font-medium text-slate-500 mb-1">Doanh thu CTV mang lại</div>
                    <div className="text-2xl font-bold text-emerald-600">{stats.totalRevenue.toLocaleString()}đ</div>
                </div>
                
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="p-2 bg-amber-50 rounded-full mb-3 text-amber-600">
                        <DollarSign size={20} />
                    </div>
                    <div className="text-sm font-medium text-slate-500 mb-1">Hoa hồng đã/sẽ trả</div>
                    <div className="text-2xl font-bold text-amber-600">{stats.totalCommissionPaid.toLocaleString()}đ</div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Award className="text-amber-500" size={18} />
                        Bảng xếp hạng Đối tác (Top 10)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-slate-500">Hạng</th>
                                <th className="p-4 text-xs font-semibold text-slate-500">Thông tin Đối tác</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 text-center">Số đơn</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 text-right">Doanh thu mang lại</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 text-right">Hoa hồng nhận được</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {topAffiliates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Chưa có dữ liệu giao dịch.</td>
                                </tr>
                            ) : topAffiliates.map((aff, index) => (
                                <tr key={aff.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 w-16 text-center font-bold text-slate-400">
                                        {index === 0 && <span className="text-amber-500 text-xl">1</span>}
                                        {index === 1 && <span className="text-slate-400 text-xl">2</span>}
                                        {index === 2 && <span className="text-amber-700 text-xl">3</span>}
                                        {index > 2 && index + 1}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{aff.profiles?.full_name || 'N/A'}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{aff.profiles?.phone}</div>
                                        <div className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded inline-block mt-1">
                                            {aff.affiliate_code}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center font-medium text-slate-700">
                                        {aff.orders_count}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="font-bold text-emerald-600">{aff.total_revenue.toLocaleString()}đ</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="font-bold text-amber-600">{aff.total_commission.toLocaleString()}đ</div>
                                        <div className="text-[10px] text-slate-500 mt-1">Đã rút: {Number(aff.total_withdrawn || 0).toLocaleString()}đ</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
