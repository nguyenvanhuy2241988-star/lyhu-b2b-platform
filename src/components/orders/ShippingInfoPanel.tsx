"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Order, ShippingBox, SHIPPING_CARRIERS, updateOrderShipping,
} from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchUsers, type User } from "@/lib/usersStore";
import {
    Truck, Package, Scale, Ruler, Plus, Trash2, Save, Loader2,
    UserCheck, QrCode, StickyNote, CheckCircle, X
} from "lucide-react";

interface ShippingInfoPanelProps {
    order: Order;
    readOnly?: boolean;
    onSaved?: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export function ShippingInfoPanel({ order, readOnly = false, onSaved }: ShippingInfoPanelProps) {
    const { session } = useAuth();

    const [carrier, setCarrier] = useState(order.shippingCarrier || '');
    const [trackingCode, setTrackingCode] = useState(order.trackingCode || '');
    const [packedBy, setPackedBy] = useState(order.packedBy || '');
    const [boxes, setBoxes] = useState<ShippingBox[]>(order.shippingBoxes || []);
    const [shippingFee, setShippingFee] = useState(order.shippingFee || 0);
    const [shippingNote, setShippingNote] = useState(order.shippingNote || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        fetchUsers(session?.access_token).then(all => {
            setUsers(all.filter(u => ['admin', 'warehouse', 'sale_admin', 'telesales', 'sales', 'shipper'].includes(u.role)));
        });
    }, [session?.access_token]);

    // Sync from order prop
    useEffect(() => {
        setCarrier(order.shippingCarrier || '');
        setTrackingCode(order.trackingCode || '');
        setPackedBy(order.packedBy || '');
        setBoxes(order.shippingBoxes || []);
        setShippingFee(order.shippingFee || 0);
        setShippingNote(order.shippingNote || '');
    }, [order]);

    const totalBoxes = useMemo(() => boxes.reduce((s, b) => s + (b.qty || 1), 0), [boxes]);
    const totalWeight = useMemo(() => boxes.reduce((s, b) => s + ((b.qty || 1) * (b.weight_kg || 0)), 0), [boxes]);

