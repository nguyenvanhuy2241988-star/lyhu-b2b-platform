"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { ShoppingCart, MapPin, Plus, Minus, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Outlet {
    id: string;
    name: string;
    district: string;
}

interface OrderItem {
    product_name: string;
    quantity: number;
    unit: string;
    price: number;
}

export default function CreateOrderPage() {
    const supabase = createClient();
    const searchParams = useSearchParams();
    const preselectedOutlet = searchParams.get("outlet");

    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [items, setItems] = useState<OrderItem[]>([{ product_name: "", quantity: 1, unit: "thùng", price: 0 }]);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('gt_outlets')
            .select('id, name, district')
            .eq('assigned_to', user.id)
            .eq('status', 'active')
            .order('name');

        setOutlets(data || []);
        if (preselectedOutlet) setSelectedOutlet(preselectedOutlet);
        setLoading(false);
    }, [preselectedOutlet]);

    useEffect(() => { loadData(); }, [loadData]);

    function addItem() {
        setItems([...items, { product_name: "", quantity: 1, unit: "thùng", price: 0 }]);
    }

    function removeItem(idx: number) {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== idx));
    }

    function updateItem(idx: number, field: keyof OrderItem, value: any) {
        setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    }

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedOutlet || items.some(i => !i.product_name)) return;
        setSubmitting(true);

        // For now, we just log it. In production, this would create an order in the orders table.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Record order in checkin if there's a recent checkin for this outlet today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        await supabase
            .from('gt_checkins')
            .update({ order_created: true })
            .eq('user_id', user.id)
            .eq('outlet_id', selectedOutlet)
            .gte('check_in_at', todayStart.toISOString());

        setSuccess(true);
        setSubmitting(false);
    }

    if (loading) {
        return <div className="bg-white h-64 rounded-xl border animate-pulse" />;
    }

    if (success) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Đơn hàng đã được ghi nhận!</h2>
                <p className="text-sm text-slate-500 mt-2">{items.length} sản phẩm • {new Intl.NumberFormat("vi-VN").format(totalAmount)}đ</p>
                <div className="flex gap-3 justify-center mt-6">
                    <button onClick={() => { setSuccess(false); setItems([{ product_name: "", quantity: 1, unit: "thùng", price: 0 }]); setNotes(""); }} className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                        Tạo đơn mới
                    </button>
                    <Link href="/sales-gt" className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
                        Về Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900">🛒 Tạo đơn hàng GT</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                {/* Select outlet */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Điểm bán *</label>
                    <select
                        required
                        value={selectedOutlet}
                        onChange={e => setSelectedOutlet(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">Chọn điểm bán...</option>
                        {outlets.map(o => <option key={o.id} value={o.id}>{o.name} — {o.district}</option>)}
                    </select>
                </div>

                {/* Order items */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">Sản phẩm</label>
                        <button type="button" onClick={addItem} className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> Thêm
                        </button>
                    </div>
                    <div className="space-y-2">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex-1">
                                    <input
                                        required
                                        value={item.product_name}
                                        onChange={e => updateItem(idx, "product_name", e.target.value)}
                                        placeholder="Tên sản phẩm"
                                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                                <div className="w-16">
                                    <input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-center focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                                <div className="w-20">
                                    <select
                                        value={item.unit}
                                        onChange={e => updateItem(idx, "unit", e.target.value)}
                                        className="w-full px-1 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-teal-500"
                                    >
                                        <option value="thùng">Thùng</option>
                                        <option value="két">Két</option>
                                        <option value="hộp">Hộp</option>
                                        <option value="gói">Gói</option>
                                        <option value="chai">Chai</option>
                                        <option value="lon">Lon</option>
                                    </select>
                                </div>
                                <div className="w-24">
                                    <input
                                        type="number"
                                        min={0}
                                        value={item.price}
                                        onChange={e => updateItem(idx, "price", parseInt(e.target.value) || 0)}
                                        placeholder="Giá"
                                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-right focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                                {items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(idx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                                        <Minus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total */}
                <div className="flex justify-end items-center gap-3 bg-slate-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">Tổng cộng:</span>
                    <span className="text-lg font-bold text-slate-900">{new Intl.NumberFormat("vi-VN").format(totalAmount)}đ</span>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Ghi chú đơn hàng..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 resize-none"
                        rows={2}
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting || !selectedOutlet}
                    className="w-full bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
                >
                    <ShoppingCart className="w-4 h-4" />
                    {submitting ? "Đang xử lý..." : "Tạo đơn hàng"}
                </button>
            </form>
        </div>
    );
}
