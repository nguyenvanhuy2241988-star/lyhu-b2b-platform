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
        <div className="max-w-2xl mx-auto space-y-4">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#00AFA9] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Quay lại kho hàng
            </button>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Archive className="w-5 h-5 text-[#00AFA9]" />
                        Tạo Phiếu Nhập Kho (Inbound)
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">Nhập hàng mới vào kho hoặc nhập hàng hoàn trả</p>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                    {/* Warehouse Info */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kho nhập</label>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium">
                            Kho Tổng Hà Nội (Mặc định)
                        </div>
                    </div>

                    {/* Product Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chọn sản phẩm</label>
                        {!selectedProduct ? (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm tên hoặc SKU sản phẩm..."
                                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00AFA9] transition-colors"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                                    {filteredProducts.slice(0, 10).map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setSelectedProduct(p); setSearchTerm(""); }}
                                            className="w-full text-left p-3 hover:bg-slate-50 flex justify-between items-center transition-colors"
                                        >
                                            <div>
                                                <div className="font-semibold text-sm text-slate-800">{p.name}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">SKU: {p.sku}</div>
                                            </div>
                                            <div className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-[#00AFA9] hover:text-white rounded-md text-xs font-medium transition-colors">Chọn</div>
                                        </button>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <div className="p-4 text-center text-slate-400 text-xs">Không tìm thấy sản phẩm</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 border border-[#00AFA9]/30 bg-[#00AFA9]/5 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-slate-900 text-sm">{selectedProduct.name}</div>
                                    <div className="text-xs text-slate-600 mt-0.5">SKU: <span className="font-mono font-medium">{selectedProduct.sku}</span> • Đơn vị: <strong>{selectedProduct.unit || 'Cái'}</strong></div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        Hiện tại trong kho: <span className="font-bold text-[#00AFA9]">{currentStock ?? '...'}</span> {selectedProduct.unit || 'cái'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2.5 py-1 border border-rose-200 rounded-lg bg-white hover:bg-rose-50 transition-colors"
                                >
                                    Đổi sản phẩm
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quantity & Note */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Số lượng nhập</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00AFA9] transition-colors font-semibold text-slate-900"
                                value={quantity || ""}
                                onChange={e => setQuantity(Number(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú (Lý do)</label>
                            <input
                                type="text"
                                placeholder="VD: Nhập hàng nhà cung cấp..."
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#00AFA9] transition-colors"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !selectedProduct || quantity <= 0}
                        className="w-full py-3 bg-[#00AFA9] hover:bg-[#009a95] text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-sm"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Xác nhận Nhập Kho
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
