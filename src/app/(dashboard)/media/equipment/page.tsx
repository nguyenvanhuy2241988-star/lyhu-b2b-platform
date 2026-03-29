"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { Wrench, Plus, Trash2, Pencil, X, Save } from "lucide-react";

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

interface EquipmentItem {
    id: string;
    name: string;
    equipment_type: string;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    status: string;
    condition: string;
    notes: string | null;
    created_at: string;
}

const EMPTY_FORM = {
    name: "",
    equipment_type: "camera",
    brand: "",
    model: "",
    serial_number: "",
    status: "available",
    condition: "good",
    notes: "",
};

export default function MediaEquipmentPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin" || user?.role === "sale_admin";

    const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

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
            setEquipment((data as EquipmentItem[]) || []);
        } catch (err) {
            console.error("loadEquipment error:", err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { loadEquipment(); }, [loadEquipment]);

    const openAdd = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (item: EquipmentItem) => {
        setEditingId(item.id);
        setForm({
            name: item.name,
            equipment_type: item.equipment_type,
            brand: item.brand || "",
            model: item.model || "",
            serial_number: item.serial_number || "",
            status: item.status,
            condition: item.condition,
            notes: item.notes || "",
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { alert("Vui lòng nhập tên thiết bị"); return; }
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                equipment_type: form.equipment_type,
                brand: form.brand.trim() || null,
                model: form.model.trim() || null,
                serial_number: form.serial_number.trim() || null,
                status: form.status,
                condition: form.condition,
                notes: form.notes.trim() || null,
            };

            if (editingId) {
                await supabase.from("media_equipment").update(payload).eq("id", editingId);
            } else {
                await supabase.from("media_equipment").insert(payload);
            }
            setShowForm(false);
            loadEquipment();
        } catch (err) {
            console.error("handleSave error:", err);
            alert("Lỗi khi lưu thiết bị");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Xóa thiết bị "${name}"?`)) return;
        await supabase.from("media_equipment").delete().eq("id", id);
        loadEquipment();
    };

    const statusCounts = equipment.reduce((acc: Record<string, number>, eq) => {
        acc[eq.status] = (acc[eq.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Thiết bị</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý camera, ống kính, phụ kiện</p>
                </div>
                {isAdmin && (
                    <button onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors">
                        <Plus className="w-4 h-4" /> Thêm thiết bị
                    </button>
                )}
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
                    {isAdmin && (
                        <button onClick={openAdd}
                            className="mt-3 text-sm text-pink-600 hover:text-pink-700 font-medium">
                            + Thêm thiết bị đầu tiên
                        </button>
                    )}
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
                                {isAdmin && <th className="p-3 text-xs font-medium text-slate-500 text-center">Thao tác</th>}
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
                                        {isAdmin && (
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => openEdit(eq)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(eq.id, eq.name)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingId ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới"}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-500 block mb-1">Tên thiết bị *</label>
                                <input className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm"
                                    placeholder="VD: Canon EOS R5"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-1">Loại</label>
                                    <select className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                                        value={form.equipment_type} onChange={e => setForm({ ...form, equipment_type: e.target.value })}>
                                        {Object.entries(EQUIPMENT_TYPES).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-1">Trạng thái</label>
                                    <select className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                                        value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-1">Hãng</label>
                                    <input className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm"
                                        placeholder="VD: Canon"
                                        value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-1">Model</label>
                                    <input className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm"
                                        placeholder="VD: EOS R5"
                                        value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-1">Serial Number</label>
                                    <input className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm font-mono"
                                        placeholder="VD: SN123456"
                                        value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 block mb-1">Tình trạng</label>
                                    <select className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                                        value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                                        {Object.entries(CONDITION_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 block mb-1">Ghi chú</label>
                                <textarea className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm" rows={2}
                                    placeholder="Ghi chú thêm..."
                                    value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setShowForm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100">Hủy</button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-5 py-2 rounded-lg text-sm font-medium bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2">
                                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingId ? "Cập nhật" : "Thêm thiết bị"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
