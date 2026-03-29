"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { Wrench, Camera, AlertTriangle, CheckCircle, XCircle, Settings } from "lucide-react";

const EQUIPMENT_TYPES: Record<string, string> = {
    camera: "📷 Camera",
    lens: "🔎 Ống kính",
    light: "💡 Đèn",
    tripod: "📐 Chân máy",
    backdrop: "🎨 Phông nền",
    other: "📦 Khác",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    available: { label: "Sẵn sàng", color: "bg-green-100 text-green-700" },
    in_use: { label: "Đang dùng", color: "bg-blue-100 text-blue-700" },
    maintenance: { label: "Bảo trì", color: "bg-amber-100 text-amber-700" },
    retired: { label: "Ngưng dùng", color: "bg-slate-100 text-slate-500" },
};

const CONDITION_CONFIG: Record<string, { label: string; color: string }> = {
    excellent: { label: "Rất tốt", color: "text-green-600" },
    good: { label: "Tốt", color: "text-blue-600" },
    fair: { label: "Trung bình", color: "text-amber-600" },
    needs_repair: { label: "Cần sửa", color: "text-red-600" },
};

export default function MediaEquipmentPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const [equipment, setEquipment] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    const loadEquipment = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("media_equipment")
                .select("*")
                .order("equipment_type", { ascending: true })
                .order("name", { ascending: true });

            if (filter !== "all") {
                query = query.eq("status", filter);
            }

            const { data } = await query;
            setEquipment(data || []);
        } catch (err) {
            console.error("loadEquipment error:", err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { loadEquipment(); }, [loadEquipment]);

    const statusCounts = equipment.reduce((acc, eq) => {
        acc[eq.status] = (acc[eq.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Thiết bị</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý camera, ống kính, phụ kiện</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="bg-white p-4 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">{cfg.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{statusCounts[key] || 0}</p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {[{ key: "all", label: "Tất cả" }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(opt => (
                    <button key={opt.key} onClick={() => setFilter(opt.key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === opt.key ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-20 rounded-xl border border-slate-200 animate-pulse" />
                    ))}
                </div>
            ) : equipment.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500 font-medium">Chưa có thiết bị nào</p>
                    <p className="text-xs text-slate-400 mt-1">Admin sẽ thêm thiết bị tại đây</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-left border-b border-slate-100">
                                <th className="p-3 text-xs font-medium text-slate-500">Thiết bị</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Loại</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Hãng / Model</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Tình trạng</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Trạng thái</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Serial</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {equipment.map(eq => {
                                const status = STATUS_CONFIG[eq.status] || STATUS_CONFIG.available;
                                const condition = CONDITION_CONFIG[eq.condition] || CONDITION_CONFIG.good;
                                return (
                                    <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-medium text-slate-900">{eq.name}</td>
                                        <td className="p-3 text-slate-500">{EQUIPMENT_TYPES[eq.equipment_type] || eq.equipment_type}</td>
                                        <td className="p-3 text-slate-500">{[eq.brand, eq.model].filter(Boolean).join(" ") || "-"}</td>
                                        <td className="p-3">
                                            <span className={`text-xs font-medium ${condition.color}`}>{condition.label}</span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                                        </td>
                                        <td className="p-3 text-xs text-slate-400 font-mono">{eq.serial_number || "-"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
