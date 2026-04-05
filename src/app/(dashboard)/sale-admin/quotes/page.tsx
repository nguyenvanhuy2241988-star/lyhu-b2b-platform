'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabaseClient';
import {
    fetchQuotes, createQuote, updateQuote, deleteQuote, convertQuoteToOrder,
    type Quote, type QuoteItem, type QuoteStatus, type QuoteType,
    QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS
} from '@/lib/quotesStore';
import { loadProducts } from '@/lib/supabase/products';
import QuotePrintView from '@/components/quotes/QuotePrintView';
import {
    Plus, Search, FileText, Trash2, Edit, CheckCircle, XCircle, Check,
    Send, ArrowRight, ShoppingCart, Loader2, Eye, Copy,
    Calculator, Calendar, Clock, Package, PackagePlus, Printer, ImageIcon, UploadCloud
} from 'lucide-react';

const fmtPrice = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';
const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function SaleAdminQuotesPage() {
    const { user, session } = useAuth();
    const supabase = createClient();
    const token = session?.access_token;

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [usersList, setUsersList] = useState<{id: string, full_name: string, email: string, phone: string | null}[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
    const [printingQuote, setPrintingQuote] = useState<Quote | null>(null);
    const [isCreating, setIsCreating] = useState<'order_quote' | 'price_list' | false>(false);
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [q, p, uRes] = await Promise.all([
                fetchQuotes(token),
                loadProducts(token),
                supabase.from('profiles').select('id, full_name, email, phone').order('full_name')
            ]);
            setQuotes(q);
            setProducts(p || []);
            setUsersList(uRes.data || []);
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
                <div className="relative group">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Tạo báo giá
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                        <button onClick={() => { setIsCreating('price_list'); setEditingQuote(null); }} className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-slate-50 text-sm font-semibold text-slate-700">
                            <FileText className="w-4 h-4 text-emerald-600" /> Bảng báo giá chung
                        </button>
                        <div className="h-px bg-slate-100" />
                        <button onClick={() => { setIsCreating('order_quote'); setEditingQuote(null); }} className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-slate-50 text-sm font-semibold text-slate-700">
                            <ShoppingCart className="w-4 h-4 text-blue-600" /> Báo giá đơn hàng
                        </button>
                    </div>
                </div>
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
                                            <button onClick={() => { setEditingQuote(q); setIsCreating(q.quote_type || 'order_quote'); }}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            <button onClick={() => setPrintingQuote(q)}
                                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="In / PDF">
                                                <Printer className="w-4 h-4" />
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

            {/* Print Modal */}
            {printingQuote && (
                <QuotePrintView
                    quote={printingQuote}
                    onClose={() => setPrintingQuote(null)}
                    products={products}
                />
            )}

            {/* Create/Edit Modal */}
            {isCreating && (
                <QuoteEditorModal
                    quote={editingQuote}
                    quoteType={isCreating}
                    products={products}
                    usersList={usersList}
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
    quote, quoteType, products, usersList, userId, userName, onSave, onClose, saving
}: {
    quote: Quote | null;
    quoteType: QuoteType;
    products: any[];
    usersList: {id: string, full_name: string, email: string, phone: string | null}[];
    userId: string;
    userName: string;
    onSave: (data: Partial<Quote>) => Promise<void>;
    onClose: () => void;
    saving: boolean;
}) {
    const isPriceList = quoteType === 'price_list';
    const [customerName, setCustomerName] = useState(quote?.customer_name || (isPriceList ? 'Kính gửi Quý khách hàng' : ''));
    const [customerPhone, setCustomerPhone] = useState(quote?.customer_phone || '');
    const [customerAddress, setCustomerAddress] = useState(quote?.customer_address || '');
    const [items, setItems] = useState<QuoteItem[]>(quote?.items || []);
    const [discountAmount, setDiscountAmount] = useState(quote?.discount_amount || 0);
    const [vatPercent, setVatPercent] = useState(quote?.vat_percent || 0);
    const [shippingFee, setShippingFee] = useState(quote?.shipping_fee || 0);
    const [notes, setNotes] = useState(quote?.notes || '');
    const [terms, setTerms] = useState(quote?.terms || `Giá trên chưa bao gồm phí vận chuyển (nếu có).\nBáo giá có hiệu lực 30 ngày kể từ ngày phát hành.\nThanh toán: Chuyển khoản trước khi giao hàng hoặc COD.\nHàng hóa được đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất.`);
    const [validUntil, setValidUntil] = useState(quote?.valid_until ? quote.valid_until.split('T')[0] : '');
    const [salesName, setSalesName] = useState(quote?.creator_name || userName);
    const [salesPhone, setSalesPhone] = useState(quote?.sales_phone || '');
    const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);

    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const supabaseClient = createClient();

    const uploadFile = async (idx: number, file: File) => {
        try {
            setUploadingIdx(idx);
            const fileExt = file.name?.split('.').pop() || 'png';
            const fileName = `quote_img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('report-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabaseClient.storage
                .from('report-images')
                .getPublicUrl(fileName);

            updateItem(idx, 'imageUrl', data.publicUrl);
        } catch (error: any) {
            alert('Lỗi upload ảnh: ' + error.message);
        } finally {
            setUploadingIdx(null);
        }
    };

    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const vatAmount = subtotal * vatPercent / 100;
    const total = subtotal - discountAmount + vatAmount + shippingFee;

    const handleAddMultipleProducts = (productIds: string[]) => {
        const newItemsToAdd: QuoteItem[] = [];
        for (const productId of productIds) {
            const prod = products.find(p => p.id === productId);
            if (!prod) continue;
            
            const name = prod.name || prod.title || '';
            const detectedCategory = prod.brand || 'SẢN PHẨM KHÁC';

            newItemsToAdd.push({
                productId: prod.id,
                name: name,
                sku: prod.sku || '',
                quantity: 1,
                unitPrice: prod.price || 0,
                subtotal: prod.price || 0,
                imageUrl: prod.image_url || '',
                unit: 'Cái',
                weight: '100g',
                expiry: '12 tháng',
                packSize: '1',
                retailPrice: prod.price || 0,
                wholesalePrice: prod.price || 0,
                category: detectedCategory
            });
        }
        
        setItems(prev => {
            const newItems = [...prev, ...newItemsToAdd];
            if (isPriceList) {
                return newItems.sort((a, b) => (a.category || 'Z').localeCompare(b.category || 'Z'));
            }
            return newItems;
        });
        setIsProductSelectorOpen(false);
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
        if (!isPriceList && !customerName.trim()) { alert('Vui lòng nhập tên khách hàng'); return; }
        if (items.length === 0) { alert('Vui lòng thêm ít nhất 1 sản phẩm'); return; }
        onSave({
            quote_type: quoteType,
            customer_name: customerName.trim() || 'Khách hàng',
            customer_phone: customerPhone || undefined,
            customer_address: customerAddress || undefined,
            items,
            subtotal,
            discount_amount: discountAmount,
            vat_percent: vatPercent,
            shipping_fee: shippingFee,
            total: Math.max(total, 0),
            notes: notes || undefined,
            terms: terms || undefined,
            valid_until: validUntil ? new Date(validUntil).toISOString() : undefined,
            status: quote?.status || 'draft',
            created_by: userId,
            creator_name: salesName,
            sales_phone: salesPhone,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${isPriceList ? 'max-w-[1200px]' : 'max-w-[800px]'} max-h-[90vh] overflow-hidden flex flex-col`}>
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary-500" />
                        {quote ? `Sửa báo giá #${quote.readable_id}` : (isPriceList ? 'Tạo Bảng báo giá chung' : 'Tạo Báo giá đơn hàng')}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1 block">
                    {/* Customer */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Thông tin {isPriceList ? 'tiêu đề' : 'khách hàng'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="text" placeholder={isPriceList ? 'Tiêu đề khách hàng (vd: Kính gửi...)' : 'Tên khách hàng *'} value={customerName}
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
                            <button
                                onClick={() => setIsProductSelectorOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 font-bold text-xs rounded-xl transition-colors border border-primary-200"
                            >
                                <Plus className="w-4 h-4" /> Thêm sản phẩm
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-8 text-slate-300 border-2 border-dashed border-slate-200 rounded-xl">
                                <Package className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">Chọn sản phẩm từ danh sách</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border border-slate-200 rounded-xl min-w-[800px]">
                                    <thead className="bg-slate-50 font-semibold text-slate-600 text-left">
                                        <tr>
                                            {isPriceList && <th className="px-2 py-2.5 w-24 border-b border-slate-200">Hình ảnh (URL)</th>}
                                            <th className="px-3 py-2.5 border-b border-slate-200">Sản phẩm</th>
                                            {isPriceList ? (
                                                <>
                                                    <th className="px-2 py-2.5 border-b border-slate-200 text-center w-16">Đơn vị</th>
                                                    <th className="px-2 py-2.5 border-b border-slate-200 text-center w-16">Tr.lượng</th>
                                                    <th className="px-2 py-2.5 border-b border-slate-200 text-center w-20">HSD</th>
                                                    <th className="px-2 py-2.5 border-b border-slate-200 text-center w-16">QC</th>
                                                    <th className="px-2 py-2.5 border-b border-slate-200 text-right w-24">Giá lẻ</th>
                                                    <th className="px-2 py-2.5 border-b border-slate-200 text-right w-24">Giá sỉ</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-3 py-2.5 border-b border-slate-200 text-center w-20">SL</th>
                                                    <th className="px-3 py-2.5 border-b border-slate-200 text-right w-28">Đơn giá</th>
                                                    <th className="px-3 py-2.5 border-b border-slate-200 text-right w-28">Thành tiền</th>
                                                </>
                                            )}
                                            <th className="px-2 py-2.5 w-10 border-b border-slate-200"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                {isPriceList && (
                                                    <td className="px-2 py-2 align-top">
                                                        <div 
                                                            className={`w-full rounded p-1 border border-dashed transition-all ${dragIdx === idx ? 'border-primary-500 bg-primary-50' : 'border-transparent'}`}
                                                            onDragOver={(e) => { e.preventDefault(); setDragIdx(idx); }}
                                                            onDragLeave={(e) => { e.preventDefault(); setDragIdx(null); }}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                setDragIdx(null);
                                                                const file = e.dataTransfer.files?.[0];
                                                                if (file && file.type.startsWith('image/')) uploadFile(idx, file);
                                                            }}
                                                        >
                                                            <input 
                                                                type="text" 
                                                                placeholder="URL hoặc Ctrl+V ảnh..." 
                                                                value={item.imageUrl || ''} 
                                                                onChange={e => updateItem(idx, 'imageUrl', e.target.value)} 
                                                                onPaste={(e) => {
                                                                    const items = e.clipboardData?.items;
                                                                    if (!items) return;
                                                                    for (const clipItem of Array.from(items)) {
                                                                        if (clipItem.type.startsWith('image/')) {
                                                                            e.preventDefault();
                                                                            const file = clipItem.getAsFile();
                                                                            if (file) uploadFile(idx, file);
                                                                            return;
                                                                        }
                                                                    }
                                                                }}
                                                                className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1.5 outline-none focus:border-primary-400 text-[10px] mb-1"
                                                                disabled={uploadingIdx === idx}
                                                            />
                                                        
                                                            <label title="Kéo thả hoặc dán hình ảnh (Ctrl+V) vào ô URL để tải lên nhanh" className={`cursor-pointer text-[10px] ${uploadingIdx === idx ? 'bg-slate-100 text-slate-400 pointer-events-none' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'} px-2 py-1.5 rounded transition-colors flex items-center justify-center gap-1 font-medium w-full border border-slate-200 shadow-sm`}>
                                                                {uploadingIdx === idx ? <Loader2 className="w-3 h-3 animate-spin text-primary-500"/> : <UploadCloud className="w-3 h-3" />}
                                                                {uploadingIdx === idx ? 'Đang tải...' : 'Upload ảnh'}
                                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                                    if (e.target.files && e.target.files[0]) uploadFile(idx, e.target.files[0]);
                                                                }} />
                                                            </label>
                                                        </div>

                                                        {item.imageUrl && uploadingIdx !== idx && (
                                                            <div className="mt-1 ml-1 h-10 w-10 border border-slate-200 rounded overflow-hidden relative group/img cursor-pointer">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} onClick={() => window.open(item.imageUrl, '_blank')} />
                                                                <button
                                                                    title="Xoá ảnh"
                                                                    className="absolute inset-0 bg-black/50 hidden group-hover/img:flex items-center justify-center text-white transition-opacity"
                                                                    onClick={(e) => { e.stopPropagation(); updateItem(idx, 'imageUrl', ''); }}
                                                                >
                                                                    <Trash2 className="w-3 h-3 text-red-100" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                                <td className="px-3 py-2 align-top">
                                                    <input
                                                        type="text" value={item.name}
                                                        onChange={e => updateItem(idx, 'name', e.target.value)}
                                                        className="w-full font-semibold text-slate-800 outline-none bg-transparent mb-1"
                                                    />
                                                    {isPriceList ? (
                                                        <div className="flex items-center gap-2">
                                                            <input type="text" placeholder="Thương hiệu / Nhóm" value={item.category || ''} onChange={e => updateItem(idx, 'category', e.target.value)} className="w-[120px] bg-transparent border-b border-dashed border-slate-300 text-[10px] text-slate-500 outline-none focus:border-primary-400" />
                                                            <input type="text" placeholder="Mã SKU" value={item.sku || ''} onChange={e => updateItem(idx, 'sku', e.target.value)} className="w-[70px] bg-transparent border-b border-dashed border-slate-300 text-[10px] text-slate-500 outline-none focus:border-primary-400" />
                                                        </div>
                                                    ) : (
                                                        item.sku && <span className="block text-[10px] text-slate-400">SKU: {item.sku}</span>
                                                    )}
                                                </td>
                                                {isPriceList ? (
                                                    <>
                                                        <td className="px-2 py-2 align-top"><input type="text" value={item.unit || ''} onChange={e => updateItem(idx, 'unit', e.target.value)} className="w-full text-center bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-primary-400" placeholder="Gói" /></td>
                                                        <td className="px-2 py-2 align-top"><input type="text" value={item.weight || ''} onChange={e => updateItem(idx, 'weight', e.target.value)} className="w-full text-center bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-primary-400" placeholder="100g" /></td>
                                                        <td className="px-2 py-2 align-top"><input type="text" value={item.expiry || ''} onChange={e => updateItem(idx, 'expiry', e.target.value)} className="w-full text-center bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-primary-400" placeholder="12 tháng" /></td>
                                                        <td className="px-2 py-2 align-top"><input type="text" value={item.packSize || ''} onChange={e => updateItem(idx, 'packSize', e.target.value)} className="w-full text-center bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-primary-400" placeholder="60" /></td>
                                                        <td className="px-2 py-2 align-top"><input type="number" value={item.retailPrice || 0} onChange={e => updateItem(idx, 'retailPrice', parseInt(e.target.value) || 0)} className="w-full text-right bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-primary-400 font-semibold" /></td>
                                                        <td className="px-2 py-2 align-top"><input type="number" value={item.wholesalePrice || 0} onChange={e => updateItem(idx, 'wholesalePrice', parseInt(e.target.value) || 0)} className="w-full text-right bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-primary-400 font-semibold text-primary-600" /></td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-3 py-2 text-center align-top">
                                                            <input
                                                                type="number" min="1" value={item.quantity}
                                                                onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                                className="w-16 text-center bg-slate-50 border border-slate-200 rounded px-1 py-1 font-bold outline-none focus:border-primary-400"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-right align-top">
                                                            <input
                                                                type="number" value={item.unitPrice}
                                                                onChange={e => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                                                                className="w-24 text-right bg-slate-50 border border-slate-200 rounded px-1 py-1 font-semibold outline-none focus:border-primary-400"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-bold text-slate-800 align-top">{fmtPrice(item.subtotal)}</td>
                                                    </>
                                                )}
                                                <td className="px-2 py-2 text-center align-top">
                                                    <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Totals - Only for Order Quote */}
                    {!isPriceList && (
                        <div className="flex justify-end">
                            <div className="w-[300px] space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Tạm tính</span>
                                    <span className="font-semibold">{fmtPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Chiết khấu</span>
                                    <input type="number" value={discountAmount} onChange={e => setDiscountAmount(parseInt(e.target.value) || 0)} className="w-28 text-right bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold outline-none focus:border-primary-400" />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">VAT (%)</span>
                                    <input type="number" value={vatPercent} min="0" max="100" onChange={e => setVatPercent(parseInt(e.target.value) || 0)} className="w-20 text-right bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold outline-none focus:border-primary-400" />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Phí vận chuyển</span>
                                    <input type="number" value={shippingFee} onChange={e => setShippingFee(parseInt(e.target.value) || 0)} className="w-28 text-right bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold outline-none focus:border-primary-400" />
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-300 text-base">
                                    <span className="font-bold text-slate-800">TỔNG</span>
                                    <span className="font-extrabold text-primary-700">{fmtPrice(Math.max(total, 0))}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Extra */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Hiệu lực đến</label>
                            <input
                                type="date" value={validUntil}
                                onChange={e => setValidUntil(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Ghi chú (Nội bộ / Thêm)</label>
                            <textarea
                                value={notes} onChange={e => setNotes(e.target.value)}
                                rows={2} placeholder="Ghi chú thêm..."
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="text-xs font-bold text-slate-500 mb-1 block flex justify-between items-center">
                            <span>Điều khoản & Điều kiện (Hiển thị trên ấn bản)</span>
                            <span className="text-[10px] text-slate-400 font-normal">Mỗi dòng là 1 gạch đầu dòng</span>
                        </label>
                        <textarea
                            value={terms} onChange={e => setTerms(e.target.value)}
                            rows={4} placeholder="Nhập các điều khoản..."
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
                        />
                    </div>
                    
                    <hr className="my-6 border-slate-100" />
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Người phụ trách (Hiển thị trên báo giá)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Chọn hệ thống (tuỳ chọn)</label>
                            <select
                                value={usersList.find(u => (u.full_name || u.email) === salesName)?.id || ""}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-slate-50"
                                onChange={(e) => {
                                    const u = usersList.find(x => x.id === e.target.value);
                                    if (u) {
                                        setSalesName(u.full_name || u.email);
                                        setSalesPhone(u.phone || '');
                                    } else {
                                        setSalesName('');
                                        setSalesPhone('');
                                    }
                                }}
                            >
                                <option value="">-- Mặc định / Nhập tay --</option>
                                {usersList.map((u, idx) => (
                                    <option key={u.id || idx} value={u.id}>
                                        {u.full_name ? `${u.full_name} (${u.email})` : u.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Tên hiển thị</label>
                            <input
                                type="text" value={salesName}
                                onChange={e => setSalesName(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                                placeholder="Nhập tên NV..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">SĐT Kinh doanh</label>
                            <input
                                type="text" value={salesPhone}
                                onChange={e => setSalesPhone(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                                placeholder="Nếu trống sẽ tự lấy Hotline Cty"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                        {quote ? 'Cập nhật' : 'Lưu lại'}
                    </button>
                </div>
            </div>

            <ProductMultiSelector 
                isOpen={isProductSelectorOpen} 
                onClose={() => setIsProductSelectorOpen(false)} 
                products={products} 
                onAddProducts={handleAddMultipleProducts} 
            />
        </div>
    );
}

// ========== PRODUCT MULTI SELECTOR ==========
function ProductMultiSelector({ 
    products, 
    onAddProducts, 
    isOpen, 
    onClose 
}: { 
    products: any[]; 
    onAddProducts: (productIds: string[]) => void; 
    isOpen: boolean; 
    onClose: () => void; 
}) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [brandFilter, setBrandFilter] = React.useState('');
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    
    // just use standard React useState imports for simplicity since it's already in the file at the top
    // wait, I can just use useState. It was imported.

    if (!isOpen) return null;

    const brands = Array.from(new Set(products.map(p => p.brand || 'LHU'))).filter(Boolean);

    const filtered = products.filter(p => {
        const matchSearch = (p.name || p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchBrand = brandFilter ? (p.brand || 'LHU') === brandFilter : true;
        return matchSearch && matchBrand;
    });

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        const filteredIds = filtered.map(p => p.id);
        // check if all currently filtered items are already selected
        const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            // deselect them all
            setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            // select them all
            setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
        }
    };

    const handleConfirm = () => {
        onAddProducts(selectedIds);
        setSelectedIds([]);
        setSearchTerm('');
        setBrandFilter('');
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Thêm sản phẩm</h3>
                        <p className="text-xs text-slate-500 mt-1">Chọn nhiều sản phẩm để thêm vào báo giá cùng lúc</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3 shrink-0">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" placeholder="Tìm tên SP, mã SKU..." 
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>
                    <select 
                        value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
                        className="w-full sm:w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary-500 bg-white"
                    >
                        <option value="">Tất cả thương hiệu</option>
                        {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                    {filtered.length > 0 && (
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-medium text-slate-500">Hiển thị {filtered.length} kết quả</p>
                            <button 
                                type="button" 
                                onClick={toggleSelectAll}
                                className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 py-1.5 px-3 rounded-lg transition-colors border border-primary-200 flex items-center gap-1.5"
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                {filtered.every(p => selectedIds.includes(p.id)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filtered.length === 0 && (
                            <div className="p-8 text-center text-slate-400 col-span-full">Không tìm thấy sản phẩm nào</div>
                        )}
                        {filtered.map(p => {
                            const isSelected = selectedIds.includes(p.id);
                            return (
                                <div 
                                    key={p.id} 
                                    onClick={() => toggleSelect(p.id)}
                                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                                        isSelected ? 'bg-primary-50 border-primary-400 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className={`w-5 h-5 mt-0.5 rounded border flex shrink-0 items-center justify-center transition-colors ${
                                        isSelected ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300'
                                    }`}>
                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 line-clamp-2">{p.name || p.title}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{p.brand || 'LHU'}</span>
                                                <span className="text-[11px] text-slate-400">{p.sku}</span>
                                            </div>
                                            <span className="text-xs font-bold text-primary-600">{new Intl.NumberFormat('vi-VN').format(p.price || 0)} đ</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
                    <p className="text-sm font-medium text-slate-600">Đã chọn: <span className="font-bold text-primary-600">{selectedIds.length}</span> sản phẩm</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Hủy</button>
                        <button 
                            type="button"
                            onClick={handleConfirm}
                            disabled={selectedIds.length === 0}
                            className={`px-5 py-2 text-sm font-bold text-white rounded-lg flex items-center gap-2 transition-all ${
                                selectedIds.length > 0 ? 'bg-primary-600 hover:bg-primary-700 shadow-md' : 'bg-slate-300 cursor-not-allowed opacity-70'
                            }`}
                        >
                            <PackagePlus className="w-4 h-4" /> Xác nhận thêm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
