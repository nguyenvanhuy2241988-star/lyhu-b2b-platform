"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Archive, Search, Filter, Warehouse, History, ArrowRight, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";
import { fetchAllInventoryLevels, getDefaultWarehouseId } from "@/lib/inventoryStore";

import { supabase } from "@/lib/supabaseClient";
import { StockAdjustmentModal } from "@/components/warehouse/StockAdjustmentModal";
import { adjustStock } from "@/lib/inventoryStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { Edit2 } from "lucide-react";
import { exportInventoryToCSV } from "@/lib/exportCSV";

export default function WarehouseInventoryPage() {
    const { user, session } = useAuth();
    const [inventory, setInventory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [warehouseName, setWarehouseName] = useState("Kho Tổng Hà Nội");

    // Modal State
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const router = useRouter();

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await fetchAllInventoryLevels(undefined, session?.access_token);
            setInventory(data);
        } catch (err) {
            console.error('[InventoryPage] Failed to load inventory:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        if (!session?.access_token) return;

        // Realtime subscription for inventory changes
        const channel = supabase
            .channel('inventory_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory_levels' },
                () => {
                    console.log('[InventoryPage] Inventory level change detected');
                    loadData();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory_transactions' },
                () => {
                    console.log('[InventoryPage] Inventory transaction change detected');
                    loadData();
                }
            )
            .subscribe((status: string) => {
                console.log('[InventoryPage] Inventory channel status:', status);
                if (status === 'SUBSCRIBED') loadData();
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.access_token]);

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
            note
        );

        if (res.success) {
            alert('✅ Cập nhật thành công!');
            loadData(); // Reload table
        } else {
            alert('❌ Lỗi: ' + res.message);
        }
    };

    const filteredInventory = inventory.filter(item =>
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Archive className="w-6 h-6 text-indigo-600" />
                        Quản lý tồn kho
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Theo dõi số lượng tồn thực tế và khả dụng tại {warehouseName}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const exportData = filteredInventory.map(item => ({
                                productName: item.product_name,
                                sku: item.sku,
                                quantityOnHand: item.quantity_on_hand,
                                quantityCommitted: item.quantity_committed,
                                warehouseName: warehouseName
                            }));
                            exportInventoryToCSV(exportData);
                        }}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Tải CSV
                    </button>
                    <button
                        onClick={() => router.push('/warehouse/history')}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <History className="w-4 h-4" />
                        Lịch sử biến động
                    </button>
                    <button
                        onClick={() => router.push('/warehouse/export')}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-2"
                    >
                        <Archive className="w-4 h-4" />
                        Xuất kho
                    </button>
                    <button
                        onClick={() => router.push('/warehouse/import')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                    >
                        <Warehouse className="w-4 h-4" />
                        Nhập kho
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform hover:scale-110"></div>
                    <p className="text-slate-500 text-sm font-medium relative">Tổng sản phẩm</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2 relative">{inventory.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform hover:scale-110"></div>
                    <p className="text-slate-500 text-sm font-medium relative">Tổng tồn kho (Cái)</p>
                    <h3 className="text-3xl font-bold text-indigo-600 mt-2 relative">
                        {inventory.reduce((sum, item) => sum + item.quantity_on_hand, 0).toLocaleString('vi-VN')}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform hover:scale-110"></div>
                    <p className="text-slate-500 text-sm font-medium relative">Hàng đang giữ</p>
                    <h3 className="text-3xl font-bold text-orange-600 mt-2 relative">
                        {inventory.reduce((sum, item) => sum + item.quantity_committed, 0).toLocaleString('vi-VN')}
                    </h3>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50 rounded-t-xl">
                    <div className="relative max-w-md w-full">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc SKU..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Sản phẩm</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Thông tin</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Tồn thực tế</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Đang giữ</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Có thể bán</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                            Đang tải dữ liệu...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredInventory.length > 0 ? (
                                filteredInventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {item.product?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-500">
                                                SKU: <span className="font-medium text-slate-700">{item.product?.sku}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Brand: {item.product?.brand || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-medium text-slate-900">
                                                {item.quantity_on_hand.toLocaleString('vi-VN')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.quantity_committed > 0 ? (
                                                <span className="text-orange-600 font-medium">
                                                    {item.quantity_committed.toLocaleString('vi-VN')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.quantity_available > 0
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {item.quantity_available.toLocaleString('vi-VN')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenAdjust(item)}
                                                    className="p-2 text-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-colors"
                                                    title="Sửa tồn kho (Kiểm kê)"
                                                >
                                                    <Edit2 className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/warehouse/history?search=${item.product?.sku}`)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-2 rounded hover:bg-indigo-50 transition-colors"
                                                    title="Xem lịch sử"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Không tìm thấy sản phẩm nào trong kho.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Adjust Modal */}
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
