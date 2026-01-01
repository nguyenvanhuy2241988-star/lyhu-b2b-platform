"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Archive,
    Search,
    RefreshCcw,
    Save,
    History,
    ArrowLeft,
    ArrowRight,
    Package,
    AlertCircle,
    CheckCircle2,
    Loader2
} from "lucide-react";
import Link from "next/link";
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

    useEffect(() => {
        loadInventory();
    }, [session?.access_token, loadInventory]);

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
        let successCount = 0;
        let failCount = 0;

        for (const item of inventory) {
            const audit = auditData[item.id];
            // Only update if quantity changed
            if (audit.newQty !== item.quantity_on_hand) {
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
            alert(`✅ Đã cập nhật thành công ${successCount} sản phẩm.`);
            loadInventory();
        } else {
            alert(`⚠️ Hoàn tất: ${successCount} thành công, ${failCount} thất bại.`);
            loadInventory();
        }
    };

    const filteredInventory = inventory.filter(item =>
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kiểm kê Kho</h1>
                        <p className="text-slate-500 text-sm mt-1">Điều chỉnh tồn kho thực tế và đối soát hàng hóa.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={loadInventory}
                        className="p-3 bg-white text-slate-600 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                        title="Tải lại dữ liệu"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSaveAudit}
                        disabled={isSaving}
                        className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Lưu toàn bộ thay đổi
                    </button>
                </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl flex items-start gap-4 text-amber-900">
                <AlertCircle className="w-6 h-6 shrink-0 mt-1 opacity-70" />
                <div className="text-sm">
                    <p className="font-black uppercase tracking-tighter mb-1">Cảnh báo Vận hành</p>
                    <p className="font-medium opacity-80 leading-relaxed">
                        Mọi thay đổi số lượng tại đây sẽ ảnh hưởng trực tiếp đến dữ liệu tồn kho thực tế.
                        Vui lòng kiểm tra kỹ số lượng trước khi nhấn Lưu. Nhật ký sẽ ghi lại người thực hiện thao tác này.
                    </p>
                </div>
            </div>

            {/* Filter & Table Area */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm sản phẩm cần kiểm kê..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tồn hệ thống</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tồn thực tế</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ghi chú & Lý do</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-200" />
                                    </td>
                                </tr>
                            ) : filteredInventory.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                                                <Package className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{item.product?.name}</div>
                                                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{item.product?.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="text-sm font-black text-slate-400">{item.quantity_on_hand}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <input
                                            type="number"
                                            className={`w-20 px-3 py-2 rounded-xl border text-center font-black transition-all focus:ring-4 focus:ring-primary-500/10 focus:outline-none ${auditData[item.id]?.newQty !== item.quantity_on_hand
                                                ? 'border-primary-500 bg-primary-50/30 text-primary-700 ring-2 ring-primary-500/20'
                                                : 'border-slate-200 bg-white text-slate-900'
                                                }`}
                                            value={auditData[item.id]?.newQty ?? item.quantity_on_hand}
                                            onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-8 py-5">
                                        <input
                                            type="text"
                                            placeholder="Lý do điều chỉnh..."
                                            className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-primary-500 transition-all text-slate-600"
                                            value={auditData[item.id]?.note || ""}
                                            onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Action */}
            <div className="flex justify-center pb-12">
                <button
                    onClick={handleSaveAudit}
                    disabled={isSaving}
                    className="group px-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-2xl hover:bg-black transition-all flex items-center gap-4 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                    HOÀN TẤT KIỂM KÊ
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
            </div>
        </div>
    );
}
