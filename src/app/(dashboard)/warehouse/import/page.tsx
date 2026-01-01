"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Archive, AlertTriangle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "@/mocks/data";
import { loadProducts } from "@/lib/supabase/products";
import { addStock, getInventoryLevel, getDefaultWarehouseId } from "@/lib/inventoryStore";
import { useAuth } from "@/components/auth/AuthProvider";

export default function WarehouseImportPage() {
    const router = useRouter();
    const { user } = useAuth();

    // State
    const [warehouseId, setWarehouseId] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState<number>(0);
    const [note, setNote] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentStock, setCurrentStock] = useState<number | null>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            const wId = await getDefaultWarehouseId();
            setWarehouseId(wId);
            const prods = await loadProducts();
            setProducts(prods);
            setIsLoading(false);
        };
        init();
    }, []);

    // Fetch stock when product selected
    useEffect(() => {
        if (selectedProduct && warehouseId) {
            getInventoryLevel(selectedProduct.id, warehouseId).then(level => {
                setCurrentStock(level ? level.quantity_on_hand : 0);
            });
        }
    }, [selectedProduct, warehouseId]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!warehouseId || !selectedProduct || !user?.id || quantity <= 0) return;

        if (!confirm(`Xác nhận nhập ${quantity} ${selectedProduct.unit || 'cái'} vào kho?`)) return;

        setIsLoading(true);
        try {
            const res = await addStock(warehouseId, selectedProduct.id, quantity, user.id, note || "Nhập hàng thủ công");
            if (res.success) {
                alert("✅ Nhập kho thành công!");
                router.push("/warehouse/inventory");
            } else {
                alert("❌ Lỗi: " + res.message);
            }
        } catch (err) {
            console.error(err);
            alert("❌ Đã có lỗi xảy ra");
        }
        setIsLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-4">
                <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Archive className="w-5 h-5 text-indigo-600" />
                        Tạo Phiếu Nhập Kho (Inbound)
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Nhập hàng mới vào kho hoặc nhập hàng hoàn trả</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Warehouse Info */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kho nhập</label>
                        <div className="p-3 bg-slate-100 rounded-lg text-slate-700 font-medium">
                            Kho Tổng Hà Nội (Mặc định)
                        </div>
                    </div>

                    {/* Product Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Chọn sản phẩm</label>
                        {!selectedProduct ? (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm tên hoặc SKU..."
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-60 overflow-y-auto border rounded-lg bg-white">
                                    {filteredProducts.slice(0, 10).map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setSelectedProduct(p); setSearchTerm(""); }}
                                            className="w-full text-left p-3 hover:bg-slate-50 border-b last:border-0 flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="font-medium text-sm">{p.name}</div>
                                                <div className="text-xs text-slate-500">SKU: {p.sku}</div>
                                            </div>
                                            <div className="px-2 py-1 bg-slate-100 rounded text-xs">Chọn</div>
                                        </button>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <div className="p-4 text-center text-slate-500 text-sm">Không tìm thấy sản phẩm</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 border border-indigo-200 bg-indigo-50 rounded-lg flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-indigo-900">{selectedProduct.name}</div>
                                    <div className="text-sm text-indigo-700">SKU: {selectedProduct.sku} • Đơn vị: {selectedProduct.unit || 'Cái'}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        Hiện tại trong kho: <span className="font-medium text-slate-900">{currentStock ?? '...'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="text-sm text-red-600 hover:underline"
                                >
                                    Thay đổi
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quantity & Note */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng nhập</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                value={quantity}
                                onChange={e => setQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (Lý do)</label>
                            <input
                                type="text"
                                placeholder="VD: Nhập hàng mới về..."
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !selectedProduct || quantity <= 0}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Xác nhận Nhập Kho
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
