"use client";

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, ArrowRight, Archive, ClipboardList, CheckCircle2, Loader2, Warehouse as WarehouseIcon } from "lucide-react";
import Link from 'next/link';
import { fetchWarehousingStats } from '@/lib/inventoryStore';
import { FulfillmentModal } from "@/components/warehouse/FulfillmentModal";
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

export default function WarehouseDashboard() {
    const { session } = useAuth();
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        outOfStock: 0,
        ordersToPack: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadStats = async () => {
        try {
            setIsLoading(true);
            const data = await fetchWarehousingStats(undefined, session?.access_token);
            setStats(data);
        } catch (err) {
            console.error('[WarehouseDashboard] Failed to load stats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();

        if (!session?.access_token) return;

        // Real-time subscription for both orders and inventory changes
        const ordersChannel = supabase
            .channel('warehouse_dashboard_orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload: any) => {
                    console.log('[WarehouseDashboard] Orders change detected:', payload.eventType);
                    loadStats();
                }
            )
            .subscribe((status: string) => {
                console.log('[WarehouseDashboard] Orders channel status:', status);
                // Force reload if we just subscribed to ensure we have latest data
                if (status === 'SUBSCRIBED') loadStats();
            });

        const inventoryChannel = supabase
            .channel('warehouse_dashboard_inventory')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory_levels' },
                (payload: any) => {
                    console.log('[WarehouseDashboard] Inventory change detected:', payload.eventType);
                    loadStats();
                }
            )
            .subscribe((status: string) => {
                console.log('[WarehouseDashboard] Inventory channel status:', status);
                if (status === 'SUBSCRIBED') loadStats();
            });

        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(inventoryChannel);
        };
    }, [session?.access_token]);

    const dashCards = [
        {
            label: "Đơn chờ đóng gói",
            value: stats.ordersToPack,
            icon: ClipboardList,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            link: "/warehouse/fulfillment",
            desc: "Đơn hàng mới cần xử lý"
        },
        {
            label: "Sản phẩm sắp hết",
            value: stats.lowStock,
            icon: AlertTriangle,
            color: "text-amber-600",
            bg: "bg-amber-50",
            link: "/warehouse/inventory?filter=low",
            desc: "Cần xem xét nhập thêm"
        },
        {
            label: "Đã hết hàng",
            value: stats.outOfStock,
            icon: Archive,
            color: "text-red-600",
            bg: "bg-red-50",
            link: "/warehouse/inventory?filter=out",
            desc: "Cần nhập kho ngay"
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-primary-600 font-bold mb-1">
                        <WarehouseIcon className="w-5 h-5" />
                        <span className="text-xs uppercase tracking-widest">Trung tâm Vận hành</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý Kho vận</h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi tồn kho và tối ưu quy trình xử lý đơn hàng.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/warehouse/import" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-primary-700 transition-all flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Nhập kho mới
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashCards.map((card, idx) => (
                    <Link key={idx} href={card.link} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all group relative overflow-hidden">
                        <div className={`absolute top - 0 right - 0 w - 24 h - 24 ${card.bg} rounded - bl - full - mr - 8 - mt - 8 opacity - 50 group - hover: scale - 110 transition - transform`} />
                        <div className="flex items-start justify-between relative">
                            <div className={`p - 3 ${card.bg} ${card.color} rounded - xl`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 relative">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                            <div className="flex items-end gap-2 mt-1">
                                <h3 className="text-3xl font-black text-slate-900">
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : card.value}
                                </h3>
                                <span className="text-xs text-slate-400 font-medium mb-1.5">{card.desc}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs font-bold text-primary-600 opacity-0 group-hover:opacity-100 transition-all">
                            XỬ LÝ NGAY <ArrowRight className="ml-1 w-3 h-3" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Practical Operations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inventory Management */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Package className="w-32 h-32" />
                    </div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Package className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Quản lý Kho hàng</h3>
                        </div>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            Kiểm tra số lượng tồn thực tế, cập nhật thông tin sản phẩm và thực hiện điều chỉnh kho định kỳ.
                        </p>
                        <div className="space-y-3">
                            <Link href="/warehouse/inventory" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all group/item">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-700">Xem danh sách tồn kho</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover/item:text-primary-600 group-hover/item:translate-x-1 transition-all" />
                            </Link>
                            <Link href="/warehouse/history" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all group/item">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-700">Lịch sử biến động</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover/item:text-primary-600 group-hover/item:translate-x-1 transition-all" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Logistics & Shipping */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                        <ClipboardList className="w-32 h-32" />
                    </div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Vận hành Đơn hàng</h3>
                        </div>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            Xử lý quy trình đóng gói, in phiếu giao hàng và bàn giao cho đơn vị vận chuyển (Fulfillment).
                        </p>
                        <div className="space-y-3">
                            <Link href="/warehouse/fulfillment" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all group/item">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-700">Đơn hàng chờ xử lý</span>
                                    {stats.ordersToPack > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-lg">+{stats.ordersToPack}</span>}
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover/item:text-primary-600 group-hover/item:translate-x-1 transition-all" />
                            </Link>
                            <Link href="/warehouse/export" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all group/item">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-700">Xuất kho thủ công</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover/item:text-primary-600 group-hover/item:translate-x-1 transition-all" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
