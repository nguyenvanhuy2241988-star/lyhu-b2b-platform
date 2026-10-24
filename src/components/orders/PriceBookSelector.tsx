"use client";

import React, { useState } from "react";
import { PRICE_BOOKS, PriceBookType } from "@/lib/priceBooks";
import { Tag, Store, ShoppingBag, FileSpreadsheet, Sparkles, Check } from "lucide-react";
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Title & Active Badge */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Bảng Giá Áp Dụng:
                            </span>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${PRICE_BOOKS[selectedPriceBook].color}`}>
                                {PRICE_BOOKS[selectedPriceBook].badge}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            {PRICE_BOOKS[selectedPriceBook].description}
                        </p>
                    </div>
                </div>

                {/* Price Book Option Groups */}
                <div className="flex items-center flex-wrap gap-2">
                    {/* Nhóm Giá Sỉ (NPP) */}
                    <div className="inline-flex rounded-lg border border-amber-200 bg-amber-50/50 p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => onSelectPriceBook('npp')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                selectedPriceBook === 'npp'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-amber-900 hover:bg-amber-100/60'
                            }`}
                            title="Đơn giá NPP Chưa thuế (Đã giảm 8% VAT)"
                        >
                            <Tag className="w-3 h-3" />
                            <span>Sỉ NPP (Chưa VAT)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onSelectPriceBook('npp_vat')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                selectedPriceBook === 'npp_vat'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-amber-800 hover:bg-amber-100/60'
                            }`}
                            title="Đơn giá NPP Đã bao gồm 8% VAT"
                        >
                            <span>Có VAT</span>
                        </button>
                    </div>

                    {/* Nhóm Giá Siêu Thị */}
                    <div className="inline-flex rounded-lg border border-blue-200 bg-blue-50/50 p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => onSelectPriceBook('supermarket')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                selectedPriceBook === 'supermarket'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-blue-900 hover:bg-blue-100/60'
                            }`}
                            title="Đơn giá Siêu Thị Chưa thuế (Đã giảm 8% VAT)"
                        >
                            <Store className="w-3 h-3" />
                            <span>Siêu Thị (Chưa VAT)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onSelectPriceBook('supermarket_vat')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                selectedPriceBook === 'supermarket_vat'
                                    ? 'bg-blue-700 text-white shadow-xs'
                                    : 'text-blue-800 hover:bg-blue-100/60'
                            }`}
                            title="Đơn giá Siêu Thị Đã bao gồm 8% VAT"
                        >
                            <span>Có VAT</span>
                        </button>
                    </div>

                    {/* Giá Bán Lẻ */}
                    <button
                        type="button"
                        onClick={() => onSelectPriceBook('retail')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                            selectedPriceBook === 'retail'
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Giá bán lẻ niêm yết"
                    >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Giá Lẻ</span>
                    </button>

                    {/* Button Xem Báo Giá Mẫu Tháng 10 */}
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 hover:text-teal-800 transition-colors ml-auto shadow-2xs cursor-pointer"
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
