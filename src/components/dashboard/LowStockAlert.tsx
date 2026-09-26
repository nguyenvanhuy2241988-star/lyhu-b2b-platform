"use client";

import { AlertTriangle, Package } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LowStockItem {
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    minStockLevel: number;
}

interface LowStockAlertProps {
    items: LowStockItem[];
    isLoading?: boolean;
}

export default function LowStockAlert({ items, isLoading }: LowStockAlertProps) {
    if (isLoading) {
        return null;
    }

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 sm:p-4 mb-6">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-sm sm:text-base text-amber-900">
                            Cảnh báo tồn kho thấp
                        </h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 shrink-0">
                            {items.length} sản phẩm
                        </span>
                    </div>
                    <p className="text-xs text-amber-800 mb-3">
                        Các mặt hàng cần kiểm tra và tạo lệnh nhập kho sớm
                    </p>
                    <div className="space-y-2">
                        {items.slice(0, 5).map((item) => (
                            <div
                                key={item.productId}
                                className="flex items-center justify-between gap-2 bg-white rounded-lg p-2.5 text-xs sm:text-sm border border-slate-200/70 shadow-none"
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <Package className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-slate-900 truncate" title={item.productName}>
                                            {item.productName}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                            SKU: {item.sku}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold border",
                                        item.currentStock === 0 
                                            ? "bg-red-50 text-red-700 border-red-200" 
                                            : "bg-amber-50 text-amber-800 border-amber-200"
                                    )}>
                                        {item.currentStock === 0 ? "Hết hàng" : `Còn ${item.currentStock}`} ({item.currentStock}/{item.minStockLevel})
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {items.length > 5 && (
                        <p className="text-xs text-amber-600 mt-2">
                            + {items.length - 5} sản phẩm khác
                        </p>
                    )}
                    <Link
                        href="/warehouse/inventory"
                        className="inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-900 font-medium mt-3"
                    >
                        Xem chi tiết kho →
                    </Link>
                </div>
            </div>
        </div>
    );
}
