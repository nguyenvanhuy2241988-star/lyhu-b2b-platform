'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabaseClient';
import {
    fetchQuotes, createQuote, updateQuote, deleteQuote, convertQuoteToOrder,
    type Quote, type QuoteItem, type QuoteStatus,
    QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS
} from '@/lib/quotesStore';
import { loadProducts } from '@/lib/supabase/products';
import {
    Plus, Search, FileText, Trash2, Edit, CheckCircle, XCircle,
    Send, ArrowRight, ShoppingCart, Loader2, Eye, Copy,
    Calculator, Calendar, Clock, Package
} from 'lucide-react';

const fmtPrice = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';
const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function SaleAdminQuotesPage() {
    const { user, session } = useAuth();
    const supabase = createClient();
    const token = session?.access_token;

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [q, p] = await Promise.all([
                fetchQuotes(token),
                loadProducts(token),
            ]);
            setQuotes(q);
            setProducts(p || []);
        } catch (err) {
            console.error('[Quotes] Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
        const channel = supabase
            .channel('quotes_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => loadData())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [loadData]);

    const filteredQuotes = useMemo(() =>
        quotes.filter(q => {
            const matchStatus = statusFilter === 'all' || q.status === statusFilter;
            const term = searchTerm.toLowerCase();
            const matchSearch = !term ||
                q.customer_name.toLowerCase().includes(term) ||
                q.readable_id.toString().includes(term) ||
                (q.customer_phone || '').includes(term);
            return matchStatus && matchSearch;
        })
    , [quotes, statusFilter, searchTerm]);

    const statusCounts = useMemo(() => {
        const c: Record<string, number> = {};
        quotes.forEach(q => { c[q.status] = (c[q.status] || 0) + 1; });
        return c;
    }, [quotes]);

    const handleConvert = async (quote: Quote) => {
        if (!user?.id) { alert('Vui lòng đăng nhập lại'); return; }
        if (!window.confirm(`Chuyển báo giá #${quote.readable_id} thành đơn hàng?`)) return;
        const orderId = await convertQuoteToOrder(quote, user.id, token);
        if (orderId) {
            alert(`✅ Đã tạo đơn hàng thành công!`);
            loadData();
        } else {
            alert('❌ Lỗi khi tạo đơn hàng');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xóa báo giá này?')) return;
        await deleteQuote(id);
        loadData();
    };

    const handleStatusChange = async (id: string, status: QuoteStatus) => {
        await updateQuote(id, { status });
        loadData();
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Báo giá</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Tạo và quản lý báo giá cho khách hàng</p>
                </div>
                <button
                    onClick={() => { setIsCreating(true); setEditingQuote(null); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Tạo báo giá
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Tổng', count: quotes.length, color: 'text-slate-700' },
                    { label: 'Nháp', count: statusCounts['draft'] || 0, color: 'text-slate-500' },
                    { label: 'Đã gửi', count: statusCounts['sent'] || 0, color: 'text-blue-600' },
                    { label: 'Chấp nhận', count: statusCounts['accepted'] || 0, color: 'text-emerald-600' },
                    { label: 'Từ chối', count: statusCounts['rejected'] || 0, color: 'text-red-600' },
                    { label: 'Đã chuyển', count: statusCounts['converted'] || 0, color: 'text-primary-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                        <p className={`text-lg font-extrabold ${s.color} mt-0.5`}>{isLoading ? '—' : s.count}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'all' as const, label: 'Tất cả' },
                        ...(['draft', 'sent', 'accepted', 'rejected', 'converted'] as QuoteStatus[]).map(s => ({
                            value: s, label: QUOTE_STATUS_LABELS[s],
                        })),
                    ].map(f => (
                        <button
                            key={f.value}
                            onClick={() => setStatusFilter(f.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                statusFilter === f.value
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm báo giá..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3 text-left font-medium">Mã</th>
                                <th className="px-5 py-3 text-left font-medium">Khách hàng</th>
                                <th className="px-5 py-3 text-left font-medium">Sản phẩm</th>
                                <th className="px-5 py-3 text-right font-medium">Tổng tiền</th>
                                <th className="px-5 py-3 text-center font-medium">Trạng thái</th>
                                <th className="px-5 py-3 text-left font-medium">Ngày tạo</th>
                                <th className="px-5 py-3 text-right font-medium">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Đang tải...
                                </td></tr>
                            ) : filteredQuotes.length === 0 ? (
                                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                                    Chưa có báo giá nào
                                </td></tr>
                            ) : filteredQuotes.map(q => (
                                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3 font-bold text-slate-800">#{q.readable_id}</td>
                                    <td className="px-5 py-3">
                                        <p className="font-semibold text-slate-800">{q.customer_name}</p>
                                        {q.customer_phone && <p className="text-xs text-slate-400">{q.customer_phone}</p>}
                                    </td>
                                    <td className="px-5 py-3 text-slate-600">{q.items.length} sản phẩm</td>
                                    <td className="px-5 py-3 text-right font-bold text-slate-800">{fmtPrice(q.total)}</td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${QUOTE_STATUS_COLORS[q.status]}`}>
                                            {QUOTE_STATUS_LABELS[q.status]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500 text-xs">{fmtDate(q.created_at)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button onClick={() => { setEditingQuote(q); setIsCreating(true); }}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            {q.status === 'draft' && (
                                                <button onClick={() => handleStatusChange(q.id, 'sent')}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Gửi">
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            )}
                                            {q.status === 'sent' && (
                                                <>
                                                    <button onClick={() => handleStatusChange(q.id, 'accepted')}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Chấp nhận">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleStatusChange(q.id, 'rejected')}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Từ chối">
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {q.status === 'accepted' && (
                                                <button onClick={() => handleConvert(q)}
                                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Chuyển thành đơn">
                                                    <ShoppingCart className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(q.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isCreating && (
                <QuoteEditorModal
                    quote={editingQuote}
                    products={products}
                    userId={user?.id || ''}
                    userName={user?.user_metadata?.name || user?.email || ''}
                    onSave={async (data) => {
                        setSaving(true);
                        if (editingQuote) {
                            await updateQuote(editingQuote.id, data);
                        } else {
                            await createQuote(data, token);
                        }
                        setSaving(false);
                        setIsCreating(false);
                        setEditingQuote(null);
                        loadData();
                    }}
                    onClose={() => { setIsCreating(false); setEditingQuote(null); }}
                    saving={saving}
                />
            )}
        </div>
    );
}

// ========== QUOTE EDITOR MODAL ==========
function QuoteEditorModal({
    quote, products, userId, userName, onSave, onClose, saving
}: {
    quote: Quote | null;
    products: any[];
    userId: string;
    userName: string;
    onSave: (data: Partial<Quote>) => Promise<void>;
    onClose: () => void;
    saving: boolean;
}) {
    const [customerName, setCustomerName] = useState(quote?.customer_name || '');
    const [customerPhone, setCustomerPhone] = useState(quote?.customer_phone || '');
    const [customerAddress, setCustomerAddress] = useState(quote?.customer_address || '');
    const [items, setItems] = useState<QuoteItem[]>(quote?.items || []);
    const [discountAmount, setDiscountAmount] = useState(quote?.discount_amount || 0);
    const [vatPercent, setVatPercent] = useState(quote?.vat_percent || 0);
    const [shippingFee, setShippingFee] = useState(quote?.shipping_fee || 0);
    const [notes, setNotes] = useState(quote?.notes || '');
    const [validUntil, setValidUntil] = useState(quote?.valid_until ? quote.valid_until.split('T')[0] : '');

    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const vatAmount = subtotal * vatPercent / 100;
    const total = subtotal - discountAmount + vatAmount + shippingFee;

    const addProduct = (productId: string) => {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;
        setItems(prev => [...prev, {
            productId: prod.id,
            name: prod.name || prod.title || '',
            sku: prod.sku || '',
            quantity: 1,
            unitPrice: prod.price || 0,
            subtotal: prod.price || 0,
        }]);
    };

    const updateItem = (idx: number, field: keyof QuoteItem, value: any) => {
        setItems(prev => prev.map((item, i) => {
            if (i !== idx) return item;
            const updated = { ...item, [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                updated.subtotal = (updated.quantity || 0) * (updated.unitPrice || 0);
            }
            return updated;
        }));
    };

    const removeItem = (idx: number) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = () => {
        if (!customerName.trim()) { alert('Vui lòng nhập tên khách hàng'); return; }
        if (items.length === 0) { alert('Vui lòng thêm ít nhất 1 sản phẩm'); return; }
        onSave({
            customer_name: customerName.trim(),
            customer_phone: customerPhone || undefined,
            customer_address: customerAddress || undefined,
            items,
            subtotal,
            discount_amount: discountAmount,
            vat_percent: vatPercent,
            shipping_fee: shippingFee,
            total: Math.max(total, 0),
            notes: notes || undefined,
            valid_until: validUntil ? new Date(validUntil).toISOString() : undefined,
            status: quote?.status || 'draft',
            created_by: userId,
            creator_name: userName,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[800px] max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary-500" />
                        {quote ? `Sửa báo giá #${quote.readable_id}` : 'Tạo báo giá mới'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Customer */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Thông tin khách hàng</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="text" placeholder="Tên khách hàng *" value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                            />
                            <input
                                type="text" placeholder="Số điện thoại" value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value)}
                                className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                            />
                            <input
                                type="text" placeholder="Địa chỉ" value={customerAddress}
                                onChange={e => setCustomerAddress(e.target.value)}
                                className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                            />
                        </div>
                    </div>

                    {/* Products */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sản phẩm</h3>
                            <select
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-600 bg-white"
                                value=""
                                onChange={e => { if (e.target.value) addProduct(e.target.value); e.target.value = ''; }}
                            >
                                <option value="">+ Thêm sản phẩm</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name || p.title} — {fmtPrice(p.price || 0)}</option>
                                ))}
                            </select>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-8 text-slate-300 border-2 border-dashed border-slate-200 rounded-xl">
                                <Package className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">Chọn sản phẩm từ danh sách</p>
                            </div>
                        ) : (
                            <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Sản phẩm</th>
                                        <th className="px-3 py-2 text-center font-semibold text-slate-600 w-20">SL</th>
                                        <th className="px-3 py-2 text-right font-semibold text-slate-600 w-28">Đơn giá</th>
                                        <th className="px-3 py-2 text-right font-semibold text-slate-600 w-28">Thành tiền</th>
                                        <th className="px-3 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text" value={item.name}
                                                    onChange={e => updateItem(idx, 'name', e.target.value)}
                                                    className="w-full bg-transparent font-semibold text-slate-800 outline-none"
                                                />
                                                {item.sku && <span className="text-[10px] text-slate-400">SKU: {item.sku}</span>}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <input
                                                    type="number" min="1" value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="w-16 text-center bg-slate-50 border border-slate-200 rounded px-1 py-1 font-bold outline-none focus:border-primary-400"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <input
                                                    type="number" value={item.unitPrice}
                                                    onChange={e => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                                                    className="w-24 text-right bg-slate-50 border border-slate-200 rounded px-1 py-1 font-semibold outline-none focus:border-primary-400"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-slate-800">{fmtPrice(item.subtotal)}</td>
                                            <td className="px-3 py-2">
                                                <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-[300px] space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Tạm tính</span>
                                <span className="font-semibold">{fmtPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Chiết khấu</span>
                                <input
                                    type="number" value={discountAmount}
                                    onChange={e => setDiscountAmount(parseInt(e.target.value) || 0)}
                                    className="w-28 text-right bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold outline-none focus:border-primary-400"
                                />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">VAT (%)</span>
                                <input
                                    type="number" value={vatPercent} min="0" max="100"
                                    onChange={e => setVatPercent(parseInt(e.target.value) || 0)}
                                    className="w-20 text-right bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold outline-none focus:border-primary-400"
                                />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Phí vận chuyển</span>
                                <input
                                    type="number" value={shippingFee}
                                    onChange={e => setShippingFee(parseInt(e.target.value) || 0)}
                                    className="w-28 text-right bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold outline-none focus:border-primary-400"
                                />
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-300 text-base">
                                <span className="font-bold text-slate-800">TỔNG</span>
                                <span className="font-extrabold text-primary-700">{fmtPrice(Math.max(total, 0))}</span>
                            </div>
                        </div>
                    </div>

                    {/* Extra */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Hiệu lực đến</label>
                            <input
                                type="date" value={validUntil}
                                onChange={e => setValidUntil(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Ghi chú</label>
                            <textarea
                                value={notes} onChange={e => setNotes(e.target.value)}
                                rows={2} placeholder="Ghi chú cho báo giá..."
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                        {quote ? 'Cập nhật' : 'Tạo báo giá'}
                    </button>
                </div>
            </div>
        </div>
    );
}
