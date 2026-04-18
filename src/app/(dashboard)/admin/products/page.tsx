"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import ProductList from "@/components/products/ProductList";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ProductsPage() {
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
            } else {
                setSyncError(data.error || 'Lỗi đồng bộ');
            }
        } catch (err: any) {
            setSyncError(err.message || 'Lỗi kết nối');
        } finally {
            setIsSyncing(false);
        }
    };

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

    return (
        <div>
            {/* Inventory Sync Bar */}
            <div className="mb-4 flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                <div className="text-sm text-slate-600">
                    <span className="font-bold text-slate-800">Đồng bộ tồn kho MISA</span>
                    {lastSync && (
                        <span className="ml-2 text-xs text-emerald-600">
                            ✅ Lần cuối: {lastSync.time} ({lastSync.changed} SP thay đổi)
                        </span>
                    )}
                    {syncError && (
                        <span className="ml-2 text-xs text-red-500">❌ {syncError}</span>
                    )}
                </div>
                <button
                    onClick={handleMisaSync}
                    disabled={isSyncing}
                    className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                        isSyncing
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                    }`}
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ MISA'}
                </button>
            </div>
            <ProductList readOnly={false} />
        </div>
    );
}
