"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingCart, Search, Package } from "lucide-react";
import { Product } from "@/mocks/data";
import { loadProducts } from "@/lib/supabase/products";
import {
    CRMDealItem,
    fetchDealItems,
    addDealItem,
    deleteDealItem,
    updateDealItem,
    updateDeal
} from "@/lib/crmDealsStore";
import { getInventoryLevel, getDefaultWarehouseId } from "@/lib/inventoryStore";
import { useAuth } from "@/components/auth/AuthProvider";

interface DealProductsProps {
    dealId: string;
    items: CRMDealItem[];
    onItemsChange: () => void;
}

export default function DealProducts({ dealId, items, onItemsChange }: DealProductsProps) {
    const { session } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const [inventory, setInventory] = useState<Record<string, number>>({});

    useEffect(() => {
        if (isAdding && products.length === 0) {
            setIsLoadingProducts(true);
            const loadData = async () => {
                const prods = await loadProducts(session?.access_token);
                const warehouseId = await getDefaultWarehouseId(session?.access_token);
                if (warehouseId) {
                    const invMap: Record<string, number> = {};
                    await Promise.all(prods.map(async p => {
                        const level = await getInventoryLevel(p.id, warehouseId, session?.access_token);
                        invMap[p.id] = level?.quantity_available ?? 0;
                    }));
                    setInventory(invMap);
                }
                setProducts(prods);
                setIsLoadingProducts(false);
            };
            loadData();
        }
    }, [isAdding, products.length, session?.access_token]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddProduct = async (product: Product) => {
        const existing = items.find(i => i.product_id === product.id);
        if (existing) {
            await updateDealItem(existing.id, { quantity: existing.quantity + 1 }, session?.access_token);
        } else {
            await addDealItem({
                deal_id: dealId,
                product_id: product.id,
                quantity: 1,
                unit_price: product.wholesalePrice || 0
            }, session?.access_token);
        }
        setIsAdding(false);
        setSearchTerm("");
        onItemsChange();
    };

    const handleRemove = async (id: string) => {
        if (confirm("Xóa sản phẩm này?")) {
            await deleteDealItem(id, session?.access_token);
            onItemsChange();
        }
    };

    const handleUpdateQuantity = async (id: string, newQty: number) => {
        if (newQty < 1) return;
        await updateDealItem(id, { quantity: newQty }, session?.access_token);
        onItemsChange();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    return (
        <div className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-600" />
                    Sản phẩm ({items.length})
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    Thêm sản phẩm
                </button>
            </div>

            {/* Add Product Area */}
            {isAdding && (
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-indigo-100">
                    <div className="relative mb-3">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm tên hoặc SKU sản phẩm..."
                            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {isLoadingProducts ? (
                            <div className="text-center py-4 text-slate-500">Đang tải sản phẩm...</div>
                        ) : filteredProducts.length > 0 ? (
                            filteredProducts.map(product => {
                                const inList = items.find(i => i.product_id === product.id);
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => handleAddProduct(product)}
                                        className="w-full text-left p-2 hover:bg-white hover:shadow-sm rounded border border-transparent hover:border-slate-200 flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="font-medium text-sm text-slate-900">{product.name}</div>
                                            <div className="text-xs text-slate-500">
                                                SKU: {product.sku} • Giá: {formatPrice(product.wholesalePrice || 0)} •
                                                <span className={`font-semibold ml-1 ${(inventory[product.id] ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {(inventory[product.id] ?? 0) > 0 ? `Sẵn hàng: ${inventory[product.id]}` : 'Hết hàng'}
                                                </span>
                                            </div>
                                        </div>
                                        {inList ? (
                                            <span className="text-xs font-semibold text-green-600">Đã chọn</span>
                                        ) : (
                                            <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="text-center py-2 text-slate-500 text-sm">Không tìm thấy sản phẩm</div>
                        )}
                    </div>
                </div>
            )}

            {/* Product List */}
            {items.length === 0 ? (
                <div className="text-center py-6 text-slate-400 border border-dashed rounded-lg bg-slate-50">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có sản phẩm nào</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="w-10 h-10 bg-white rounded flex items-center justify-center border text-slate-400 font-bold text-xs">
                                {item.product?.sku?.substring(0, 3) || 'IMG'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-slate-900 truncate">{item.product?.name}</h4>
                                <div className="text-xs text-slate-500">
                                    {formatPrice(item.unit_price)} x {item.quantity}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center border bg-white rounded">
                                    <button
                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                        className="px-2 py-1 hover:bg-slate-100 text-slate-600 disabled:opacity-50"
                                        disabled={item.quantity <= 1}
                                    >-</button>
                                    <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                        className="px-2 py-1 hover:bg-slate-100 text-slate-600"
                                    >+</button>
                                </div>
                                <div className="text-right min-w-[80px]">
                                    <div className="font-bold text-sm text-slate-900">
                                        {formatPrice(item.quantity * item.unit_price)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="pt-3 border-t flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Tổng giá trị:</span>
                        <span className="text-lg font-bold text-indigo-600">{formatPrice(totalValue)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
