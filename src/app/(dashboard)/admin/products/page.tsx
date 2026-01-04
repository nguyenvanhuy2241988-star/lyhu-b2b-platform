"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Product } from "@/mocks/data";
import { Package, Search, Loader2, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";

// Define strict type for our API
interface AppProduct extends Product {
    name: string;
    sku: string;
    brand: string;
    unit: string;
    price: number;
    stock: number;
    // Extra fields for DB compatibility
    image_url?: string;
    is_active?: boolean;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<AppProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState<AppProduct | null>(null);
    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        brand: "LHU",
        unit: "Cái",
        price: 0,
        stock: 0,
        image_url: ""
    });

    const { session } = useAuth();

    // Helper to get headers safely
    const getHeaders = useCallback(() => {
        const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY || ''
        };
        // CRITICAL: Use User Token if available for RLS "Admin" check
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        } else {
            headers['Authorization'] = `Bearer ${SUPABASE_KEY}`;
        }
        return headers;
    }, [session?.access_token]);

    const fetchProducts = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
            // Filter by is_active=true to default show only active products
            const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&is_active=eq.true&order=created_at.desc`, {
                headers: getHeaders()
            });

            if (!res.ok) throw new Error("Failed to fetch products");
            const data = await res.json();
            setProducts(data || []);
        } catch (err) {
            console.error("Error loading products:", err);
            toast.error("Không thể tải danh sách sản phẩm");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [getHeaders]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleOpenCreate = () => {
        setEditingProduct(null);
        setFormData({
            sku: "",
            name: "",
            brand: "LYHU",
            unit: "Gói",
            price: 0,
            stock: 100,
            image_url: ""
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (product: AppProduct) => {
        setEditingProduct(product);
        setFormData({
            sku: product.sku || "",
            name: product.name || "",
            brand: product.brand || "LYHU",
            unit: product.unit || "Gói",
            price: product.price || 0,
            stock: product.stock || 0,
            image_url: product.image_url || ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

        try {
            const url = editingProduct
                ? `${SUPABASE_URL}/rest/v1/products?id=eq.${editingProduct.id}`
                : `${SUPABASE_URL}/rest/v1/products`;

            const method = editingProduct ? "PATCH" : "POST";

            // Allow Supabase to handle ID generation on POST
            const payload = {
                ...formData,
                is_active: true,
                updated_at: new Date().toISOString()
            };

            const res = await fetch(url, {
                method,
                headers: {
                    ...getHeaders(),
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Lỗi khi lưu sản phẩm");
            }

            toast.success(editingProduct ? "Cập nhật thành công!" : "Thêm mới thành công!");
            setIsModalOpen(false);
            fetchProducts(true);
        } catch (error: any) {
            console.error(error);
            toast.error("Lỗi: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (product: AppProduct) => {
        if (!confirm(`Bạn chắc chắn muốn xóa sản phẩm: ${product.name}?`)) return;

        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const toastId = toast.loading("Đang xóa...");

        try {
            // Soft Delete: Set is_active to false
            const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ is_active: false })
            });

            if (!res.ok) throw new Error("Không thể xóa sản phẩm");

            toast.success("Đã xóa sản phẩm (đã ẩn)", { id: toastId });
            fetchProducts(true);
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(
            (p) =>
                (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.brand || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, searchQuery]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const brandStats = useMemo(() => {
        return products.reduce((acc, p) => {
            const b = p.brand || "Khác";
            acc[b] = (acc[b] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [products]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý sản phẩm</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Danh sách sản phẩm và giá sỉ
                    </p>
                </div>
                {/* Only Admin sees this, but we handle logic via RLS. UI logic: show if user is admin? 
                    For now, show to everyone, let RLS block if unauthorized, OR check session role. 
                    Let's check session role for better UI UX */}
                {session?.user && (
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Thêm sản phẩm</span>
                    </button>
                )}
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 rounded-lg">
                            <Package className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-600">Tổng SP</p>
                            <p className="text-xl font-bold text-slate-900">{products.length}</p>
                        </div>
                    </div>
                </div>

                {Object.entries(brandStats).slice(0, 3).map(([brand, count]) => (
                    <div key={brand} className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-600">{brand}</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{count} SP</p>
                    </div>
                ))}

                {/* Search - Span remaining */}
                <div className="lg:col-span-1 bg-white p-4 rounded-lg border border-slate-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-sm text-slate-500 mt-2">Đang tải danh sách sản phẩm...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Chưa có sản phẩm nào</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">
                            {searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Danh sách sản phẩm đang trống.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[900px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium">SKU</th>
                                    <th className="px-6 py-3 font-medium">Tên sản phẩm</th>
                                    <th className="px-6 py-3 font-medium">Thương hiệu</th>
                                    <th className="px-6 py-3 font-medium">Đơn vị</th>
                                    <th className="px-6 py-3 font-medium text-right">Giá bán</th>
                                    <th className="px-6 py-3 font-medium text-right">Tồn kho</th>
                                    <th className="px-6 py-3 font-medium text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {product.sku}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{product.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                {product.brand}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{product.unit}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {formatPrice(product.price || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${(product.stock || 0) > 20 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.stock || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(product)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU (Mã hàng)</label>
                                    <input
                                        required
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="VD: SP001"
                                        value={formData.sku}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Thương hiệu</label>
                                    <input
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="VD: LYHU"
                                        value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên sản phẩm</label>
                                <input
                                    required
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: Kẹo dẻo vị táo..."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="Gói">Gói</option>
                                        <option value="Thùng">Thùng</option>
                                        <option value="Hộp">Hộp</option>
                                        <option value="Chai">Chai</option>
                                        <option value="Cái">Cái</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tồn kho</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Link Ảnh (Tùy chọn)</label>
                                <input
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://..."
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                                    ) : (
                                        <><Check className="w-4 h-4" /> {editingProduct ? "Cập nhật" : "Tạo mới"}</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