    const addBox = () => setBoxes([...boxes, { qty: 1, weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0 }]);
    const removeBox = (idx: number) => setBoxes(boxes.filter((_, i) => i !== idx));
    const updateBox = (idx: number, field: keyof ShippingBox, value: number) => {
        const updated = [...boxes];
        updated[idx] = { ...updated[idx], [field]: value };
        setBoxes(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        const result = await updateOrderShipping(order.id, {
            shippingCarrier: carrier,
            trackingCode,
            packedBy: packedBy || undefined,
            shippingBoxes: boxes,
            totalBoxes,
            totalWeightKg: totalWeight,
            shippingFee,
            shippingNote,
        }, session?.access_token);

        setSaving(false);
        if (result.success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            onSaved?.();
        } else {
            alert("Lỗi lưu thông tin vận chuyển");
        }
    };

    const carrierLabel = SHIPPING_CARRIERS.find(c => c.value === carrier)?.label || carrier;

    // Read-only view
    if (readOnly) {
        const hasData = carrier || trackingCode || boxes.length > 0 || order.packedByName;
        if (!hasData) return (
            <div className="text-center py-6 text-slate-400 text-sm">
                Chưa có thông tin vận chuyển.
            </div>
        );
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {carrier && (
                        <div>
                            <p className="text-xs text-slate-400 mb-0.5">Đơn vị vận chuyển</p>
                            <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-slate-400" /> {carrierLabel}
                            </p>
                        </div>
                    )}
                    {trackingCode && (
                        <div>
                            <p className="text-xs text-slate-400 mb-0.5">Mã vận đơn</p>
                            <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                                <QrCode className="w-3.5 h-3.5 text-slate-400" /> {trackingCode}
                            </p>
                        </div>
                    )}
                    {order.packedByName && (
                        <div>
                            <p className="text-xs text-slate-400 mb-0.5">Người đóng hàng</p>
                            <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-slate-400" /> {order.packedByName}
                            </p>
                        </div>
                    )}
                    {order.shippingFee ? (
                        <div>
                            <p className="text-xs text-slate-400 mb-0.5">Phí vận chuyển</p>
                            <p className="text-sm font-semibold text-slate-900">{fmt(order.shippingFee)}</p>
                        </div>
                    ) : null}
                </div>
                {boxes.length > 0 && (
                    <div>
                        <p className="text-xs text-slate-400 mb-2">Thùng hàng ({totalBoxes} thùng · {totalWeight.toFixed(1)} kg)</p>
                        <div className="space-y-1.5">
                            {boxes.map((b, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                                    <span className="font-semibold text-slate-900">Thùng {i + 1}</span>
                                    <span>{b.weight_kg} kg</span>
                                    <span>{b.length_cm} × {b.width_cm} × {b.height_cm} cm</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {shippingNote && (
                    <div>
                        <p className="text-xs text-slate-400 mb-0.5">Ghi chú</p>
                        <p className="text-sm text-slate-700">{shippingNote}</p>
                    </div>
                )}
            </div>
        );
    }

    // Editable form
    return (
        <div className="space-y-5">
            {/* Carrier + Tracking */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Đơn vị vận chuyển</label>
                    <select
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                    >
                        <option value="">— Chọn —</option>
                        {SHIPPING_CARRIERS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Mã vận đơn</label>
                    <input
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
                        placeholder="VD: GHTKXYZ123"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                    />
                </div>
            </div>

            {/* Packer + Shipping Fee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Người đóng hàng</label>
                    <select
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
                        value={packedBy}
                        onChange={(e) => setPackedBy(e.target.value)}
                    >
                        <option value="">— Chọn —</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Phí vận chuyển (VNĐ)</label>
                    <input
                        type="number"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
                        placeholder="0"
                        value={shippingFee || ''}
                        onChange={(e) => setShippingFee(Number(e.target.value))}
                    />
                </div>
            </div>

            {/* Boxes */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        Thùng hàng
                        {totalBoxes > 0 && (
                            <span className="text-slate-400 font-normal ml-1">
                                ({totalBoxes} thùng · {totalWeight.toFixed(1)} kg)
                            </span>
                        )}
                    </label>
                    <button
                        onClick={addBox}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Plus className="w-3 h-3" /> Thêm thùng
                    </button>
                </div>
                {boxes.length === 0 ? (
                    <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                        Chưa có thùng nào. Nhấn "Thêm thùng" để bắt đầu.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {boxes.map((box, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg">
                                <span className="text-xs font-semibold text-slate-500 w-16 shrink-0">Thùng {idx + 1}</span>
                                <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                                    <div className="flex items-center gap-1">
                                        <Scale className="w-3 h-3 text-slate-400" />
                                        <input type="number" step="0.1" placeholder="kg" className="w-16 px-1.5 py-1 border border-slate-200 rounded text-xs text-center"
                                            value={box.weight_kg || ''} onChange={(e) => updateBox(idx, 'weight_kg', Number(e.target.value))} />
                                        <span className="text-[10px] text-slate-400">kg</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Ruler className="w-3 h-3 text-slate-400" />
                                        <input type="number" placeholder="D" className="w-12 px-1 py-1 border border-slate-200 rounded text-xs text-center"
                                            value={box.length_cm || ''} onChange={(e) => updateBox(idx, 'length_cm', Number(e.target.value))} />
                                        <span className="text-[10px] text-slate-400">×</span>
                                        <input type="number" placeholder="R" className="w-12 px-1 py-1 border border-slate-200 rounded text-xs text-center"
                                            value={box.width_cm || ''} onChange={(e) => updateBox(idx, 'width_cm', Number(e.target.value))} />
                                        <span className="text-[10px] text-slate-400">×</span>
                                        <input type="number" placeholder="C" className="w-12 px-1 py-1 border border-slate-200 rounded text-xs text-center"
                                            value={box.height_cm || ''} onChange={(e) => updateBox(idx, 'height_cm', Number(e.target.value))} />
                                        <span className="text-[10px] text-slate-400">cm</span>
                                    </div>
                                </div>
                                <button onClick={() => removeBox(idx)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Shipping Note */}
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Ghi chú vận chuyển</label>
                <textarea
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors resize-none"
                    rows={2}
                    placeholder="VD: Hàng dễ vỡ, cần đóng gói cẩn thận"
                    value={shippingNote}
                    onChange={(e) => setShippingNote(e.target.value)}
                />
            </div>

            {/* Approval Info (Read-only display) */}
            {order.approvedByName && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Duyệt bởi <strong>{order.approvedByName}</strong> lúc {order.approvedAt ? new Date(order.approvedAt).toLocaleString('vi-VN') : ''}</span>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                    ) : saved ? (
                        <><CheckCircle className="w-4 h-4" /> Đã lưu!</>
                    ) : (
                        <><Save className="w-4 h-4" /> Lưu thông tin vận chuyển</>
                    )}
                </button>
            </div>
        </div>
    );
}
