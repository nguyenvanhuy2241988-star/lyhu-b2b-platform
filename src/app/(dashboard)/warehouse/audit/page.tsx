"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Search,
    RefreshCcw,
    Save,
    ArrowLeft,
    CheckCircle2,
    Package,
    AlertCircle,
    Loader2
} from "lucide-react";
import { fetchAllInventoryLevels, adjustStock } from "@/lib/inventoryStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function InventoryAuditPage() {
    const { user, session } = useAuth();
    const router = useRouter();
    const [inventory, setInventory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [auditData, setAuditData] = useState<Record<string, { newQty: number; note: string }>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const loadInventory = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await fetchAllInventoryLevels(undefined, session?.access_token);
            setInventory(data);
            // Initialize audit data
            const initialAudit: any = {};
            data.forEach(item => {
                initialAudit[item.id] = { newQty: item.quantity_on_hand, note: "Kiểm kê định kỳ" };
            });
            setAuditData(initialAudit);
        } catch (err) {
            console.error('[InventoryAuditPage] Failed to load inventory:', err);
        } finally {
            setIsLoading(false);
        }
    }, [session?.access_token]);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    const handleQtyChange = (itemId: string, val: string) => {
        const qty = parseInt(val) || 0;
        setAuditData(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], newQty: qty }
        }));
    };

    const handleNoteChange = (itemId: string, val: string) => {
        setAuditData(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], note: val }
        }));
    };

    const handleSaveAudit = async () => {
        if (!user?.id) return;

        const confirmed = confirm("Bạn có chắc chắn muốn cập nhật toàn bộ thay đổi kiểm kê này?");
        if (!confirmed) return;

        setIsSaving(true);
        setSaveStatus(null);
        let successCount = 0;
        let failCount = 0;

        for (const item of inventory) {
            const audit = auditData[item.id];
            // Only update if quantity changed
            if (audit && audit.newQty !== item.quantity_on_hand) {
                const res = await adjustStock(
                    item.warehouse_id,
                    item.product_id,
                    audit.newQty,
                    user.id,
                    audit.note
                );
                if (res.success) successCount++;
                else failCount++;
            }
        }

        setIsSaving(false);
        if (failCount === 0) {
            setSaveStatus({ type: 'success', message: `Đã cập nhật thành công ${successCount} sản phẩm.` });
            loadInventory();
        } else {
            setSaveStatus({ type: 'error', message: `Hoàn tất: ${successCount} thành công, ${failCount} thất bại.` });
            loadInventory();
        }
    };

    const filteredInventory = inventory.filter(item =>
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const changedCount = inventory.filter(item => auditData[item.id]?.newQty !== item.quantity_on_hand).length;

    return (
        <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        title="Quay lại"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                            Kiểm kê Kho
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                            Đối soát và điều chỉnh tồn kho thực tế
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={loadInventory}
                        disabled={isLoading}
                        className="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                        title="Tải lại dữ liệu"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00AFA9]' : ''}`} />
                    </button>
                    <button
                        onClick={handleSaveAudit}
                        disabled={isSaving || changedCount === 0}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-[#00AFA9] hover:bg-[#009b95] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu thay đổi {changedCount > 0 && `(${changedCount})`}
                    </button>
                </div>
            </div>

            {/* Notification alert if saved */}
            {saveStatus && (
                <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold ${
                    saveStatus.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                    {saveStatus.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{saveStatus.message}</span>
                </div>
            )}

            {/* Warning Notice (Pure flat) */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 sm:p-4 rounded-xl flex items-start gap-3 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                    <p className="font-bold">Lưu ý kiểm kê</p>
                    <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                        Số lượng thay đổi sẽ cập nhật trực tiếp vào tồn kho hệ thống và lưu nhật ký người thực hiện. Vui lòng đối chiếu kỹ trước khi bấm Lưu.
                    </p>
                </div>
            </div>

            {/* Main Area */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Search Bar */}
                <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm sản phẩm cần kiểm kê theo tên hoặc SKU..."
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#00AFA9] text-xs sm:text-sm font-medium transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {changedCount > 0 && (
                        <span className="hidden sm:inline-flex text-xs font-bold text-[#00AFA9] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                            {changedCount} mặt hàng thay đổi
                        </span>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-[11px]">Sản phẩm</th>
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-center w-28">Tồn hệ thống</th>
                                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-center w-36">Tồn thực tế</th>
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-[11px]">Ghi chú & Lý do</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#00AFA9] mb-2" />
                                        <p className="text-xs">Đang tải dữ liệu kiểm kê...</p>
                                    </td>
                                </tr>
                            ) : filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                                        Không tìm thấy sản phẩm nào phù hợp
                                    </td>
                                </tr>
                            ) : filteredInventory.map((item) => {
                                const currentQty = auditData[item.id]?.newQty ?? item.quantity_on_hand;
                                const isModified = currentQty !== item.quantity_on_hand;

                                return (
                                    <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${isModified ? 'bg-teal-50/20' : ''}`}>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg shrink-0">
                                                    <Package className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-slate-900 truncate">{item.product?.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{item.product?.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className="font-semibold text-slate-500">{item.quantity_on_hand}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <input
                                                type="number"
                                                className={`w-24 px-2.5 py-1.5 rounded-lg border text-center font-bold text-xs sm:text-sm transition-colors focus:outline-none focus:border-[#00AFA9] ${
                                                    isModified
                                                        ? 'border-[#00AFA9] bg-teal-50/50 text-[#00AFA9]'
                                                        : 'border-slate-200 bg-white text-slate-900'
                                                }`}
                                                value={currentQty}
                                                onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                            />
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <input
                                                type="text"
                                                placeholder="Lý do điều chỉnh..."
                                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#00AFA9] transition-colors text-slate-700"
                                                value={auditData[item.id]?.note || ""}
                                                onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="py-16 text-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#00AFA9] mb-2" />
                            <p className="text-xs">Đang tải dữ liệu kiểm kê...</p>
                        </div>
                    ) : filteredInventory.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                            Không tìm thấy sản phẩm nào
                        </div>
                    ) : (
                        filteredInventory.map((item) => {
                            const currentQty = auditData[item.id]?.newQty ?? item.quantity_on_hand;
                            const isModified = currentQty !== item.quantity_on_hand;

                            return (
                                <div key={item.id} className={`p-3.5 space-y-2.5 ${isModified ? 'bg-teal-50/30' : ''}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-1">{item.product?.name}</p>
                                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{item.product?.sku}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Tồn HT</span>
                                            <span className="font-bold text-slate-700 text-xs">{item.quantity_on_hand}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 items-center pt-1">
                                        <div className="col-span-1">
                                            <label className="text-[10px] text-slate-500 font-bold block mb-1">Tồn thực tế:</label>
                                            <input
                                                type="number"
                                                className={`w-full px-2 py-1.5 rounded-lg border text-center font-bold text-xs ${
                                                    isModified
                                                        ? 'border-[#00AFA9] bg-teal-50 text-[#00AFA9]'
                                                        : 'border-slate-200 bg-white text-slate-900'
                                                }`}
                                                value={currentQty}
                                                onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-slate-500 font-bold block mb-1">Ghi chú:</label>
                                            <input
                                                type="text"
                                                placeholder="Lý do..."
                                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#00AFA9] text-slate-700"
                                                value={auditData[item.id]?.note || ""}
                                                onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Bottom sticky action bar on mobile */}
            {changedCount > 0 && (
                <div className="sm:hidden fixed bottom-14 left-0 right-0 p-3 bg-white border-t border-slate-200 z-30">
                    <button
                        onClick={handleSaveAudit}
                        disabled={isSaving}
                        className="w-full py-2.5 bg-[#00AFA9] hover:bg-[#009b95] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu {changedCount} thay đổi kiểm kê
                    </button>
                </div>
            )}
        </div>
    );
}
