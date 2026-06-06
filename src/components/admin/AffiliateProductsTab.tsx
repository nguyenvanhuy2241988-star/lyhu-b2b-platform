import { useState, useEffect } from "react";
import { Search, Filter, Save, CheckSquare, Square } from "lucide-react";
import NextImage from "next/image";
import { supabase } from "@/lib/supabaseClient";

interface AffiliateProductsTabProps {
    affiliateId?: string; // Tùy chọn: Nếu có, sẽ cấu hình hoa hồng riêng cho CTV này
}

export function AffiliateProductsTab({ affiliateId }: AffiliateProductsTabProps) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filtering and selection
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("all");
    const [brands, setBrands] = useState<string[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

    // Bulk edit state
    const [bulkRate, setBulkRate] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);

    // Individual edit state tracking
    const [editedRates, setEditedRates] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, sku, brand, price, is_active, affiliate_commission_rate, image_url')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const prodData = data || [];
            let processedData = prodData;

            // Nếu có affiliateId, lấy thêm cấu hình riêng của họ
            if (affiliateId) {
                const { data: customRatesData } = await supabase
                    .from('affiliate_custom_rates')
                    .select('product_id, commission_rate')
                    .eq('affiliate_id', affiliateId);

                const customRatesMap = new Map(customRatesData?.map(c => [c.product_id, c.commission_rate]) || []);
                
                processedData = prodData.map((p: any) => ({
                    ...p,
                    custom_rate: customRatesMap.has(p.id) ? customRatesMap.get(p.id) : null
                }));
            }

            setProducts(processedData);

            // Extract unique brands
            const uniqueBrands = Array.from(new Set(prodData.map((p: any) => p.brand).filter(Boolean)));
            setBrands(uniqueBrands as string[]);
        } catch (error) {
            console.error("Error fetching products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRateChange = (id: string, value: string) => {
        const numVal = parseFloat(value) || 0;
        setEditedRates(prev => ({ ...prev, [id]: numVal }));
    };

    const saveIndividualRate = async (id: string) => {
        const rate = editedRates[id];
        if (rate === undefined) return;

        try {
            if (affiliateId) {
                // Upsert vào bảng affiliate_custom_rates
                const { error } = await supabase
                    .from('affiliate_custom_rates')
                    .upsert({ 
                        affiliate_id: affiliateId,
                        product_id: id,
                        commission_rate: rate 
                    }, { onConflict: 'affiliate_id,product_id' });

                if (error) throw error;
                setProducts(products.map(p => p.id === id ? { ...p, custom_rate: rate } : p));
            } else {
                const { error } = await supabase
                    .from('products')
                    .update({ affiliate_commission_rate: rate })
                    .eq('id', id);

                if (error) throw error;
                setProducts(products.map(p => p.id === id ? { ...p, affiliate_commission_rate: rate } : p));
            }
            
            // Update local state
            setProducts(products.map(p => p.id === id ? { ...p, affiliate_commission_rate: rate } : p));
            alert("Đã lưu mức hoa hồng mới cho sản phẩm!");
        } catch (error: any) {
            console.error("Lưu lỗi:", error);
            alert("Lỗi khi lưu: " + (error.message || "Hãy đảm bảo bạn đã chạy mã SQL cập nhật CSDL."));
        }
    };

    const toggleSelectAll = () => {
        if (selectedProductIds.size === filteredProducts.length) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedProductIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedProductIds(newSet);
    };

    const handleBulkSave = async () => {
        if (selectedProductIds.size === 0) {
            alert("Vui lòng chọn ít nhất 1 sản phẩm để cài đặt hàng loạt!");
            return;
        }

        setIsSaving(true);
        try {
            const idsArray = Array.from(selectedProductIds);
            
            if (affiliateId) {
                // Bulk upsert cho affiliate_custom_rates
                const upsertData = idsArray.map(id => ({
                    affiliate_id: affiliateId,
                    product_id: id,
                    commission_rate: bulkRate
                }));
                const { error } = await supabase
                    .from('affiliate_custom_rates')
                    .upsert(upsertData, { onConflict: 'affiliate_id,product_id' });
                if (error) throw error;
                setProducts(products.map(p => idsArray.includes(p.id) ? { ...p, custom_rate: bulkRate } : p));
            } else {
                const { error } = await supabase
                    .from('products')
                    .update({ affiliate_commission_rate: bulkRate })
                    .in('id', idsArray);
                if (error) throw error;
                setProducts(products.map(p => idsArray.includes(p.id) ? { ...p, affiliate_commission_rate: bulkRate } : p));
            }

            alert(`Đã cập nhật mức ${bulkRate}% cho ${idsArray.length} sản phẩm thành công!`);
            
            // Xóa state editedRates cho những id đã bulk
            const newEditedRates = { ...editedRates };
            idsArray.forEach(id => delete newEditedRates[id]);
            setEditedRates(newEditedRates);
            
            setSelectedProductIds(new Set());
        } catch (error: any) {
            console.error("Cập nhật hàng loạt lỗi:", error);
            alert("Lỗi cập nhật hàng loạt: " + (error.message || "Hãy đảm bảo bạn đã chạy mã SQL."));
        } finally {
            setIsSaving(false);
        }
    };

    // Filter logic
    const filteredProducts = products.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchBrand = selectedBrand === "all" || p.brand === selectedBrand;
        return matchSearch && matchBrand;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-1 gap-4 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text"
                            placeholder="Tìm tên sản phẩm, mã SKU..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <select
                            className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                        >
                            <option value="all">Tất cả Nhãn hiệu</option>
                            {brands.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
                        Đã chọn: <span className="text-primary-600 font-bold">{selectedProductIds.size}</span>
                    </span>
                    <div className="h-6 w-px bg-slate-300 mx-1"></div>
                    <input 
                        type="number"
                        min="0" max="100" step="0.5"
                        placeholder="Mức %"
                        className="w-20 px-2 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-primary-500"
                        value={bulkRate}
                        onChange={(e) => setBulkRate(Number(e.target.value))}
                    />
                    <button 
                        onClick={handleBulkSave}
                        disabled={isSaving || selectedProductIds.size === 0}
                        className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                    >
                        <Save size={16} /> Cài hàng loạt
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 w-12">
                                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-primary-600">
                                        {selectedProductIds.size > 0 && selectedProductIds.size === filteredProducts.length ? (
                                            <CheckSquare className="text-primary-600" size={20} />
                                        ) : (
                                            <Square size={20} />
                                        )}
                                    </button>
                                </th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Sản phẩm</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Nhãn hiệu</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Giá bán</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Hoa hồng Affiliate (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Đang tải danh sách sản phẩm...</td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Không tìm thấy sản phẩm nào.</td>
                                </tr>
                            ) : filteredProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <button onClick={() => toggleSelect(p.id)} className="text-slate-400 hover:text-primary-600">
                                            {selectedProductIds.has(p.id) ? (
                                                <CheckSquare className="text-primary-600" size={20} />
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                                                {p.image_url ? (
                                                    <NextImage src={p.image_url} alt={p.name} fill className="object-cover" />
                                                ) : (
                                                    <span className="text-xs text-slate-400">No img</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{p.name}</div>
                                                <div className="text-xs text-slate-500">SKU: {p.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {p.brand ? <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">{p.brand}</span> : '-'}
                                    </td>
                                    <td className="p-4 text-slate-600 font-medium">
                                        {Number(p.price).toLocaleString()}đ
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number"
                                                min="0" max="100" step="0.5"
                                                placeholder={affiliateId ? (p.affiliate_commission_rate > 0 ? `Chung: ${p.affiliate_commission_rate}%` : 'Mặc định') : 'Mặc định'}
                                                className={`w-24 px-2 py-1.5 text-sm border rounded-md outline-none focus:ring-2 focus:ring-primary-500 ${affiliateId && p.custom_rate !== null ? 'border-amber-400 bg-amber-50 text-amber-700 font-bold' : 'border-slate-300'}`}
                                                value={editedRates[p.id] !== undefined ? editedRates[p.id] : (affiliateId ? (p.custom_rate ?? '') : (p.affiliate_commission_rate || ''))}
                                                onChange={(e) => handleRateChange(p.id, e.target.value)}
                                            />
                                            <span className="text-slate-500">%</span>
                                            
                                            {editedRates[p.id] !== undefined && editedRates[p.id] !== (affiliateId ? p.custom_rate : p.affiliate_commission_rate) && (
                                                <button 
                                                    onClick={() => saveIndividualRate(p.id)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="Lưu mức hoa hồng"
                                                >
                                                    <Save size={16} />
                                                </button>
                                            )}
                                        </div>
                                        {affiliateId ? (
                                            p.custom_rate !== null ? (
                                                <div className="text-xs text-amber-600 mt-1 font-medium">Áp dụng mức riêng này</div>
                                            ) : p.affiliate_commission_rate > 0 ? (
                                                <div className="text-xs text-slate-500 mt-1">Sẽ dùng chung: {p.affiliate_commission_rate}%</div>
                                            ) : (
                                                <div className="text-xs text-slate-400 mt-1">Sẽ dùng mặc định của KOL</div>
                                            )
                                        ) : (
                                            !(p.affiliate_commission_rate > 0) && (
                                                <div className="text-xs text-slate-400 mt-1">Sẽ dùng % mặc định của KOL</div>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
