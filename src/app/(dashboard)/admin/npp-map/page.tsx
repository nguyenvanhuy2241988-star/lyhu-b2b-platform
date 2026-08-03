"use client";

import { useState } from "react";
import VietnamMapSVG from "@/components/admin/VietnamMapSVG";
import { nppData, defaultTargets, ProvinceData } from "@/lib/nppData";
import { MapPin, Target, CheckCircle2, AlertCircle } from "lucide-react";

export default function NppMapPage() {
    const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

    const totalProvinces = 63;
    const coveredProvinces = Object.values(nppData).filter(p => p.hasNPP).length;
    const emptyProvinces = totalProvinces - coveredProvinces;

    // Get current province data
    const activeProvince = hoveredProvince;
    const currentData = activeProvince ? nppData[activeProvince] : null;
    const hasNPP = currentData?.hasNPP || false;
    const targets = currentData?.targets || defaultTargets;

    // Format currency
    const formatVND = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-blue-600" />
                        Bản đồ Phân Bổ Nhà Phân Phối
                    </h1>
                    <p className="text-slate-500 mt-1">Theo dõi độ phủ và chỉ tiêu doanh số theo khu vực địa lý</p>
                </div>
                
                {/* Legend */}
                <div className="flex items-center gap-6 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-emerald-500 shadow-inner"></span>
                        <span className="text-sm font-medium text-slate-700">Đã phủ NPP</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-rose-500 shadow-inner"></span>
                        <span className="text-sm font-medium text-slate-700">Thị trường trống</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Map Area */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[600px] flex items-center justify-center bg-slate-50/50">
                    <div className="w-full max-w-[600px]">
                        <VietnamMapSVG 
                            data={nppData}
                            hoveredProvince={hoveredProvince}
                            onHover={setHoveredProvince}
                        />
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-500" />
                            Tổng quan thị trường
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-600">Tổng số tỉnh/thành</span>
                                <span className="font-bold text-slate-900">{totalProvinces}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-600 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    Đã phủ NPP
                                </span>
                                <span className="font-bold text-emerald-600">{coveredProvinces}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-rose-500" />
                                    Thị trường trống
                                </span>
                                <span className="font-bold text-rose-600">{emptyProvinces}</span>
                            </div>
                        </div>
                    </div>

                    {/* Details Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all duration-300 min-h-[320px]">
                        {activeProvince ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h2 className="text-xl font-bold text-slate-900 mb-2">{activeProvince}</h2>
                                
                                <div className="mb-6">
                                    {hasNPP ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Đã có Nhà Phân Phối
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-700 border border-rose-200">
                                            <AlertCircle className="h-4 w-4" />
                                            Khu vực trống (Cần mở)
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                    Chỉ tiêu Doanh số Độc quyền:
                                </h3>
                                
                                <div className="space-y-3">
                                    {Object.entries(targets).map(([brand, target], index) => (
                                        <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="font-medium text-slate-700">{brand}</span>
                                            <span className="font-bold text-blue-600">{formatVND(Number(target) || 0)}</span>
                                        </div>
                                    ))}
                                    
                                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                                        <span className="font-bold text-slate-900">Tổng chỉ tiêu:</span>
                                        <span className="text-lg font-black text-blue-700">
                                            {formatVND(Object.values(targets).reduce((acc: number, val) => acc + (Number(val) || 0), 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-3">
                                <MapPin className="h-12 w-12 opacity-50" />
                                <p className="text-slate-500">
                                    Di chuột hoặc nhấn vào một tỉnh/thành trên bản đồ để xem chi tiết chỉ tiêu doanh số.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
