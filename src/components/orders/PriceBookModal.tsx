"use client";

import React, { useState } from "react";
import {
    PRICE_BOOKS,
    PriceBookType,
    OCTOBER_2026_MASTER_PRICES,
    MasterPriceItem
} from "@/lib/priceBooks";
import {
    FileSpreadsheet,
    X,
    Search,
    Download,
    Check,
    Store,
    Tag,
    ShoppingBag,
    Info,
    ExternalLink
} from "lucide-react";

interface PriceBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPriceBook: PriceBookType;
    onSelectPriceBook: (type: PriceBookType) => void;
}

const formatVND = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

export function PriceBookModal({
    isOpen,
    onClose,
    currentPriceBook,
    onSelectPriceBook
}: PriceBookModalProps) {
    const [activeTab, setActiveTab] = useState<PriceBookType>(currentPriceBook === 'retail' ? 'npp' : currentPriceBook);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    if (!isOpen) return null;

    const categories = ["all", ...Array.from(new Set(OCTOBER_2026_MASTER_PRICES.map(p => p.category)))];

    const filteredItems = OCTOBER_2026_MASTER_PRICES.filter(item => {
        const matchSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.barcode.includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = selectedCategory === "all" || item.category === selectedCategory;
        return matchSearch && matchCat;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50 via-white to-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Bảng Báo Giá Chuẩn Mẫu Tháng 10.2026
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                                    LYHU B2B Official
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Giá chuẩn đã bao gồm 8% VAT. Lên đơn tự động lấy giá, telesales vẫn có thể điều chỉnh trên từng dòng đơn hàng.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Switcher & Search Bar */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    {/* Bảng giá selector tabs */}
                    <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('npp')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                activeTab === 'npp'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-slate-700 hover:text-slate-900'
                            }`}
                        >
                            <Tag className="w-3.5 h-3.5" />
                            Báo giá NPP (Giá Sỉ)
                        </button>
                        <button
                            onClick={() => setActiveTab('supermarket')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                activeTab === 'supermarket'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-700 hover:text-slate-900'
                            }`}
                        >
                            <Store className="w-3.5 h-3.5" />
                            Báo giá Siêu Thị
                        </button>
                    </div>

                    {/* Filter and Search */}
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên SP hoặc mã vạch..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700 focus:outline-none focus:border-teal-500"
                        >
                            <option value="all">Tất cả ngành hàng</option>
                            {categories.filter(c => c !== "all").map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Button chọn nhanh bảng giá này cho đơn */}
                    <button
                        onClick={() => {
                            onSelectPriceBook(activeTab);
                            onClose();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-all ${
                            activeTab === 'npp'
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        <Check className="w-3.5 h-3.5" />
                        Áp dụng Bảng {activeTab === 'npp' ? 'Giá Sỉ (NPP)' : 'Giá Siêu Thị'} cho đơn
                    </button>
                </div>

                {/* Table Data */}
                <div className="overflow-y-auto flex-1 p-4">
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                                    <th className="py-2.5 px-3 w-10 text-center">STT</th>
                                    <th className="py-2.5 px-3 w-32">Mã vạch SP</th>
                                    <th className="py-2.5 px-3 min-w-[200px]">Tên sản phẩm</th>
                                    <th className="py-2.5 px-3 w-16 text-center">ĐVT</th>
                                    <th className="py-2.5 px-3 w-20 text-center">Trọng lượng</th>
                                    <th className="py-2.5 px-3 w-20 text-center">HSD</th>
                                    <th className="py-2.5 px-3 w-36">Quy cách thùng</th>
                                    <th className="py-2.5 px-3 text-right bg-teal-50/80 font-bold text-teal-900">
                                        {activeTab === 'npp' ? 'Đơn giá chào NPP (+8% VAT)' : 'Đơn giá Siêu Thị (+8% VAT)'}
                                    </th>
                                    {activeTab === 'npp' && (
                                        <th className="py-2.5 px-3 text-right text-slate-600">
                                            Giá theo thùng
                                        </th>
                                    )}
                                    <th className="py-2.5 px-3 w-24 text-center">Xuất xứ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.map((item, idx) => {
                                    const isCurrentMatch = currentPriceBook === activeTab;
                                    const currentPrice = activeTab === 'npp' ? item.nppPrice : item.supermarketPrice;

                                    return (
                                        <tr key={item.barcode + idx} className="hover:bg-teal-50/30 transition-colors">
                                            <td className="py-2 px-3 text-center text-slate-400 font-mono">
                                                {item.stt}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                                                {item.barcode}
                                            </td>
                                            <td className="py-2 px-3 font-medium text-slate-900">
                                                <div>{item.name}</div>
                                                <div className="text-[10px] text-slate-400">{item.category}</div>
                                            </td>
                                            <td className="py-2 px-3 text-center text-slate-600">
                                                {item.unit}
                                            </td>
                                            <td className="py-2 px-3 text-center text-slate-600">
                                                {item.weight}
                                            </td>
                                            <td className="py-2 px-3 text-center text-slate-500">
                                                {item.hsd}
                                            </td>
                                            <td className="py-2 px-3 text-slate-600 text-[11px]">
                                                {item.packaging}
                                            </td>
                                            <td className="py-2 px-3 text-right font-bold text-teal-700 bg-teal-50/40 whitespace-nowrap">
                                                {formatVND(currentPrice)}
                                            </td>
                                            {activeTab === 'npp' && (
                                                <td className="py-2 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                                                    {item.boxPrice > 0 ? formatVND(item.boxPrice) : "-"}
                                                </td>
                                            )}
                                            <td className="py-2 px-3 text-center text-slate-500 text-[11px]">
                                                {item.origin}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>Tổng số: <strong>{filteredItems.length}</strong> sản phẩm trong Báo giá Tháng 10.2026.</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
