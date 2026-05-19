"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Product } from "@/mocks/data";
import { Package, Search, Loader2, Plus, Pencil, Trash2, X, Check, Settings2, Filter, ArrowUpDown, ImageIcon, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

// Define strict type for our API
export interface AppProduct extends Product {
    name: string;
    sku: string;
    brand: string;
    unit: string;
    price: number;
    stock: number;
    image_url?: string;
    is_active?: boolean;
    created_at?: string;
    weight?: string;
    packaging_spec?: string;
    items_per_carton?: number;
    description?: string;
    video_url?: string;
    extra_images?: string[];
    origin?: string;
    certificates?: string[];
}

interface ProductListProps {
    readOnly?: boolean;
}

export default function ProductList({ readOnly = false }: ProductListProps) {
    const [products, setProducts] = useState<AppProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Sort & Filter State
    const [filterBrand, setFilterBrand] = useState("all");
    const [filterStock, setFilterStock] = useState("all"); // all, in_stock, out_of_stock
    const [sortBy, setSortBy] = useState("newest"); // newest, price_asc, price_desc, name_asc, stock_desc

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [dragImage, setDragImage] = useState(false);

    // Edit/Create State
    const [editingProduct, setEditingProduct] = useState<AppProduct | null>(null);
    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        brand: "LHU",
        unit: "Cái",
        price: 0,
        stock: 0,
        image_url: "",
        weight: "",
        packaging_spec: "",
        items_per_carton: 0,
        description: "",
        video_url: "",
        extra_images: [] as string[],
        origin: "",
        certificates: [] as string[]
    });

    // Bulk Edit State — multi-field
    const [bulkFields, setBulkFields] = useState<Record<string, { enabled: boolean; value: string }>>({
        stock: { enabled: false, value: '' },
        price: { enabled: false, value: '' },
        brand: { enabled: false, value: '' },
        items_per_carton: { enabled: false, value: '' },
        weight: { enabled: false, value: '' },
        packaging_spec: { enabled: false, value: '' },
    });

    const { session } = useAuth();

    const uploadProductImage = async (file: File) => {
        try {
            setIsUploadingImage(true);
            const fileExt = file.name?.split('.').pop() || 'png';
            const fileName = `product_img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('report-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('report-images')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
            toast.success("Tải ảnh lên thành công");
        } catch (error: any) {
            toast.error('Lỗi upload ảnh: ' + error.message);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const uploadExtraImage = async (file: File) => {
        try {
            setIsUploadingImage(true);
            const fileExt = file.name?.split('.').pop() || 'png';
            const fileName = `product_extra_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('report-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('report-images')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, extra_images: [...(prev.extra_images || []), data.publicUrl] }));
            toast.success("Tải ảnh bổ sung thành công");
        } catch (error: any) {
            toast.error('Lỗi upload ảnh: ' + error.message);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const uploadCertificateImage = async (file: File) => {
        try {
            setIsUploadingImage(true);
            const fileExt = file.name?.split('.').pop() || 'png';
            const fileName = `product_cert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('report-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('report-images')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, certificates: [...(prev.certificates || []), data.publicUrl] }));
            toast.success("Tải ảnh giấy tờ thành công");
        } catch (error: any) {
            toast.error('Lỗi upload ảnh: ' + error.message);
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Helper to get headers
    const getHeaders = useCallback(() => {
        const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY || ''
        };
        // Use User Token for RLS
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
            // Fetch all active products
            const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*,inventory_levels(quantity_on_hand)&is_active=eq.true&order=created_at.desc`, {
                headers: getHeaders()
            });

            if (!res.ok) throw new Error("Failed to fetch products");
            const data = await res.json();

            // Map inventory_levels to stock
            const mappedData = data?.map((p: any) => ({
                ...p,
                stock: p.inventory_levels?.[0]?.quantity_on_hand || 0
            })) || [];

            setProducts(mappedData);
            // Clear selection on refresh
            if (!silent) setSelectedIds(new Set());
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

    // NOTE: Realtime disabled to save Supabase egress.
    // Products rarely change — data refreshes on user actions (create/edit/delete).

    // --- Filter & Sort Logic ---
    const filteredProducts = useMemo(() => {
        let result = products.filter(
            (p) =>
                (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.brand || "").toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Apply Brand Filter
        if (filterBrand !== "all") {
            result = result.filter(p => p.brand === filterBrand);
        }

        // Apply Stock Filter
        if (filterStock === "in_stock") {
            result = result.filter(p => (p.stock || 0) > 0);
        } else if (filterStock === "out_of_stock") {
            result = result.filter(p => (p.stock || 0) <= 0);
        }

        // Apply Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case "price_asc": return (a.price || 0) - (b.price || 0);
                case "price_desc": return (b.price || 0) - (a.price || 0);
                case "stock_desc": return (b.stock || 0) - (a.stock || 0);
                case "name_asc": return (a.name || "").localeCompare(b.name || "");
                case "newest": default:
                    // Safe date parsing
                    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return timeB - timeA;
            }
        });

        return result;
    }, [products, searchQuery, filterBrand, filterStock, sortBy]);

    // Unique Brands for Filter
    const uniqueBrands = useMemo(() => {
        const brands = new Set(products.map(p => p.brand).filter(Boolean));
        return Array.from(brands).sort();
    }, [products]);

    // ... Selection handlers ...
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    // --- CRUD Actions ---
    const handleOpenCreate = () => {
        if (readOnly) return;
        setEditingProduct(null);
        setFormData({ 
            sku: "", name: "", brand: "LYHU", unit: "Gói", price: 0, stock: 100, image_url: "",
            weight: "", packaging_spec: "", items_per_carton: 0, description: "", video_url: "", extra_images: [],
            origin: "", certificates: []
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (product: AppProduct) => {
        if (readOnly) return;
        setEditingProduct(product);
        setFormData({
            sku: product.sku || "",
            name: product.name || "",
            brand: product.brand || "LYHU",
            unit: product.unit || "Gói",
            price: product.price || 0,
            stock: product.stock || 0,
            image_url: product.image_url || "",
            weight: product.weight || "",
            packaging_spec: product.packaging_spec || "",
            items_per_carton: product.items_per_carton || 0,
            description: product.description || "",
            video_url: product.video_url || "",
            extra_images: product.extra_images || [],
            origin: product.origin || "",
            certificates: product.certificates || []
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        setIsSubmitting(true);
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

        try {
            const headers = getHeaders();
            // 1. Separate stock from the main product details
            const { stock, ...productData } = formData;

            const url = editingProduct
                ? `${SUPABASE_URL}/rest/v1/products?id=eq.${editingProduct.id}`
                : `${SUPABASE_URL}/rest/v1/products`;
            const method = editingProduct ? "PATCH" : "POST";

            // If creating, we want the new ID back
            const fetchHeaders = !editingProduct
                ? { ...headers, 'Prefer': 'return=representation' }
                : { ...headers, 'Prefer': 'return=minimal' };

            const payload = { ...productData, is_active: true, updated_at: new Date().toISOString() };

            const res = await fetch(url, {
                method,
                headers: fetchHeaders,
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Lỗi khi lưu sản phẩm");
            }

            let finalProductId = editingProduct?.id;
            if (!editingProduct) {
                const created = await res.json();
                finalProductId = created?.[0]?.id;
            }

            // 2. Handle Stock / Inventory Levels
            if (finalProductId) {
                // Find a warehouse
                const whRes = await fetch(`${SUPABASE_URL}/rest/v1/warehouses?select=id&limit=1`, { headers });
                const whs = await whRes.json();
                const warehouseId = whs?.[0]?.id;

                if (warehouseId) {
                    // Use RPC fn_adjust_stock to handle updates and audit logging safely
                    const adjustRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_adjust_stock`, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({
                            p_warehouse_id: warehouseId,
                            p_product_id: finalProductId,
                            p_new_quantity: stock,
                            p_user_id: session?.user?.id,
                            p_note: editingProduct ? "Cập nhật từ Admin" : "Tạo mới từ Admin"
                        })
                    });

                    if (!adjustRes.ok) {
                        console.error("Stock update failed", await adjustRes.text());
                        toast.error("Lỗi cập nhật kho (nhưng đã lưu SP)");
                    }
                }
            }

            toast.success(editingProduct ? "Cập nhật thành công!" : "Thêm mới thành công!");
            setIsModalOpen(false);
            fetchProducts(true);
        } catch (error: any) {
            console.error("Submit Error:", error);
            toast.error("Lỗi: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (product: AppProduct) => {
        if (readOnly) return;
        if (!confirm(`Bạn chắc chắn muốn xóa: ${product.name}?`)) return;
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const toastId = toast.loading("Đang xóa...");

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ is_active: false })
            });
            if (!res.ok) throw new Error("Thất bại");

            toast.success("Đã ẩn sản phẩm", { id: toastId });
            fetchProducts(true);
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    // --- Bulk Actions ---
    const handleBulkDelete = async () => {
        if (readOnly) return;
        if (!confirm(`Bạn chắc chắn muốn xóa ${selectedIds.size} sản phẩm đã chọn?`)) return;
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const toastId = toast.loading("Đang xử lý hàng loạt...");

        try {
            const ids = Array.from(selectedIds).map(id => `"${id}"`).join(','); // Quote UUIDs
            const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=in.(${ids})`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() })
            });

            if (!res.ok) throw new Error("Lỗi khi xóa hàng loạt");

            toast.success(`Đã xóa ${selectedIds.size} sản phẩm`, { id: toastId });
            setSelectedIds(new Set());
            fetchProducts(true);
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    const handleBulkEditSubmit = async () => {
        if (readOnly) return;
        const enabledFields = Object.entries(bulkFields).filter(([, v]) => v.enabled && v.value !== '');
        if (enabledFields.length === 0) {
            toast.error("Vui lòng chọn và nhập ít nhất 1 trường");
            return;
        }
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        setIsSubmitting(true);

        try {
            const headers = getHeaders();
            let lastMessage = '';
            for (const [field, config] of enabledFields) {
                const payload = {
                    p_product_ids: Array.from(selectedIds),
                    p_field: field,
                    p_value: config.value
                };
                const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fn_quick_update_products`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || `Lỗi cập nhật ${field}`);
                }
                const result = await res.json();
                if (!result.success) throw new Error(result.message);
                lastMessage = result.message;
            }

            toast.success(`Đã cập nhật ${enabledFields.length} trường cho ${selectedIds.size} SP!`);
            setIsBulkEditOpen(false);
            setSelectedIds(new Set());
            // Reset bulk fields
            setBulkFields(prev => Object.fromEntries(Object.keys(prev).map(k => [k, { enabled: false, value: '' }])));
            fetchProducts(true);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

    // Helpers
    const brandStats = useMemo(() => {
        return products.reduce((acc, p) => {
            const b = p.brand || "Khác";
            acc[b] = (acc[b] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [products]);
    const allSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length;
    const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredProducts.length;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý sản phẩm</h1>
                    <p className="text-sm text-slate-600 mt-1">Danh sách sản phẩm và giá sỉ</p>
                </div>
                {!readOnly && session?.user && (
                    <button onClick={handleOpenCreate} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95">
                        <Plus className="w-5 h-5" />
                        <span>Thêm sản phẩm</span>
                    </button>
                )}
            </div>

            {/* Stats & Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Stats */}
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
                    {Object.entries(brandStats)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([brand, count]) => (
                            <div key={brand} className="bg-white p-4 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-600 truncate" title={brand}>{brand}</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">{count}</p>
                            </div>
                        ))}
                </div>

                {/* Search */}
                <div className="lg:col-span-1 bg-white p-4 rounded-lg border border-slate-200 flex items-center">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm tên, SKU, brand..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Filter className="w-4 h-4" />
                        <span className="font-medium">Lọc:</span>
                    </div>
                    <select
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
                    >
                        <option value="all">Tất cả thương hiệu</option>
                        {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <select
                        value={filterStock}
                        onChange={(e) => setFilterStock(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="in_stock">Còn hàng</option>
                        <option value="out_of_stock">Hết hàng</option>
                    </select>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ArrowUpDown className="w-4 h-4" />
                        <span className="font-medium">Sắp xếp:</span>
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer min-w-[140px]"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                        <option value="stock_desc">Tồn kho giảm dần</option>
                        <option value="name_asc">Tên A-Z</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-sm text-slate-500 mt-2">Đang tải...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <Package className="w-12 h-12 text-slate-300 mb-2" />
                        <h3 className="text-lg font-medium text-slate-900">Không tìm thấy sản phẩm</h3>
                        <p className="text-sm text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[900px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        {!readOnly && (
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={allSelected}
                                                onChange={handleSelectAll}
                                                ref={input => { if (input) input.indeterminate = isIndeterminate; }}
                                            />
                                        )}
                                    </th>
                                    <th className="px-6 py-3 font-medium w-16 text-center">Ảnh</th>
                                    <th className="px-6 py-3 font-medium">SKU</th>
                                    <th className="px-6 py-3 font-medium">Tên sản phẩm</th>
                                    <th className="px-6 py-3 font-medium">Thương hiệu</th>
                                    <th className="px-6 py-3 font-medium">Đơn vị</th>
                                    <th className="px-6 py-3 font-medium text-right">Giá bán</th>
                                    <th className="px-6 py-3 font-medium text-right">Tồn kho</th>
                                    {!readOnly && <th className="px-6 py-3 font-medium text-right">Hành động</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(product.id) ? 'bg-blue-50/50' : ''}`}>
                                        <td className="px-4 py-4">
                                            {!readOnly && (
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    checked={selectedIds.has(product.id)}
                                                    onChange={() => handleSelectOne(product.id)}
                                                />
                                            )}
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <div className="w-10 h-10 mx-auto rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                                                {product.image_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-5 h-5 text-slate-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {product.sku}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{product.brand}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{product.unit}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">{formatPrice(product.price || 0)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${(product.stock || 0) > 20 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.stock || 0}
                                            </span>
                                        </td>
                                        {!readOnly && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenEdit(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(product)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Bulk Actions Bar */}
            {!readOnly && selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
                        <span className="bg-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{selectedIds.size}</span>
                        <span className="text-sm font-medium">Đã chọn</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsBulkEditOpen(true)}
                            className="flex items-center gap-2 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors text-sm"
                        >
                            <Settings2 className="w-4 h-4" />
                            Cập nhật nhanh
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 hover:bg-red-600/20 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors text-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                        </button>
                    </div>
                    <button onClick={() => setSelectedIds(new Set())} className="ml-2 text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && !readOnly && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="overflow-y-auto p-6 flex-1">
                            <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                                    <input required className="w-full border rounded-lg px-3 py-2" placeholder="VD: SP001" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Thương hiệu</label>
                                    <input className="w-full border rounded-lg px-3 py-2" placeholder="VD: LYHU" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên sản phẩm</label>
                                <input required className="w-full border rounded-lg px-3 py-2" placeholder="VD: Sản phẩm A..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị</label>
                                    <select className="w-full border rounded-lg px-3 py-2 bg-white" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                                        <option value="Gói">Gói</option><option value="Thùng">Thùng</option><option value="Hộp">Hộp</option><option value="Chai">Chai</option><option value="Cái">Cái</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán</label>
                                    <input type="number" min="0" className="w-full border rounded-lg px-3 py-2" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tồn kho</label>
                                    <input type="number" min="0" className="w-full border rounded-lg px-3 py-2" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hình ảnh sản phẩm (Link hoặc Tải lên)</label>
                                <div 
                                    className={`w-full rounded-lg p-1.5 border-2 transition-all ${dragImage ? 'border-dashed border-blue-500 bg-blue-50' : 'border-transparent'}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragImage(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); setDragImage(false); }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragImage(false);
                                        const file = e.dataTransfer.files?.[0];
                                        if (file && file.type.startsWith('image/')) uploadProductImage(file);
                                    }}
                                >
                                    <input 
                                        type="text" 
                                        placeholder="URL hoặc dán ảnh (Ctrl+V) vào đây..." 
                                        value={formData.image_url} 
                                        onChange={e => setFormData({ ...formData, image_url: e.target.value })} 
                                        onPaste={(e) => {
                                            const items = e.clipboardData?.items;
                                            if (!items) return;
                                            for (const item of Array.from(items)) {
                                                if (item.type.startsWith('image/')) {
                                                    e.preventDefault();
                                                    const file = item.getAsFile();
                                                    if (file) uploadProductImage(file);
                                                    return;
                                                }
                                            }
                                        }}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-50"
                                        disabled={isUploadingImage}
                                    />
                                    
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                        <label className={`cursor-pointer ${isUploadingImage ? 'bg-slate-100 text-slate-400 pointer-events-none' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium w-full border border-slate-200 shadow-sm text-sm`}>
                                            {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-blue-500"/> : <UploadCloud className="w-4 h-4 text-blue-600" />}
                                            {isUploadingImage ? 'Đang tải lên...' : 'Tải ảnh từ máy'}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) uploadProductImage(e.target.files[0]);
                                            }} />
                                        </label>
                                    </div>
                                </div>
                                {formData.image_url && (
                                    <div className="mt-3 mx-1.5 h-32 w-32 border border-slate-200 rounded-lg overflow-hidden relative group/img cursor-pointer">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={formData.image_url} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} onClick={() => window.open(formData.image_url, '_blank')} />
                                        <button
                                            type="button"
                                            title="Xoá ảnh"
                                            className="absolute inset-0 bg-black/50 hidden group-hover/img:flex items-center justify-center text-white transition-opacity"
                                            onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, image_url: '' })); }}
                                        >
                                            <Trash2 className="w-6 h-6 text-red-200" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Extra Info */}
                            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Trọng lượng (ví dụ: 500g)</label>
                                    <input className="w-full border rounded-lg px-3 py-2" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Xuất xứ (ví dụ: Việt Nam)</label>
                                    <input className="w-full border rounded-lg px-3 py-2" value={formData.origin || ''} onChange={e => setFormData({ ...formData, origin: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quy cách (ví dụ: Thùng carton)</label>
                                    <input className="w-full border rounded-lg px-3 py-2" value={formData.packaging_spec} onChange={e => setFormData({ ...formData, packaging_spec: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Số SP / Thùng</label>
                                    <input type="number" min="0" className="w-full border rounded-lg px-3 py-2" value={formData.items_per_carton} onChange={e => setFormData({ ...formData, items_per_carton: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Video URL (YouTube/TikTok)</label>
                                    <input type="url" placeholder="https://" className="w-full border rounded-lg px-3 py-2" value={formData.video_url} onChange={e => setFormData({ ...formData, video_url: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả sản phẩm</label>
                                <textarea rows={4} className="w-full border rounded-lg px-3 py-2" placeholder="Ghi chú thêm về thành phần, cách dùng..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            {/* Extra Images */}
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh bổ sung (Nhiều ảnh)</label>
                                <div className="mt-2 flex items-center justify-start gap-3">
                                    <label className={`cursor-pointer ${isUploadingImage ? 'bg-slate-100 text-slate-400 pointer-events-none' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium border border-slate-200 shadow-sm text-sm`}>
                                        {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-blue-500"/> : <UploadCloud className="w-4 h-4 text-blue-600" />}
                                        Tải ảnh thêm
                                        <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => {
                                            if (e.target.files) {
                                                Array.from(e.target.files).forEach(file => uploadExtraImage(file));
                                            }
                                        }} />
                                    </label>
                                </div>
                                {formData.extra_images && formData.extra_images.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {formData.extra_images.map((url, idx) => (
                                            <div key={idx} className="h-20 w-20 border border-slate-200 rounded-lg overflow-hidden relative group/img cursor-pointer">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} onClick={() => window.open(url, '_blank')} />
                                                <button
                                                    type="button"
                                                    title="Xoá ảnh này"
                                                    className="absolute inset-0 bg-black/50 hidden group-hover/img:flex items-center justify-center text-white transition-opacity"
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setFormData(prev => ({ ...prev, extra_images: prev.extra_images.filter((_, index) => index !== idx) })); 
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-200" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Certificates Images */}
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh Giấy tờ & Chứng nhận (Chứng nhận ATVSTP, Hóa đơn VAT...)</label>
                                <div className="mt-2 flex items-center justify-start gap-3">
                                    <label className={`cursor-pointer ${isUploadingImage ? 'bg-slate-100 text-slate-400 pointer-events-none' : 'bg-slate-100 hover:bg-emerald-50 text-emerald-700 border-emerald-200'} px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium border shadow-sm text-sm`}>
                                        {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500"/> : <UploadCloud className="w-4 h-4 text-emerald-600" />}
                                        Tải ảnh giấy tờ lên
                                        <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => {
                                            if (e.target.files) {
                                                Array.from(e.target.files).forEach(file => uploadCertificateImage(file));
                                            }
                                        }} />
                                    </label>
                                </div>
                                {formData.certificates && formData.certificates.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {formData.certificates.map((url, idx) => (
                                            <div key={idx} className="h-20 w-20 border border-slate-200 rounded-lg overflow-hidden relative group/img cursor-pointer">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} onClick={() => window.open(url, '_blank')} />
                                                <button
                                                    type="button"
                                                    title="Xoá ảnh này"
                                                    className="absolute inset-0 bg-black/50 hidden group-hover/img:flex items-center justify-center text-white transition-opacity"
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setFormData(prev => ({ ...prev, certificates: prev.certificates.filter((_, index) => index !== idx) })); 
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-200" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </form>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg">Hủy bỏ</button>
                                <button type="submit" form="product-form" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />} {editingProduct ? "Cập nhật" : "Tạo mới"}
                                </button>
                            </div>
                    </div>
                </div>
            )}

            {/* Bulk Edit Modal — Multi-field Grid */}
            {isBulkEditOpen && !readOnly && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">Cập nhật nhanh {selectedIds.size} SP</h3>
                            <button onClick={() => setIsBulkEditOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                            <p className="text-xs text-slate-500 mb-1">Tích chọn trường cần cập nhật, nhập giá trị rồi bấm Áp dụng.</p>
                            {[
                                { key: 'stock', label: '📦 Tồn kho', type: 'number', placeholder: 'VD: 100' },
                                { key: 'price', label: '💰 Giá bán (₫)', type: 'number', placeholder: 'VD: 22000' },
                                { key: 'brand', label: '🏷️ Thương hiệu', type: 'text', placeholder: 'VD: LYHU' },
                                { key: 'items_per_carton', label: '📐 Số SP / Thùng', type: 'number', placeholder: 'VD: 50' },
                                { key: 'weight', label: '⚖️ Trọng lượng', type: 'text', placeholder: 'VD: 35g, 180g' },
                                { key: 'packaging_spec', label: '📋 Quy cách đóng gói', type: 'text', placeholder: 'VD: 50 gói/thùng' },
                            ].map(item => (
                                <div
                                    key={item.key}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                        bulkFields[item.key]?.enabled
                                            ? 'border-blue-400 bg-blue-50/50 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={bulkFields[item.key]?.enabled || false}
                                        onChange={e => setBulkFields(prev => ({
                                            ...prev,
                                            [item.key]: { ...prev[item.key], enabled: e.target.checked }
                                        }))}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                    />
                                    <label className="text-sm font-medium text-slate-700 w-36 shrink-0">{item.label}</label>
                                    <input
                                        type={item.type}
                                        disabled={!bulkFields[item.key]?.enabled}
                                        className={`flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none transition-colors ${
                                            bulkFields[item.key]?.enabled
                                                ? 'border-blue-300 bg-white focus:ring-2 focus:ring-blue-500'
                                                : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                        }`}
                                        placeholder={item.placeholder}
                                        value={bulkFields[item.key]?.value || ''}
                                        onChange={e => setBulkFields(prev => ({
                                            ...prev,
                                            [item.key]: { ...prev[item.key], value: e.target.value }
                                        }))}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                            <button
                                onClick={handleBulkEditSubmit}
                                disabled={isSubmitting || !Object.values(bulkFields).some(f => f.enabled && f.value !== '')}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />}
                                {isSubmitting ? 'Đang cập nhật...' : `Áp dụng cho ${selectedIds.size} sản phẩm`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
