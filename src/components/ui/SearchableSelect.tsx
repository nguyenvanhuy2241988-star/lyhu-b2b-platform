"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, X, Loader2, Check } from "lucide-react";

export interface SearchableOption {
    value: string;
    label: string;
    code?: string;
}

interface SearchableSelectProps {
    options: SearchableOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    error?: boolean;
}

// Hàm chuẩn hóa tiếng Việt bỏ dấu để tìm kiếm gõ không dấu hoặc có dấu
function removeVietnameseTones(str: string): string {
    return (str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
}

export function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = "-- Chọn --",
    searchPlaceholder = "Gõ tìm kiếm...",
    disabled = false,
    loading = false,
    className = "",
    error = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Tìm option hiện tại
    const selectedOption = useMemo(() => {
        return options.find((opt) => opt.value === value);
    }, [options, value]);

    // Lọc danh sách theo từ khóa tìm kiếm (hỗ trợ có dấu và không dấu)
    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return options;
        const normalizedSearch = removeVietnameseTones(searchTerm);
        return options.filter((opt) => {
            const normLabel = removeVietnameseTones(opt.label);
            const normValue = removeVietnameseTones(opt.value);
            return normLabel.includes(normalizedSearch) || normValue.includes(normalizedSearch);
        });
    }, [options, searchTerm]);

    // Xử lý click ra ngoài để đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Tự động focus vào ô tìm kiếm khi mở
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        setSearchTerm("");
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Trigger Button */}
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() => {
                    if (!disabled && !loading) {
                        setIsOpen((prev) => !prev);
                        setSearchTerm("");
                    }
                }}
                onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !disabled && !loading) {
                        e.preventDefault();
                        setIsOpen((prev) => !prev);
                    }
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm flex items-center justify-between cursor-pointer select-none transition-all ${
                    disabled
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : error
                        ? "border-red-500 bg-white hover:border-red-600 focus:ring-2 focus:ring-red-200"
                        : isOpen
                        ? "border-[#00AFA9] ring-2 ring-[#00AFA9]/20 bg-white"
                        : "border-slate-300 bg-white hover:border-slate-400"
                }`}
            >
                <div className="truncate flex-1 pr-2">
                    {selectedOption ? (
                        <span className="font-medium text-slate-900">{selectedOption.label}</span>
                    ) : value ? (
                        <span className="font-medium text-slate-900">{value}</span>
                    ) : (
                        <span className="text-slate-400">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#00AFA9]" />
                    ) : (
                        <>
                            {value && !disabled && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="p-0.5 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                                    title="Xóa lựa chọn"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                    isOpen ? "rotate-180 text-[#00AFA9]" : ""
                                }`}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Dropdown Panel */}
            {isOpen && !disabled && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Input Box */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                        <div className="relative flex items-center">
                            <Search className="w-4 h-4 absolute left-2.5 text-slate-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#00AFA9] focus:ring-1 focus:ring-[#00AFA9] text-slate-800 placeholder:text-slate-400"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 overscroll-contain">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isSelected = opt.value === value;
                                return (
                                    <div
                                        key={opt.code || opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                            isSelected
                                                ? "bg-teal-50 text-teal-800 font-semibold"
                                                : "text-slate-700 hover:bg-slate-100/80"
                                        }`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && (
                                            <Check className="w-3.5 h-3.5 text-[#00AFA9] shrink-0 ml-2" />
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-6 px-3 text-center text-xs text-slate-400">
                                {searchTerm ? (
                                    <>
                                        Không tìm thấy kết quả cho &quot;
                                        <strong className="text-slate-600 font-medium">{searchTerm}</strong>
                                        &quot;
                                    </>
                                ) : (
                                    "Không có dữ liệu"
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer count indicator */}
                    {filteredOptions.length > 0 && (
                        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>{filteredOptions.length} lựa chọn</span>
                            {searchTerm && <span>Đang lọc</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
