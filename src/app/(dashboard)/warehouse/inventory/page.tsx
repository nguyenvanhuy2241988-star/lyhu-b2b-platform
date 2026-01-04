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
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Archive className="w-6 h-6 text-indigo-600" />
                        Quản lý tồn kho
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Theo dõi {totalItems.toLocaleString('vi-VN')} mặt hàng tại {warehouseName}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Tải CSV
                    </button>
                    <button
                        onClick={() => router.push('/warehouse/history')}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium"
                    >
                        <History className="w-4 h-4" />
                        Lịch sử
                    </button>
                    <button
                        onClick={() => router.push('/warehouse/import')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm text-sm font-medium transition-all active:scale-95"
                    >
                        <Warehouse className="w-4 h-4" />
                        Nhập kho
                    </button>
                    <button
                        onClick={() => router.push('/warehouse/export')}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-2 text-sm font-medium"
                    >
                        <Archive className="w-4 h-4" />
                        Xuất kho
                    </button>
                </div>
            </div>

            {/* Quick Stats (Simplified for performance) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                    <p className="text-slate-500 text-sm font-medium">Sản phẩm trong danh mục</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{totalItems.toLocaleString('vi-VN')}</h3>
                </div>
                <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-100 relative overflow-hidden group">
                    <div className="absolute -right-2 -bottom-2 w-32 h-32 bg-white/10 rounded-full rotate-45 group-hover:scale-110 transition-transform"></div>
                    <p className="text-indigo-100 text-sm font-medium">Chi tiết Tồn kho</p>
                    <h3 className="text-xl font-bold text-white mt-2 leading-relaxed">
                        Tải từng trang giúp tối ưu hiệu năng <span className="text-indigo-200 font-normal text-sm block mt-1">Sẵn sàng phục vụ {totalItems}+ mã hàng</span>
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-slate-400 text-xs italic">Dữ liệu phân trang Server-side</p>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">REALTIME ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
                    <div className="relative max-w-sm w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên sản phẩm hoặc SKU..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {totalItems > 0 && (
                        <div className="flex items-center gap-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Trang {currentPage} / {totalPages} (TổNG {totalItems})
                            </div>
                        </div>
                    )}
                </div>

                {/* Table / Error / Loading */}
                <div className="flex-1 overflow-x-auto">
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-red-50/30 m-6 rounded-2xl">
                            <PackageOpen className="w-12 h-12 mb-4" />
                            <p className="font-bold">{error}</p>
                            <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">Thử lại</button>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                            <p className="text-slate-400 text-sm animate-pulse">Đang truy xuất kho dữ liệu...</p>
                        </div>
                    ) : inventory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                            <div className="p-6 bg-slate-50 rounded-full mb-6">
                                <PackageOpen className="w-16 h-16 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy sản phẩm</h3>
                            <p className="text-slate-500 max-w-sm">
                                {debouncedSearchTerm ? `Không có kết quả nào khớp với "${debouncedSearchTerm}"` : "Kho hàng của bạn hiện đang trống."}
                            </p>
                            {debouncedSearchTerm && (
                                <button onClick={() => setSearchTerm("")} className="mt-6 text-indigo-600 font-bold hover:underline">Xóa tìm kiếm</button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-slate-50/80 text-slate-500 sticky top-0 z-10 backdrop-blur-md">
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Sản phẩm & Thông tin</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Tồn thực tế</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Đang giữ</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Có thể bán</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {inventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {item.product?.name}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                                                    {item.product?.sku}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {item.product?.brand || 'No Brand'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-lg font-bold text-slate-900">
                                                {item.quantity_on_hand.toLocaleString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.quantity_committed > 0 ? (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full font-bold text-xs">
                                                    <History className="w-3 h-3" />
                                                    {item.quantity_committed.toLocaleString('vi-VN')}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs font-medium">0</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-bold ${item.quantity_available > 10
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : item.quantity_available > 0
                                                    ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                                    : 'bg-red-50 text-red-700 border border-red-100'
                                                }`}>
                                                {item.quantity_available.toLocaleString('vi-VN')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenAdjust(item)}
                                                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title="Kiểm kê & Điều chỉnh"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/warehouse/history?search=${item.product?.sku}`)}
                                                    className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-sm"
                                                    title="Lịch sử chi tiết"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                    }
                </div>

                {/* Pagination Controls */}
                {!isLoading && totalItems > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-slate-500 font-medium order-2 sm:order-1">
                            Hiển thị <span className="text-slate-900 font-bold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span>
                            - <span className="text-slate-900 font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span>
                            {" "} TRêN TỔNG SỐ <span className="text-slate-900 font-bold">{totalItems}</span> SẢN PHẨM
                        </div>
                        <div className="flex items-center gap-2 order-1 sm:order-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Trước
                            </button>

                            <div className="flex items-center px-4 font-bold text-sm text-slate-900">
                                {currentPage} <span className="mx-1 text-slate-300">/</span> {totalPages}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || isLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Sau
                                <ChevronRight className="w-4 h-4" />
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
