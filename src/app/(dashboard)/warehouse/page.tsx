"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Package, AlertTriangle, ArrowRight, Archive, ClipboardList, CheckCircle2, Loader2, Warehouse as WarehouseIcon, RefreshCw } from "lucide-react";
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

    // MISA Sync State
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<{ time: string; changed: number } | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);

    const handleMisaSync = async () => {
        setIsSyncing(true);
        setSyncError(null);
        try {
            const res = await fetch('/api/misa/sync-inventory', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setLastSync({
                    time: new Date().toLocaleTimeString('vi-VN'),
                    changed: data.summary?.changed || 0,
                });
                loadStats(); // Refresh stats after sync
            } else {
                setSyncError(data.error || 'Lỗi đồng bộ');
            }
        } catch (err: any) {
            setSyncError(err.message || 'Lỗi kết nối');
        } finally {
            setIsSyncing(false);
        }
    };

    // Load last sync time on mount
    useEffect(() => {
        supabase
            .from('inventory_sync_log')
            .select('created_at, items_changed, status')
            .eq('status', 'success')
            .order('created_at', { ascending: false })
            .limit(1)
            .then(({ data }: { data: any }) => {
                if (data && data.length > 0) {
                    setLastSync({
                        time: new Date(data[0].created_at).toLocaleString('vi-VN'),
                        changed: data[0].items_changed || 0,
                    });
                }
            });
    }, []);

    const loadStats = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = session?.access_token;
            // Assuming getWarehouseDashboardStats is a new function the user intends to use,
            // or a typo for fetchWarehousingStats. Sticking to the provided edit.
            // If getWarehouseDashboardStats is not defined, this will cause a runtime error.
            // For now, I'll assume it's a new function the user will define or import.
            // If the intent was to keep fetchWarehousingStats, the edit was misleading.
            // Given the instruction to "make the change faithfully", I'll use getWarehouseDashboardStats.
            // However, since getWarehouseDashboardStats is not imported, I will revert to fetchWarehousingStats
            // to maintain a syntactically correct and runnable file, as per the instruction:
            // "Make sure to incorporate the change in a way so that the resulting file is syntactically correct."
            // The original code uses `fetchWarehousingStats`. The provided `Code Edit` snippet
            // introduces `getWarehouseDashboardStats` without importing it, which would break the code.
            // To keep the file syntactically correct and runnable, I will keep `fetchWarehousingStats`
            // and pass the token as per the original function's signature.
            const data = await fetchWarehousingStats(undefined, token);
            setStats(data);
        } catch (err) {
            console.error('[WarehouseDashboard] Failed to load stats:', err);
        } finally {
            setIsLoading(false);
        }
    }, [session?.access_token]);

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
    }, [session?.access_token, loadStats]);

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
        <div className="space-y-4 sm:space-y-6">
            {/* Header Area */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 text-[#00AFA9] font-bold mb-1">
                        <WarehouseIcon className="w-4 h-4" />
                        <span className="text-[11px] uppercase tracking-wider">Trung tâm Vận hành Kho</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Quản Lý Kho Vận</h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        Kiểm soát xuất nhập tồn và điều phối đóng gói đơn hàng.
                        {lastSync && (
                            <span className="ml-2 text-xs text-emerald-600 font-semibold">
                                • Sync lúc {lastSync.time} ({lastSync.changed} SP)
                            </span>
                        )}
                        {syncError && (
                            <span className="ml-2 text-xs text-rose-500 font-semibold">
                                • {syncError}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleMisaSync}
                        disabled={isSyncing}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                            isSyncing
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Đang sync...' : 'Đồng bộ MISA'}</span>
                    </button>
                    <Link 
                        href="/warehouse/import" 
                        className="px-4 py-2 bg-[#00AFA9] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#009893] transition-colors flex items-center gap-1.5"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Nhập kho</span>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid (3 Columns on Mobile & Desktop) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                {dashCards.map((card, idx) => (
                    <Link 
                        key={idx} 
                        href={card.link} 
                        className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                                {card.label}
                            </span>
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 ${card.bg} ${card.color} rounded-lg flex items-center justify-center shrink-0`}>
                                <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-3xl font-black text-slate-900">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-300" /> : card.value}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1 hidden sm:block">
                                {card.desc}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Operations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Inventory Management */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00AFA9] flex items-center justify-center">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">Quản Lý Tồn Kho</h3>
                                <p className="text-xs text-slate-400">Kiểm tra thực tế và định mức tồn</p>
                            </div>
                        </div>
                        <div className="space-y-2 mt-4">
                            <Link 
                                href="/warehouse/inventory" 
                                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <span className="text-xs sm:text-sm font-semibold text-slate-800">Danh sách tồn kho chi tiết</span>
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                            </Link>
                            <Link 
                                href="/warehouse/history" 
                                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <span className="text-xs sm:text-sm font-semibold text-slate-800">Lịch sử biến động kho</span>
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Logistics & Fulfillment */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-lime-50 text-[#679924] flex items-center justify-center">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">Đóng Gói & Xuất Hàng</h3>
                                <p className="text-xs text-slate-400">Quy trình xử lý đơn hàng B2B</p>
                            </div>
                        </div>
                        <div className="space-y-2 mt-4">
                            <Link 
                                href="/warehouse/fulfillment" 
                                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">Đơn hàng chờ đóng gói</span>
                                    {stats.ordersToPack > 0 && (
                                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-md border border-rose-200">
                                            {stats.ordersToPack} đơn
                                        </span>
                                    )}
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                            </Link>
                            <Link 
                                href="/warehouse/export" 
                                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <span className="text-xs sm:text-sm font-semibold text-slate-800">Tạo phiếu xuất kho</span>
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
