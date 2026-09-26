"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Archive, Search, Filter, Warehouse,
    History, ArrowRight, ArrowUpRight,
    ArrowDownRight, Download, Edit2,
    PackageOpen, Loader2, ChevronLeft, ChevronRight
} from "lucide-react";

// Custom debounce hook to avoid external dependency issues
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

import {
    fetchPaginatedInventory,
    adjustStock,
    getDefaultWarehouseId
} from "@/lib/inventoryStore";
import { supabase } from "@/lib/supabaseClient";
import { StockAdjustmentModal } from "@/components/warehouse/StockAdjustmentModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { exportInventoryToCSV } from "@/lib/exportCSV";

const ITEMS_PER_PAGE = 25;

export default function WarehouseInventoryPage() {
    const { user, session } = useAuth();
    const router = useRouter();

    // Data State
    const [inventory, setInventory] = useState<any[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter & Pagination State
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(1);
    const [warehouseName] = useState("Kho Tổng Hà Nội");

    // Modal State
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const { data, count } = await fetchPaginatedInventory(
                currentPage,
                ITEMS_PER_PAGE,
                debouncedSearchTerm,
                undefined,
                session?.access_token
            );
            setInventory(data);
            setTotalItems(count);
        } catch (err: any) {
            console.error('[InventoryPage] Failed to load inventory:', err);
            setError('Không thể tải dữ liệu tồn kho. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, session?.access_token]);

    useEffect(() => {
        loadData();

        if (!session?.access_token) return;

        // Realtime subscription for inventory changes
        const channel = supabase
            .channel('inventory_realtime_v2')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory_levels' },
                () => {
                    console.log('[InventoryPage] Inventory change detected, refreshing page...');
                    loadData();
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') console.log('[InventoryPage] Realtime ready');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.access_token, loadData]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

    const handleOpenAdjust = (item: any) => {
        setSelectedItem(item);
        setIsAdjustModalOpen(true);
    };

    const handleSaveAdjust = async (newQuantity: number, note: string) => {
        if (!selectedItem || !user?.id) return;

        const res = await adjustStock(
            selectedItem.warehouse_id,
            selectedItem.product_id,
            newQuantity,
            user.id,
            note,
            session?.access_token
        );

        if (res.success) {
            setIsAdjustModalOpen(false);
            loadData();
        } else {
            alert('Lỗi: ' + res.message);
        }
    };

    const handleExport = () => {
        const exportData = inventory.map(item => ({
            productName: item.product?.name,
            sku: item.product?.sku,
            quantityOnHand: item.quantity_on_hand,
            quantityCommitted: item.quantity_committed,
            warehouseName: warehouseName
        }));
        exportInventoryToCSV(exportData);
    };

    return (
        <div className="space-y-5 pb-16 lg:pb-6">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Archive className="w-6 h-6 text-[#00AFA9]" />
                        Quản lý tồn kho
                    </h1>
                    <p className="text-slate-500 mt-0.5 text-xs sm:text-sm">
                        Theo dõi {totalItems.toLocaleString('vi-VN')} mặt hàng tại {warehouseName}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExport}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Tải CSV
                    </button>
                    <button
                        onClick={() => router.push('/warehouse/history')}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
                    >
                        <History className="w-3.5 h-3.5" />
                        Lịch sử
                    </button>
                    <button
                        onClick={() => router.push('/warehouse/import')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-[#00AFA9] hover:bg-[#009b95] text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-colors shadow-sm"
                    >
                        <Warehouse className="w-3.5 h-3.5" />
                        Nhập kho
                    </button>
                    <button
                        onClick={() => router.push('/warehouse/export')}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
                    >
                        <Archive className="w-3.5 h-3.5" />
                        Xuất kho
                    </button>
                </div>
            </div>

            {/* Quick Stats (Pure Flat) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-slate-500 text-xs font-medium">Sản phẩm trong kho</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalItems.toLocaleString('vi-VN')}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-slate-500 text-xs font-medium">Kho lưu trữ chính</p>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">{warehouseName}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-medium">Đồng bộ tồn kho</p>
                        <div className="mt-1 flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#8EC63F] rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Realtime Live</span>
                        </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Trang {currentPage}/{totalPages || 1}</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between bg-slate-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên sản phẩm hoặc SKU..."
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-[#00AFA9] bg-white transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {totalItems > 0 && (
                        <div className="text-[11px] font-semibold text-slate-500 self-center">
                            Tổng {totalItems} mặt hàng
                        </div>
                    )}
                </div>

                {/* Table / Error / Loading */}
                <div className="flex-1">
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-rose-600 bg-rose-50/40 m-4 rounded-xl text-center">
                            <PackageOpen className="w-10 h-10 mb-2" />
                            <p className="font-semibold text-sm">{error}</p>
                            <button onClick={loadData} className="mt-3 px-4 py-1.5 bg-[#00AFA9] text-white rounded-xl text-xs font-bold">Thử lại</button>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-3">
                            <Loader2 className="w-8 h-8 text-[#00AFA9] animate-spin" />
                            <p className="text-slate-400 text-xs">Đang truy xuất dữ liệu kho...</p>
                        </div>
                    ) : inventory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <PackageOpen className="w-12 h-12 text-slate-300 mb-3" />
                            <h3 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy sản phẩm</h3>
                            <p className="text-slate-500 text-xs max-w-sm">
                                {debouncedSearchTerm ? `Không có kết quả nào khớp với "${debouncedSearchTerm}"` : "Kho hàng của bạn hiện đang trống."}
                            </p>
                            {debouncedSearchTerm && (
                                <button onClick={() => setSearchTerm("")} className="mt-4 text-[#00AFA9] text-xs font-bold hover:underline">Xóa tìm kiếm</button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px]">Sản phẩm & Thông tin</th>
                                            <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Tồn thực tế</th>
                                            <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Đang giữ</th>
                                            <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Có thể bán</th>
                                            <th className="px-5 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {inventory.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                                                <td className="px-5 py-3">
                                                    <div className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-[#00AFA9] transition-colors">
                                                        {item.product?.name}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                                                            {item.product?.sku}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {item.product?.brand || 'LYHU'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="text-sm font-bold text-slate-900">
                                                        {item.quantity_on_hand.toLocaleString('vi-VN')}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    {item.quantity_committed > 0 ? (
                                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold text-xs">
                                                            <History className="w-3 h-3" />
                                                            {item.quantity_committed.toLocaleString('vi-VN')}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">0</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        item.quantity_available > 10
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : item.quantity_available > 0
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    }`}>
                                                        {item.quantity_available.toLocaleString('vi-VN')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenAdjust(item)}
                                                            className="p-1.5 bg-[#00AFA9]/10 text-[#00AFA9] rounded-lg hover:bg-[#00AFA9] hover:text-white transition-colors"
                                                            title="Kiểm kê & Điều chỉnh"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => router.push(`/warehouse/history?search=${item.product?.sku}`)}
                                                            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                                            title="Lịch sử chi tiết"
                                                        >
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List View */}
                            <div className="lg:hidden divide-y divide-slate-100">
                                {inventory.map((item) => (
                                    <div key={item.id} className="p-3.5 space-y-2.5">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{item.product?.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                                                        {item.product?.sku}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {item.product?.brand || 'LYHU'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                item.quantity_available > 10
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : item.quantity_available > 0
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                Có thể bán: {item.quantity_available.toLocaleString('vi-VN')}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl text-xs">
                                            <div>
                                                <span className="text-slate-400 text-[10px] uppercase font-bold block">Tồn thực tế</span>
                                                <span className="font-bold text-slate-800 text-sm">{item.quantity_on_hand.toLocaleString('vi-VN')}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-[10px] uppercase font-bold block">Đang giữ</span>
                                                <span className="font-semibold text-slate-600">{item.quantity_committed.toLocaleString('vi-VN')}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleOpenAdjust(item)}
                                                    className="px-2.5 py-1 bg-[#00AFA9]/10 text-[#00AFA9] rounded-lg text-xs font-bold hover:bg-[#00AFA9] hover:text-white transition-colors"
                                                >
                                                    Điều chỉnh
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/warehouse/history?search=${item.product?.sku}`)}
                                                    className="p-1 bg-slate-200 text-slate-600 rounded-lg"
                                                    title="Lịch sử"
                                                >
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Pagination Controls */}
                {!isLoading && totalItems > 0 && (
                    <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-[11px] sm:text-xs text-slate-500 font-medium order-2 sm:order-1">
                            Hiển thị <span className="text-slate-900 font-bold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span>
                            - <span className="text-slate-900 font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span>
                            {" "} trong số <span className="text-slate-900 font-bold">{totalItems}</span> mặt hàng
                        </div>
                        <div className="flex items-center gap-2 order-1 sm:order-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Trước
                            </button>

                            <div className="flex items-center px-3 font-bold text-xs sm:text-sm text-slate-900">
                                {currentPage} <span className="mx-1 text-slate-300">/</span> {totalPages}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || isLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Sau
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Audit/Adjustment Modal */}
            <StockAdjustmentModal
                isOpen={isAdjustModalOpen}
                onClose={() => setIsAdjustModalOpen(false)}
                onSave={handleSaveAdjust}
                productName={selectedItem?.product?.name || ''}
                currentStock={selectedItem?.quantity_on_hand || 0}
            />
        </div>
    );
}
