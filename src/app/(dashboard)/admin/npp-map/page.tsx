"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import VietnamMapSVG from "@/components/admin/VietnamMapSVG";
import { getProvinceData, fetchNppDataFromAPI, saveNppDataToAPI, ProvinceData, defaultBrands } from "@/lib/nppData";
import { provinceDemographics } from "@/lib/demographics";
import { fetchUsers, User } from "@/lib/usersStore";
import { MapPin, Target, CheckCircle2, AlertCircle, Edit2, Save, X, TrendingUp, Loader2, Users, Maximize, Map, DollarSign, Briefcase } from "lucide-react";

export default function NppMapPage() {
    const [nppData, setNppData] = useState<Record<string, ProvinceData>>({});
    const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
    const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    
    // For holding edits before saving
    const [editData, setEditData] = useState<ProvinceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [telesalesUsers, setTelesalesUsers] = useState<User[]>([]);
    
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [data, users] = await Promise.all([
                    fetchNppDataFromAPI(),
                    fetchUsers()
                ]);
                setNppData(data);
                // Filter telesales staff (include sale_admin as well since they often manage)
                setTelesalesUsers(users.filter(u => u.role === 'telesales' || u.role === 'sale_admin'));
            } catch (err) {
                console.error("Failed to load map data", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const totalProvinces = 63;
    const coveredProvinces = Object.values(nppData).filter(p => Object.values(p.brands).some(b => b.hasNPP || (b.currentSales > 0))).length;
    const emptyProvinces = totalProvinces - coveredProvinces;

    // Tính toán doanh số toàn quốc
    const nationalStats = defaultBrands.map(brand => {
        let totalTarget = 0;
        let totalActual = 0;
        Object.values(nppData).forEach(p => {
            if (p.brands[brand]) {
                totalTarget += (p.brands[brand].target || 0);
                totalActual += (p.brands[brand].currentSales || 0);
            }
        });
        return { brand, totalTarget, totalActual };
    });

    const grandTotalTarget = nationalStats.reduce((sum, s) => sum + s.totalTarget, 0);
    const grandTotalActual = nationalStats.reduce((sum, s) => sum + s.totalActual, 0);

    // Sidebar detail only responds to CLICKED province (not hover) to prevent layout reflow flicker
    const activeProvince = selectedProvince;
    const currentData = activeProvince ? getProvinceData(nppData, activeProvince) : null;
    
    // Check if at least one brand has NPP in this province
    const hasAnyNPP = currentData ? Object.values(currentData.brands).some(b => b.hasNPP || (b.currentSales > 0)) : false;

    // Format currency
    const formatVND = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    // Handle map click
    const handleMapClick = useCallback((province: string) => {
        if (selectedProvince === province) {
            // Deselect
            setSelectedProvince(null);
            setEditMode(false);
        } else {
            setSelectedProvince(province);
            setEditMode(false);
        }
    }, [selectedProvince]);

    const startEditing = () => {
        if (!activeProvince || !currentData) return;
        setEditData(JSON.parse(JSON.stringify(currentData))); // Deep copy
        setEditMode(true);
    };

    const cancelEditing = () => {
        setEditMode(false);
        setEditData(null);
    };

    const saveEditing = async () => {
        if (!activeProvince || !editData) return;
        
        setIsSaving(true);
        const newData = { ...nppData, [activeProvince]: editData };
        // Optimistic update
        setNppData(newData);
        
        // Push to server
        const payload = { [activeProvince]: editData };
        await saveNppDataToAPI(payload);
        
        setEditMode(false);
        setIsSaving(false);
    };

    // Update edit data fields
    const updateBrand = (brand: string, field: string, value: any) => {
        if (!editData) return;
        setEditData({
            ...editData,
            brands: {
                ...editData.brands,
                [brand]: {
                    ...editData.brands[brand],
                    [field]: value
                }
            }
        });
    };

    const MemoizedMap = useMemo(() => (
        <VietnamMapSVG 
            data={nppData}
            onHover={setHoveredProvince}
            onClick={handleMapClick}
        />
    ), [nppData, handleMapClick]);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (tooltipRef.current) {
                const isLeft = e.clientX > window.innerWidth / 2;
                tooltipRef.current.style.left = `${isLeft ? e.clientX - 340 : e.clientX + 20}px`;
                tooltipRef.current.style.top = `${e.clientY + 20}px`;
            }
        };
        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }, []);

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-blue-600" />
                        Bản đồ Phân Bổ Nhà Phân Phối
                        {isLoading && <Loader2 className="h-5 w-5 text-blue-400 animate-spin ml-2" />}
                    </h1>
                    <p className="text-slate-500 mt-1">Theo dõi độ phủ và thiết lập chỉ tiêu doanh số theo khu vực địa lý</p>
                </div>
                
                {/* Legend */}
                <div className="flex items-center gap-6 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-primary-500 shadow-inner"></span>
                        <span className="text-sm font-medium text-slate-700">Đã có NPP (Ít nhất 1 nhãn)</span>
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
                <div 
                    className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[600px] flex items-center justify-center bg-slate-50/50 relative"
                    style={{ contain: 'layout style paint' }}
                >
                    <div className="w-full max-w-[600px]" style={{ willChange: 'transform' }}>
                        {MemoizedMap}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Summary Card - Only show if no province is explicitly selected */}
                    {!selectedProvince && (
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
                                        <CheckCircle2 className="h-4 w-4 text-primary-500" />
                                        Đã phủ NPP
                                    </span>
                                    <span className="font-bold text-primary-600">{coveredProvinces}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-rose-500" />
                                        Thị trường trống
                                    </span>
                                    <span className="font-bold text-rose-600">{emptyProvinces}</span>
                                </div>
                            </div>
                            
                            {/* Báo cáo doanh số toàn quốc */}
                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Doanh số toàn quốc
                                </h3>
                                
                                <div className="space-y-4">
                                    {nationalStats.map((stat, idx) => {
                                        const percent = stat.totalTarget > 0 ? Math.min(100, Math.round((stat.totalActual / stat.totalTarget) * 100)) : 0;
                                        return (
                                            <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <div className="font-semibold text-slate-800 text-sm mb-2">{stat.brand}</div>
                                                <div className="flex justify-between items-center text-xs mb-1">
                                                    <span className="text-slate-500">Dự kiến:</span>
                                                    <span className="font-medium text-slate-700">{formatVND(stat.totalTarget)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs mb-2">
                                                    <span className="text-slate-500">Thực tế:</span>
                                                    <span className="font-bold text-primary-600">{formatVND(stat.totalActual)}</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                                                    <div 
                                                        className={`h-1 rounded-full ${percent >= 100 ? 'bg-primary-500' : 'bg-blue-500'}`} 
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="mt-5 pt-4 border-t border-slate-200">
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <span className="font-bold text-slate-900">Tổng doanh số dự kiến:</span>
                                        <span className="font-bold text-slate-800">{formatVND(grandTotalTarget)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-primary-700">Tổng doanh số thực tế:</span>
                                        <span className="font-black text-primary-600 text-base">{formatVND(grandTotalActual)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Details Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all duration-300 min-h-[320px]">
                        {activeProvince && currentData ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-slate-900">{activeProvince}</h2>
                                    
                                    {/* Edit Controls */}
                                    {selectedProvince && (
                                        editMode ? (
                                            <div className="flex gap-2">
                                                <button onClick={cancelEditing} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Hủy">
                                                    <X className="h-5 w-5" />
                                                </button>
                                                <button onClick={saveEditing} disabled={isSaving} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center" title="Lưu">
                                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={startEditing} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium">
                                                <Edit2 className="h-4 w-4" /> Chỉnh sửa
                                            </button>
                                        )
                                    )}
                                </div>
                                
                                {!editMode && (
                                    <div className="mb-6 flex items-center justify-between">
                                        {hasAnyNPP ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 border border-primary-200">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Khu vực đã có NPP
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-700 border border-rose-200">
                                                <AlertCircle className="h-4 w-4" />
                                                Khu vực trống (Cần mở)
                                            </span>
                                        )}
                                        
                                        {currentData.telesales && (
                                            <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                                                <Users className="h-4 w-4 text-slate-400" />
                                                Phụ trách: <span className="text-primary-700 font-bold">{currentData.telesales}</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                                
                                {editMode && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Nhân viên Telesales phụ trách
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
                                            value={editData?.telesales || ''}
                                            onChange={(e) => {
                                                if (editData) {
                                                    setEditData({...editData, telesales: e.target.value === 'Chưa phân công' ? '' : e.target.value});
                                                }
                                            }}
                                        >
                                            <option value="" disabled>-- Chọn nhân viên --</option>
                                            <option value="Chưa phân công">Chưa phân công</option>
                                            {telesalesUsers.map(staff => (
                                                <option key={staff.id} value={staff.name}>{staff.name} - {staff.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                    Chi tiết theo Nhãn hàng:
                                </h3>
                                
                                <div className="space-y-4">
                                    {defaultBrands.map((brand, index) => {
                                        // Use editData in editMode, currentData in view mode
                                        const sourceData = editMode && editData ? editData : currentData;
                                        const bData = sourceData.brands[brand];
                                        if (!bData) return null;
                                        
                                        const percent = bData.target > 0 ? Math.min(100, Math.round((bData.currentSales / bData.target) * 100)) : 0;
                                        
                                        return (
                                            <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="font-bold text-slate-800">{brand}</span>
                                                    
                                                    {editMode ? (
                                                        <label className="flex items-center cursor-pointer">
                                                            <div className="relative">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="sr-only" 
                                                                    checked={bData.hasNPP || (bData.currentSales > 0)} 
                                                                    onChange={(e) => updateBrand(brand, 'hasNPP', e.target.checked)}
                                                                />
                                                                <div className={`block w-10 h-6 rounded-full transition-colors ${(bData.hasNPP || bData.currentSales > 0) ? 'bg-primary-500' : 'bg-slate-300'}`}></div>
                                                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${(bData.hasNPP || bData.currentSales > 0) ? 'transform translate-x-4' : ''}`}></div>
                                                            </div>
                                                            <span className="ml-2 text-xs font-medium text-slate-600">Đã có NPP</span>
                                                        </label>
                                                    ) : (
                                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${(bData.hasNPP || bData.currentSales > 0) ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-600'}`}>
                                                            {(bData.hasNPP || bData.currentSales > 0) ? 'Đã có NPP' : 'Chưa có'}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {editMode ? (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-xs text-slate-500 mb-1">Chỉ tiêu (VNĐ)</label>
                                                            <input 
                                                                type="number" 
                                                                value={bData.target}
                                                                onChange={(e) => updateBrand(brand, 'target', Number(e.target.value))}
                                                                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-500 mb-1">Doanh số hiện tại (VNĐ)</label>
                                                            <input 
                                                                type="number" 
                                                                value={bData.currentSales}
                                                                onChange={(e) => updateBrand(brand, 'currentSales', Number(e.target.value))}
                                                                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-center mb-1 text-sm">
                                                            <span className="text-slate-500">Chỉ tiêu:</span>
                                                            <span className="font-semibold text-slate-700">{formatVND(bData.target)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center mb-2 text-sm">
                                                            <span className="text-slate-500 flex items-center gap-1"><TrendingUp className="h-3 w-3"/> Thực tế:</span>
                                                            <span className="font-semibold text-blue-600">{formatVND(bData.currentSales)}</span>
                                                        </div>
                                                        
                                                        {/* Progress bar */}
                                                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                                            <div 
                                                                className={`h-1.5 rounded-full ${percent >= 100 ? 'bg-primary-500' : 'bg-blue-500'}`} 
                                                                style={{ width: `${percent}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="text-right mt-1">
                                                            <span className="text-xs font-bold text-slate-500">{percent}%</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                    
                                    {!editMode && (
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-slate-900">Tổng chỉ tiêu:</span>
                                                <span className="text-lg font-black text-slate-800">
                                                    {formatVND(Object.values(currentData.brands).reduce((sum, b) => sum + (b.target || 0), 0))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-blue-700">Tổng thực tế:</span>
                                                <span className="text-lg font-black text-blue-600">
                                                    {formatVND(Object.values(currentData.brands).reduce((sum, b) => sum + (b.currentSales || 0), 0))}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-3">
                                <MapPin className="h-12 w-12 opacity-50" />
                                <p className="text-slate-500">
                                    Di chuột hoặc <strong>nhấn vào</strong> một tỉnh/thành trên bản đồ để xem và thiết lập chỉ tiêu doanh số.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tooltip Overlay */}
            <div 
                ref={tooltipRef}
                className={`fixed z-50 pointer-events-none bg-white rounded-xl shadow-2xl border border-slate-200 w-80 overflow-hidden transition-opacity duration-200 ${
                    hoveredProvince && !selectedProvince ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ left: -999, top: -999, pointerEvents: 'none' }}
            >
                {hoveredProvince && (
                    <>
                        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">{hoveredProvince}</h3>
                            <Map className="h-5 w-5 text-slate-400" />
                        </div>
                    
                    <div className="p-4 space-y-4">
                        {provinceDemographics[hoveredProvince] ? (
                            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1"><MapPin className="h-3 w-3"/> Diện tích</div>
                                    <div className="text-sm font-medium text-slate-800 mt-0.5">{new Intl.NumberFormat('vi-VN').format(provinceDemographics[hoveredProvince].area)} km²</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1"><Users className="h-3 w-3"/> Dân số</div>
                                    <div className="text-sm font-medium text-slate-800 mt-0.5">{new Intl.NumberFormat('vi-VN').format(provinceDemographics[hoveredProvince].population)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1"><Map className="h-3 w-3"/> Đơn vị H/C</div>
                                    <div className="text-sm font-medium text-slate-800 mt-0.5">{provinceDemographics[hoveredProvince].districts} quận/huyện</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1"><DollarSign className="h-3 w-3"/> Thu nhập BQ</div>
                                    <div className="text-sm font-medium text-slate-800 mt-0.5">{provinceDemographics[hoveredProvince].perCapitaIncome} triệu/năm</div>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1"><TrendingUp className="h-3 w-3"/> GDP (GRDP)</div>
                                    <div className="text-sm font-medium text-slate-800 mt-0.5">{new Intl.NumberFormat('vi-VN').format(provinceDemographics[hoveredProvince].gdp)} tỷ VNĐ</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic pb-3 border-b border-slate-100">Đang cập nhật dữ liệu nhân khẩu học...</div>
                        )}
                        
                        <div>
                            {(() => {
                                const provData = getProvinceData(nppData, hoveredProvince);
                                if (provData.telesales) {
                                    return (
                                        <div className="mb-3 pb-3 border-b border-slate-100 flex items-center justify-between">
                                            <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                                                <Users className="h-3 w-3"/> Telesales
                                            </div>
                                            <div className="text-sm font-bold text-primary-700">{provData.telesales}</div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            <div className="text-[10px] text-slate-500 uppercase font-semibold mb-2 flex items-center gap-1"><Briefcase className="h-3 w-3"/> Mục tiêu & Thực tế</div>
                            <div className="space-y-2">
                                {defaultBrands.map(brand => {
                                    const provData = getProvinceData(nppData, hoveredProvince);
                                    const b = provData.brands[brand];
                                    if (!b) return null;
                                    return (
                                        <div key={brand} className="flex flex-col text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`font-medium ${b.hasNPP || b.currentSales > 0 ? 'text-primary-700' : 'text-slate-600'}`}>
                                                    {brand} {b.hasNPP || b.currentSales > 0 ? <CheckCircle2 className="inline h-3 w-3 ml-1" /> : ''}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-400">Thực tế / Mục tiêu</span>
                                                <span className="font-semibold text-slate-800">
                                                    {formatVND(b.currentSales)} / {formatVND(b.target)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="pt-2 mt-2 flex flex-col text-xs">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Tổng doanh số</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400">Thực tế / Mục tiêu</span>
                                        <span className="font-bold text-primary-600 text-sm">
                                            {formatVND(Object.values(getProvinceData(nppData, hoveredProvince).brands).reduce((sum, b) => sum + (b.currentSales || 0), 0))} / {formatVND(Object.values(getProvinceData(nppData, hoveredProvince).brands).reduce((sum, b) => sum + (b.target || 0), 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}
