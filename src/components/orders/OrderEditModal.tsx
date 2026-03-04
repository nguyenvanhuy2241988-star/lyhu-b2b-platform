"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Save, Loader2, Plus, Trash2, Search, Package, Truck, Scale, Ruler, UserCheck, QrCode, CheckCircle } from "lucide-react";
import { Order, OrderItem, ShippingBox, SHIPPING_CARRIERS, updateOrderSupabase, updateOrderShipping } from "@/lib/ordersStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { Product } from "@/mocks/data";
import { loadProducts } from "@/lib/supabase/products";
import { fetchUsers, type User } from "@/lib/usersStore";

interface OrderEditModalProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    shippingOnly?: boolean; // Only show shipping section (for warehouse role)
}

export function OrderEditModal({ order, isOpen, onClose, onSuccess, shippingOnly = false }: OrderEditModalProps) {
    const { session, user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [customerName, setCustomerName] = useState("");
    const [receiverPhone, setReceiverPhone] = useState("");
    const [receiverAddress, setReceiverAddress] = useState("");
    const [note, setNote] = useState("");
    const [items, setItems] = useState<OrderItem[]>([]);

    // Product Search State
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Shipping State
    const [carrier, setCarrier] = useState('');
    const [trackingCode, setTrackingCode] = useState('');
    const [packedBy, setPackedBy] = useState('');
    const [boxes, setBoxes] = useState<ShippingBox[]>([]);
    const [shippingFee, setShippingFee] = useState(0);
    const [shippingNote, setShippingNote] = useState('');
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        if (order) {
            setCustomerName(order.customerName || "");
            setReceiverPhone(order.receiverPhone || "");
            setReceiverAddress(order.receiverAddress || "");
            setNote(order.note || order.notes || "");
            setItems(JSON.parse(JSON.stringify(order.items || [])));
            // Shipping
            setCarrier(order.shippingCarrier || '');
            setTrackingCode(order.trackingCode || '');
            setPackedBy(order.packedBy || '');
            setBoxes((order.shippingBoxes || []).map((b: any) => ({ ...b, qty: b.qty || 1 })));
            setShippingFee(order.shippingFee || 0);
            setShippingNote(order.shippingNote || '');
        }
    }, [order]);

    useEffect(() => {
        if (isAddingProduct && products.length === 0) {
            setIsLoadingProducts(true);
            loadProducts(session?.access_token).then(setProducts).finally(() => setIsLoadingProducts(false));
        }
    }, [isAddingProduct, session?.access_token]);

    useEffect(() => {
        if (isOpen) {
            fetchUsers(session?.access_token).then((all: User[]) => {
                setUsers(all.filter((u: User) => ['admin', 'warehouse', 'sale_admin', 'telesales', 'sales', 'shipper'].includes(u.role)));
            });
        }
    }, [isOpen, session?.access_token]);

    const totalBoxes = useMemo(() => boxes.reduce((s, b) => s + (b.qty || 1), 0), [boxes]);
    const totalWeight = useMemo(() => boxes.reduce((s, b) => s + ((b.qty || 1) * (b.weight_kg || 0)), 0), [boxes]);

    const addBox = () => setBoxes([...boxes, { qty: 1, weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0 }]);
    const removeBox = (idx: number) => setBoxes(boxes.filter((_, i) => i !== idx));
    const updateBox = (idx: number, field: keyof ShippingBox, value: number) => {
        const updated = [...boxes];
        updated[idx] = { ...updated[idx], [field]: value };
        setBoxes(updated);
    };

    if (!isOpen || !order) return null;

    const handleSave = async () => {
        if (!shippingOnly && !items.length) {
            alert("Đơn hàng phải có ít nhất 1 sản phẩm");
            return;
        }

        setIsSaving(true);
        try {
            let orderResult: { success: boolean; error?: string } = { success: true };

            // 1. Save order info (customer + items) - only if not shippingOnly
            if (!shippingOnly) {
                const totalAmount = items.reduce((sum, item) => {
                    const price = item.price || item.unitPrice || 0;
                    const discount = item.discount || 0;
                    return sum + (price * item.quantity) - discount;
                }, 0);

                orderResult = await updateOrderSupabase(
                    order.id,
                    { customerName, receiverPhone, receiverAddress, note, items, totalAmount },
                    session?.access_token
                );
            }

            // 2. Save shipping info (always)
            const shippingResult = await updateOrderShipping(order.id, {
                shippingCarrier: carrier,
                trackingCode,
                packedBy: packedBy || undefined,
                shippingBoxes: boxes,
                totalBoxes,
                totalWeightKg: totalWeight,
                shippingFee,
                shippingNote,
            }, session?.access_token);

            if (orderResult.success && shippingResult.success) {
                alert("✅ Cập nhật thành công!");
                onSuccess();
                onClose();
            } else {
                const errors = [];
                if (!orderResult.success) errors.push("Thông tin đơn: " + orderResult.error);
                if (!shippingResult.success) errors.push("Vận chuyển: " + shippingResult.error);
                alert("Lỗi:\n" + errors.join("\n"));
            }

        } catch (e: any) {
            console.error(e);
            alert("Có lỗi xảy ra: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddItem = (product: Product) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                sku: product.sku,
                quantity: 1,
                price: product.wholesalePrice || 0,
                unitPrice: product.wholesalePrice || 0,
                discount: 0
            }];
        });
        setIsAddingProduct(false);
        setSearchTerm("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">
                        {shippingOnly ? `Vận chuyển #${order.readableId}` : `Sửa đơn hàng #${order.readableId}`}
                    </h2>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Customer Info - hide in shippingOnly mode */}
                    {!shippingOnly && (
                        <div className="bg-slate-50 p-4 rounded-lg flex flex-col gap-3">
                            <h3 className="font-semibold text-sm">Thông tin khách hàng</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Tên khách</label>
                                    <input className="w-full p-2 border rounded" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">Số điện thoại</label>
                                    <input className="w-full p-2 border rounded" value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-slate-500">Địa chỉ</label>
                                    <input className="w-full p-2 border rounded" value={receiverAddress} onChange={e => setReceiverAddress(e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-slate-500">Ghi chú</label>
                                    <textarea className="w-full p-2 border rounded" rows={2} value={note} onChange={e => setNote(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items - hide in shippingOnly mode */}
                    {!shippingOnly && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-sm">Sản phẩm</h3>
                                <button onClick={() => setIsAddingProduct(!isAddingProduct)} className="text-sm text-blue-600 font-medium flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Thêm
                                </button>
                            </div>

                            {isAddingProduct && (
                                <div className="mb-3 p-3 bg-white border rounded-lg shadow-sm">
                                    <input
                                        autoFocus
                                        placeholder="Tìm món..."
                                        className="w-full p-2 border rounded mb-2"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    <div className="max-h-40 overflow-y-auto">
                                        {products
                                            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(p => (
                                                <div key={p.id} onClick={() => handleAddItem(p)} className="p-2 hover:bg-slate-50 cursor-pointer text-sm">
                                                    {p.name} - {new Intl.NumberFormat('vi-VN').format(p.wholesalePrice || 0)}đ
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center p-2 border rounded bg-white">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{item.name || "Sản phẩm"}</div>
                                            <div className="text-xs text-slate-500">{new Intl.NumberFormat('vi-VN').format(item.price || item.unitPrice || 0)}đ</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setItems(items.map((i, k) => k === idx ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="px-2 bg-slate-100 rounded">-</button>
                                            <span className="w-4 text-center text-sm">{item.quantity}</span>
                                            <button onClick={() => setItems(items.map((i, k) => k === idx ? { ...i, quantity: i.quantity + 1 } : i))} className="px-2 bg-slate-100 rounded">+</button>
                                        </div>
                                        <button onClick={() => setItems(items.filter((_, k) => k !== idx))} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Shipping & Packing Section */}
                    <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                        <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-slate-500" />
                            <h3 className="font-semibold text-sm">Thông tin vận chuyển & đóng hàng</h3>
                        </div>

                        {/* Carrier + Tracking */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-500">Đơn vị vận chuyển</label>
                                <select className="w-full p-2 border rounded text-sm" value={carrier} onChange={e => setCarrier(e.target.value)}>
                                    <option value="">— Chọn —</option>
                                    {SHIPPING_CARRIERS.map((c: { value: string; label: string }) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Mã vận đơn</label>
                                <input className="w-full p-2 border rounded text-sm" placeholder="VD: GHTKXYZ123" value={trackingCode} onChange={e => setTrackingCode(e.target.value)} />
                            </div>
                        </div>

                        {/* Packer + Shipping Fee */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-500">Người đóng hàng</label>
                                <select className="w-full p-2 border rounded text-sm" value={packedBy} onChange={e => setPackedBy(e.target.value)}>
                                    <option value="">— Chọn —</option>
                                    {users.map((u: User) => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Phí vận chuyển (VNĐ)</label>
                                <input type="number" className="w-full p-2 border rounded text-sm" placeholder="0" value={shippingFee || ''} onChange={e => setShippingFee(Number(e.target.value))} />
                            </div>
                        </div>

                        {/* Boxes with QTY */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                    <Package className="w-3.5 h-3.5" />
                                    Thùng hàng
                                    {totalBoxes > 0 && <span className="text-slate-400 font-normal ml-1">({totalBoxes} thùng · {totalWeight.toFixed(1)} kg)</span>}
                                </label>
                                <button onClick={addBox} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                                    <Plus className="w-3 h-3" /> Thêm loại thùng
                                </button>
                            </div>
                            {boxes.length === 0 ? (
                                <div className="text-center py-3 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                                    Chưa có thùng nào. Nhấn &quot;Thêm loại thùng&quot; để bắt đầu.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {boxes.map((box, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                                            {/* QTY */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <label className="text-[10px] text-slate-400">SL</label>
                                                <input type="number" min="1" className="w-12 px-1 py-1 border rounded text-xs text-center font-semibold"
                                                    value={box.qty || 1} onChange={e => updateBox(idx, 'qty', Math.max(1, Number(e.target.value)))} />
                                            </div>
                                            <span className="text-slate-300">×</span>
                                            {/* Weight + Dimensions */}
                                            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                                                <div className="flex items-center gap-1">
                                                    <Scale className="w-3 h-3 text-slate-400" />
                                                    <input type="number" step="0.1" placeholder="kg" className="w-14 px-1 py-1 border rounded text-xs text-center"
                                                        value={box.weight_kg || ''} onChange={e => updateBox(idx, 'weight_kg', Number(e.target.value))} />
                                                    <span className="text-[10px] text-slate-400">kg</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Ruler className="w-3 h-3 text-slate-400" />
                                                    <input type="number" placeholder="D" className="w-11 px-1 py-1 border rounded text-xs text-center"
                                                        value={box.length_cm || ''} onChange={e => updateBox(idx, 'length_cm', Number(e.target.value))} />
                                                    <span className="text-[10px] text-slate-400">×</span>
                                                    <input type="number" placeholder="R" className="w-11 px-1 py-1 border rounded text-xs text-center"
                                                        value={box.width_cm || ''} onChange={e => updateBox(idx, 'width_cm', Number(e.target.value))} />
                                                    <span className="text-[10px] text-slate-400">×</span>
                                                    <input type="number" placeholder="C" className="w-11 px-1 py-1 border rounded text-xs text-center"
                                                        value={box.height_cm || ''} onChange={e => updateBox(idx, 'height_cm', Number(e.target.value))} />
                                                    <span className="text-[10px] text-slate-400">cm</span>
                                                </div>
                                            </div>
                                            <button onClick={() => removeBox(idx)} className="p-1 text-slate-400 hover:text-rose-600 shrink-0"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Shipping Note */}
                        <div>
                            <label className="text-xs font-medium text-slate-500">Ghi chú vận chuyển</label>
                            <textarea className="w-full p-2 border rounded text-sm mt-1" rows={2} placeholder="VD: Hàng dễ vỡ, cần đóng gói cẩn thận" value={shippingNote} onChange={e => setShippingNote(e.target.value)} />
                        </div>

                        {/* Approval Info */}
                        {order.approvedByName && (
                            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Duyệt bởi <strong>{order.approvedByName}</strong> lúc {order.approvedAt ? new Date(order.approvedAt).toLocaleString('vi-VN') : ''}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex justify-end gap-2 text-sm bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 border rounded bg-white hover:bg-slate-50">Hủy</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
}
