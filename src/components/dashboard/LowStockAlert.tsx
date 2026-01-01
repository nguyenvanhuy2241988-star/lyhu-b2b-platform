"use client";

import { AlertTriangle, Package } from 'lucide-react';
import Link from 'next/link';

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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-amber-800 mb-2">
                        ⚠️ Cảnh báo tồn kho thấp
                    </h3>
                    <p className="text-sm text-amber-700 mb-3">
                        Có {items.length} sản phẩm cần nhập thêm hàng
                    </p>
                    <div className="space-y-2">
                        {items.slice(0, 5).map((item) => (
                            <div
                                key={item.productId}
                                className="flex items-center justify-between bg-white rounded-lg p-2 text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium text-slate-700">{item.productName}</span>
                                    <span className="text-slate-400">({item.sku})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-red-600 font-bold">{item.currentStock}</span>
                                    <span className="text-slate-400">/</span>
                                    <span className="text-slate-500">{item.minStockLevel} min</span>
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
