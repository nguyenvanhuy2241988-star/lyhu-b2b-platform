"use client";

import React, { useState } from "react";
import { PRICE_BOOKS, PriceBookType } from "@/lib/priceBooks";
import { Tag, Store, ShoppingBag, FileSpreadsheet, Sparkles } from "lucide-react";
import { PriceBookModal } from "./PriceBookModal";

interface PriceBookSelectorProps {
    selectedPriceBook: PriceBookType;
    onSelectPriceBook: (type: PriceBookType) => void;
    itemCount?: number;
}

export function PriceBookSelector({
    selectedPriceBook,
    onSelectPriceBook,
    itemCount = 0
}: PriceBookSelectorProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Title & Badge */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-sm">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Bảng Giá Áp Dụng:
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${PRICE_BOOKS[selectedPriceBook].color}`}>
                                {PRICE_BOOKS[selectedPriceBook].badge}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Sản phẩm khi chọn sẽ tự động điền đơn giá theo bảng giá này (có thể sửa giá tự do).
                        </p>
                    </div>
                </div>

                {/* Options & Action */}
                <div className="flex items-center flex-wrap gap-2">
                    {/* Bảng Giá Sỉ (NPP) */}
                    <button
                        type="button"
                        onClick={() => onSelectPriceBook('npp')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            selectedPriceBook === 'npp'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Báo giá NPP Tháng 10.2026 (+8% VAT)"
                    >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Giá Sỉ (NPP)</span>
                    </button>

                    {/* Bảng Giá Siêu Thị */}
                    <button
                        type="button"
                        onClick={() => onSelectPriceBook('supermarket')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            selectedPriceBook === 'supermarket'
                                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Báo giá Siêu thị Tháng 10.2026 (+8% VAT)"
                    >
                        <Store className="w-3.5 h-3.5" />
                        <span>Giá Siêu Thị</span>
                    </button>

                    {/* Bảng Giá Bán Lẻ */}
                    <button
                        type="button"
                        onClick={() => onSelectPriceBook('retail')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            selectedPriceBook === 'retail'
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Giá bán lẻ niêm yết"
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Giá Lẻ</span>
                    </button>

                    {/* Button Xem Báo Giá Mẫu Tháng 10 */}
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 hover:text-teal-800 transition-colors ml-auto sm:ml-2 shadow-xs"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                        <span>Báo giá mẫu T10</span>
                    </button>
                </div>
            </div>

            {/* Modal Bảng Báo Giá Mẫu */}
            <PriceBookModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentPriceBook={selectedPriceBook}
                onSelectPriceBook={onSelectPriceBook}
            />
        </div>
    );
}
