'use client';

import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Search, Filter, Globe, ShoppingCart, MessageCircle, ShoppingBag, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { Order, OrderSource } from '@/lib/ordersStore';

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');

const STATUS_CONFIG: Record<string, any> = {
    pending: { label: "Chờ xác nhận", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
    processing: { label: "Đang xử lý", icon: Package, color: "bg-blue-100 text-blue-700" },
    delivering: { label: "Đang giao hàng", icon: Package, color: "bg-indigo-100 text-indigo-700" },
    delivered: { label: "Đã giao", icon: CheckCircle, color: "bg-green-100 text-green-700" },
    returned: { label: "Hoàn hàng", icon: RotateCcw, color: "bg-orange-100 text-orange-700" },
    cancelled: { label: "Đã hủy", icon: XCircle, color: "bg-red-100 text-red-700" },
};

const SOURCE_CONFIG: Record<string, any> = {
    SHOPEE: { label: "Shopee", icon: ShoppingBag, color: "text-orange-600 bg-orange-50" },
    TIKTOK: { label: "TikTok", icon: ShoppingCart, color: "text-black bg-slate-100" },
    WEB: { label: "Website", icon: Globe, color: "text-violet-600 bg-violet-50" },
    FACEBOOK: { label: "Facebook", icon: MessageCircle, color: "text-blue-600 bg-blue-50" },
    ZALO: { label: "Zalo", icon: MessageCircle, color: "text-blue-500 bg-blue-50" },
    CUSTOMER: { label: "Khách lẻ", icon: Package, color: "text-slate-600 bg-slate-50" },
};

export default function EcommerceOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterSource, setFilterSource] = useState<OrderSource | 'ALL'>('ALL');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const supabase = createClient();
        // Fetch orders where source is relevant to Ecommerce
        const { data } = await supabase
            .from('orders')
            .select(`*, customer:customers(name)`)
            .in('source', ['SHOPEE', 'TIKTOK', 'WEB', 'FACEBOOK', 'ZALO'])
            .order('created_at', { ascending: false });

        if (data) {
            const mapped = data.map((o: any) => ({
                ...o,
                customerName: o.customer?.name || "Khách vãng lai",
                totalAmount: o.total_amount,
                createdAt: o.created_at
            }));
            setOrders(mapped);
        }
        setLoading(false);
    };

    const filtered = orders.filter(o => {
        const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase());
        const matchSource = filterSource === 'ALL' || o.source === filterSource;
        return matchSearch && matchSource;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Đơn hàng Đa kênh</h1>
                    <p className="text-slate-500">Quản lý đơn hàng từ Shopee, TikTok, Website...</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            className="pl-9 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-violet-200"
                            placeholder="Tìm đơn hàng..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="pl-3 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 bg-white"
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value as any)}
                    >
                        <option value="ALL">Tất cả kênh</option>
                        <option value="SHOPEE">Shopee</option>
                        <option value="TIKTOK">TikTok Shop</option>
                        <option value="WEB">Website</option>
                        <option value="FACEBOOK">Facebook</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Mã đơn</th>
                                <th className="px-6 py-4">Kênh bán</th>
                                <th className="px-6 py-4">Khách hàng</th>
                                <th className="px-6 py-4">Ngày tạo</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Tổng tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Không tìm thấy đơn hàng</td></tr>
                            ) : (
                                filtered.map(order => {
                                    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                    const sourceConfig = SOURCE_CONFIG[order.source] || SOURCE_CONFIG.CUSTOMER;
                                    const StatusIcon = status.icon;
                                    const SourceIcon = sourceConfig.icon;

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 font-medium text-slate-900">{order.id}</td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-bold ${sourceConfig.color}`}>
                                                    <SourceIcon className="w-3 h-3" />
                                                    {sourceConfig.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">{order.customerName}</td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">{formatDate(order.createdAt)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                {formatPrice(order.totalAmount)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
