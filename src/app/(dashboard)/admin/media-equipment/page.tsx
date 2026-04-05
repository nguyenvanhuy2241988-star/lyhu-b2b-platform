"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Wrench, Plus, Trash2, Pencil, X, Save, FileSignature, UploadCloud } from "lucide-react";
import EquipmentHandoverModal from "@/components/media/EquipmentHandoverModal";

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
    image_url: string | null;
    warranty_info: string | null;
    warranty_expiry: string | null;
    value_amount: number | null;
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
    image_url: "",
    warranty_info: "",
    warranty_expiry: "",
    value_amount: 0,
};

export default function AdminMediaEquipmentPage() {
    const supabase = createClient();

    const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showHandoverModal, setShowHandoverModal] = useState(false);

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
    }, [filter, supabase]);

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
            image_url: item.image_url || "",
            warranty_info: item.warranty_info || "",
            warranty_expiry: item.warranty_expiry || "",
            value_amount: item.value_amount || 0,
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
                image_url: form.image_url.trim() || null,
                warranty_info: form.warranty_info.trim() || null,
                warranty_expiry: form.warranty_expiry || null,
                value_amount: Number(form.value_amount) || 0,
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
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        loadEquipment();
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === equipment.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(equipment.map(e => e.id)));
        }
    };

    const statusCounts = equipment.reduce((acc: Record<string, number>, eq) => {
        acc[eq.status] = (acc[eq.status] || 0) + 1;
        return acc;
    }, {});

    const selectedEquipment = equipment.filter(e => selectedIds.has(e.id));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Quản lý Thiết bị Media</h1>
                    <p className="text-sm text-slate-500 mt-1">Thêm, sửa, xóa thiết bị và lập Biên Bản Bàn Giao</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.size > 0 && (
                        <button onClick={() => setShowHandoverModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors shadow-lg animate-fade-in-up">
                            <FileSignature className="w-4 h-4" /> Biên bản bàn giao ({selectedIds.size})
                        </button>
                    )}
                    <button onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors">
                        <Plus className="w-4 h-4" /> Thêm thiết bị
                    </button>
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
                    <button onClick={openAdd}
                        className="mt-3 text-sm text-pink-600 hover:text-pink-700 font-medium">
                        + Thêm thiết bị đầu tiên
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-left border-b border-slate-100">
                                <th className="p-3 text-center w-12">
                                    <input type="checkbox" 
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        checked={equipment.length > 0 && selectedIds.size === equipment.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="p-3 text-xs font-medium text-slate-500 w-16">Ảnh</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Thiết bị</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Loại</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Hãng / Model</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Tình trạng</th>
                                <th className="p-3 text-xs font-medium text-slate-500">Trạng thái</th>
                                <th className="p-3 text-xs font-medium text-slate-500 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {equipment.map(eq => {
                                const status = STATUS_CONFIG[eq.status] || STATUS_CONFIG.available;
                                const condition = CONDITION_CONFIG[eq.condition] || CONDITION_CONFIG.good;
                                const isSelected = selectedIds.has(eq.id);
                                return (
                                    <tr key={eq.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-primary-50/50' : ''}`}>
                                        <td className="p-3 text-center">
                                            <input type="checkbox" 
                                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(eq.id)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <div className="w-10 h-10 rounded border border-slate-200 bg-white overflow-hidden flex items-center justify-center relative shadow-sm">
                                                {eq.image_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={eq.image_url.includes('supabase') ? `/_next/image?url=${encodeURIComponent(eq.image_url)}&w=64&q=75` : eq.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-[10px] text-slate-300">N/A</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <p className="font-bold text-slate-900">{eq.name}</p>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">{eq.serial_number || "Không có Seri"}</p>
                                        </td>
                                        <td className="p-3 text-slate-600">{EQUIPMENT_TYPES[eq.equipment_type] || eq.equipment_type}</td>
                                        <td className="p-3 text-slate-600">{[eq.brand, eq.model].filter(Boolean).join(" ") || "-"}</td>
                                        <td className="p-3">
                                            <span className={`text-xs font-medium ${condition.color}`}>{condition.label}</span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                                        </td>
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
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Handover Modal */}
            {showHandoverModal && selectedEquipment.length > 0 && (
                <EquipmentHandoverModal 
                    items={selectedEquipment} 
                    onClose={() => setShowHandoverModal(false)} 
                />
            )}

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden my-auto">
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingId ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới"}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Row 1 */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Tên thiết bị *</label>
                                    <input className="w-full py-2.5 px-3 rounded-lg border border-slate-200 text-sm font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                        placeholder="VD: Canon EOS R5"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Loại *</label>
                                    <select className="w-full py-2.5 px-3 rounded-lg border border-slate-200 text-sm bg-white font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                        value={form.equipment_type} onChange={e => setForm({ ...form, equipment_type: e.target.value })}>
                                        {Object.entries(EQUIPMENT_TYPES).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Row 2 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Link Ảnh sản phẩm</label>
                                    <input className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm"
                                        placeholder="https://..."
                                        value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Giá trị tài sản (VNĐ)</label>
                                    <input className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-primary-700"
                                        type="number"
                                        placeholder="VD: 50000000"
                                        value={form.value_amount || ''} onChange={e => setForm({ ...form, value_amount: parseInt(e.target.value) || 0 })} />
                                    <p className="text-[10px] text-slate-400 mt-1">Dùng để làm căn cứ đền bù khi bàn giao</p>
                                </div>
                            </div>

                            {/* Row 3 */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Hãng</label>
                                    <input className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm"
                                        placeholder="VD: Canon"
                                        value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Model</label>
                                    <input className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm"
                                        placeholder="VD: EOS R5"
                                        value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Serial Number</label>
                                    <input className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm font-mono text-slate-700"
                                        placeholder="VD: SN123456"
                                        value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
                                </div>
                            </div>
                            
                            {/* Row 4 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Hạn bảo hành</label>
                                    <input className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm"
                                        type="date"
                                        value={form.warranty_expiry} onChange={e => setForm({ ...form, warranty_expiry: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Phiếu / Thông tin BH</label>
                                    <input className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm"
                                        placeholder="Ghi chú bảo hành / Link ảnh..."
                                        value={form.warranty_info} onChange={e => setForm({ ...form, warranty_info: e.target.value })} />
                                </div>
                            </div>

                            {/* Row 5 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Tình trạng vật lý</label>
                                    <select className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm bg-white font-medium"
                                        value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                                        {Object.entries(CONDITION_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Trạng thái sử dụng</label>
                                    <select className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm bg-white font-medium"
                                        value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wide">Ghi chú thêm</label>
                                <textarea className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm" rows={2}
                                    placeholder="Đặc điểm, phụ kiện đi kèm..."
                                    value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button onClick={() => setShowForm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100">Hủy</button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-6 py-2 rounded-lg text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors">
                                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingId ? "Cập nhật thiết bị" : "Lưu thiết bị mới"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
