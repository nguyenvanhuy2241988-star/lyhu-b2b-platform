"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    fetchMasterProducts, updateProductMisa, MisaProduct,
    fetchMisaProducts, autoMapMisaProducts, MisaItem,
    batchMapProducts
} from "@/lib/masterDataStore";
import {
    fetchCustomers, updateCustomer, Customer
} from "@/lib/crmDealsStore";
import { fetchAppSettings, updateAppSettings, AppSettings } from "@/lib/settingsStore";
import {
    Search, Filter, Loader2, Save, X, Pencil,
    Building2, Package, CheckCircle2, AlertCircle,
    Copy, ExternalLink, Database, Settings,
    RefreshCw, Zap, ChevronDown, Upload, FileText, ClipboardPaste
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AccountantMasterDataPage() {
    const { session } = useAuth();
    const [activeTab, setActiveTab] = useState<"products" | "customers" | "config">("products");
    const [products, setProducts] = useState<MisaProduct[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Config State
    const [appSettingsId, setAppSettingsId] = useState<string | null>(null);
    const [misaConfig, setMisaConfig] = useState({
        apiUrl: "https://openservice.misa.com.vn",
        appId: "",
        accessCode: "",
        companyCode: ""
    });

    // Edit State
    const [editingItem, setEditingItem] = useState<{ id: string; type: "product" | "customer"; value: string; tax_code?: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // MISA Sync State
    const [misaItems, setMisaItems] = useState<MisaItem[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isAutoMapping, setIsAutoMapping] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);
    const [misaSearch, setMisaSearch] = useState("");
    const [showMisaDropdown, setShowMisaDropdown] = useState(false);

    // Import Modal State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState("");
    const [importPreview, setImportPreview] = useState<{ matched: { misaCode: string; misaName: string; productId: string; currentName: string; matchType: string }[]; unmatched: string[]; unmatchedApp: { name: string; sku: string }[] }>({ matched: [], unmatched: [], unmatchedApp: [] });
    const [isImporting, setIsImporting] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === "products") {
                const data = await fetchMasterProducts(session?.access_token);
                setProducts(data);
            } else if (activeTab === "customers") {
                const data = await fetchCustomers(undefined, session?.access_token);
                setCustomers(data);
            } else if (activeTab === "config") {
                const settings = await fetchAppSettings(session?.access_token);
                if (settings) {
                    setAppSettingsId(settings.id);
                    // @ts-ignore
                    if (settings.misa_config) {
                        // @ts-ignore
                        setMisaConfig({ ...misaConfig, ...settings.misa_config });
                    }
                }
            }
        } catch (err) {
            console.error("Load Master Data error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [session, activeTab]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSaveMisa = async () => {
        if (!editingItem) return;
        setIsSaving(true);
        try {
            let success = false;
            if (editingItem.type === "product") {
                success = await updateProductMisa(editingItem.id, editingItem.value, session?.access_token);
            } else {
                success = await updateCustomer(editingItem.id, {
                    misa_code: editingItem.value,
                    tax_code: editingItem.tax_code
                }, session?.access_token);
            }

            if (success) {
                setEditingItem(null);
                loadData();
            } else {
                alert("Lưu thất bại.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!appSettingsId) return;
        setIsSaving(true);
        try {
            const success = await updateAppSettings(appSettingsId, {
                // @ts-ignore
                misa_config: misaConfig
            }, session?.access_token);

            if (success) {
                alert("Đã lưu cấu hình Misa!");
            } else {
                alert("Lưu cấu hình thất bại.");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi lưu cấu hình.");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredItemsSize = activeTab === "products"
        ? products.filter(p => (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase())).length
        : customers.filter(c => (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (c.tax_code || "").includes(searchQuery)).length;

    // Stats
    const mappedCount = products.filter(p => p.misa_code).length;
    const totalCount = products.length;

    // Handlers for MISA sync
    const handleSyncMisa = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        try {
            const result = await fetchMisaProducts();
            if (result.success) {
                setMisaItems(result.items);
                setSyncResult(`✅ Đã tải ${result.items.length} sản phẩm từ MISA`);
            } else {
                setSyncResult(`❌ Lỗi: ${result.error}`);
            }
        } catch (e: any) {
            setSyncResult(`❌ Lỗi: ${e.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAutoMap = async () => {
        setIsAutoMapping(true);
        setSyncResult(null);
        try {
            const result = await autoMapMisaProducts();
            if (result.success) {
                setSyncResult(`⚡ Auto-Map: ${result.matched} khớp, ${result.unmatched} chưa khớp`);
                loadData();
            } else {
                setSyncResult(`❌ Lỗi: ${result.error}`);
            }
        } catch (e: any) {
            setSyncResult(`❌ Lỗi: ${e.message}`);
        } finally {
            setIsAutoMapping(false);
        }
    };

    // Parse pasted text from MISA Excel/table
    const handleParseImport = (text: string) => {
        setImportText(text);
        if (!text.trim()) {
            setImportPreview({ matched: [], unmatched: [], unmatchedApp: [] });
            return;
        }
        const lines = text.split('\n').filter(l => l.trim());
        const matched: { misaCode: string; misaName: string; productId: string; currentName: string; matchType: string }[] = [];
        const unmatched: string[] = [];
        const usedIds = new Set<string>();

        for (const line of lines) {
            const parts = line.split('\t').map(p => p.trim()).filter(Boolean);
            if (parts.length < 2) {
                unmatched.push(line.trim());
                continue;
            }

            // Scan ALL columns: find numeric codes and longest text (=name)
            const numericCols: string[] = [];
            let longestText = '';
            for (const p of parts) {
                if (/^\d{4,}$/.test(p) || /^[A-Z0-9_-]{2,10}$/i.test(p)) {
                    numericCols.push(p);
                } else if (p.length > longestText.length) {
                    longestText = p;
                }
            }

            const misaName = longestText || parts[1] || parts[0];

            // Priority 1: Match ANY numeric column against ANY product SKU
            let matchedProduct: typeof products[0] | undefined;
            let matchedMisaCode = '';
            let matchType = '';

            for (const code of numericCols) {
                const cleanCode = code.replace(/\s+/g, '').trim();
                matchedProduct = products.find(p => {
                    if (usedIds.has(p.id)) return false;
                    const cleanSku = (p.sku || '').replace(/\s+/g, '').trim();
                    return cleanSku && (cleanSku === cleanCode || cleanSku.includes(cleanCode) || cleanCode.includes(cleanSku));
                });
                if (matchedProduct) {
                    matchedMisaCode = code;
                    matchType = 'SKU';
                    break;
                }
            }

            // Priority 2: Match by name (fuzzy - word overlap)
            if (!matchedProduct) {
                const misaWords = misaName.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF ]/gi, '').split(/\s+/).filter(w => w.length > 1);
                let bestScore = 0;
                let bestProduct: typeof products[0] | undefined;

                for (const p of products) {
                    if (usedIds.has(p.id)) continue;
                    const pWords = (p.name || '').toLowerCase().replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF ]/gi, '').split(/\s+/).filter(w => w.length > 1);
                    const overlap = misaWords.filter(w => pWords.includes(w)).length;
                    const score = overlap / Math.max(misaWords.length, pWords.length, 1);
                    if (score > bestScore && score >= 0.5) { // At least 50% word overlap
                        bestScore = score;
                        bestProduct = p;
                    }
                }

                if (bestProduct) {
                    matchedProduct = bestProduct;
                    matchedMisaCode = numericCols[0] || '';
                    matchType = `Tên (${Math.round(bestScore * 100)}%)`;
                }
            }

            if (matchedProduct && matchedMisaCode) {
                usedIds.add(matchedProduct.id);
                matched.push({ misaCode: matchedMisaCode, misaName, productId: matchedProduct.id, currentName: matchedProduct.name || '', matchType });
            } else {
                unmatched.push(`${numericCols[0] || '?'} — ${misaName}`);
            }
        }

        // Find app products that didn't match
        const unmatchedApp = products
            .filter(p => !usedIds.has(p.id) && !p.misa_code)
            .map(p => ({ name: p.name || '', sku: p.sku || '' }));

        setImportPreview({ matched, unmatched, unmatchedApp });
    };

    // Execute batch import
    const handleExecuteImport = async () => {
        if (importPreview.matched.length === 0) return;
        setIsImporting(true);
        try {
            const mappings = importPreview.matched.map(m => ({
                product_id: m.productId,
                misa_code: m.misaCode,
                name: m.misaName, // Sync name from MISA
            }));
            const result = await batchMapProducts(mappings);
            if (result.success) {
                setSyncResult(`✅ Đã map ${result.updated}/${result.total} sản phẩm thành công`);
                setShowImportModal(false);
                setImportText('');
                setImportPreview({ matched: [], unmatched: [], unmatchedApp: [] });
                loadData();
            } else {
                setSyncResult(`❌ Lỗi: ${result.error}`);
            }
        } catch (e: any) {
            setSyncResult(`❌ Lỗi: ${e.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    // Filtered MISA items for dropdown
    const filteredMisaItems = useMemo(() => {
        if (!misaSearch.trim()) return misaItems.slice(0, 50);
        const q = misaSearch.toLowerCase();
        return misaItems.filter(m =>
            m.inventory_item_code.toLowerCase().includes(q) ||
            m.inventory_item_name.toLowerCase().includes(q)
        ).slice(0, 50);
    }, [misaItems, misaSearch]);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Danh mục & Cấu hình MISA</h1>
                    <p className="text-sm text-slate-600 mt-1">Đồng bộ mã danh mục và thiết lập kết nối tới Misa Amis</p>
                </div>
                {activeTab === "products" && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 flex items-center gap-2 text-sm shadow-sm"
                        >
                            <ClipboardPaste className="w-4 h-4" />
                            Import từ MISA
                        </button>
                        <button
                            onClick={handleAutoMap}
                            disabled={isAutoMapping}
                            className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 text-sm shadow-sm"
                        >
                            {isAutoMapping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Auto-Map SKU
                        </button>
                    </div>
                )}
            </div>

            {/* Progress Bar + Sync Result */}
            {activeTab === "products" && totalCount > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                            <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-500" />
                            {mappedCount}/{totalCount} đã map ({totalCount > 0 ? Math.round(mappedCount / totalCount * 100) : 0}%)
                        </span>
                        {misaItems.length > 0 && (
                            <span className="text-blue-600 text-xs">📦 {misaItems.length} SP từ MISA đã tải</span>
                        )}
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${totalCount > 0 ? (mappedCount / totalCount) * 100 : 0}%` }}
                        />
                    </div>
                    {syncResult && (
                        <p className={`text-sm font-medium ${syncResult.startsWith('❌') ? 'text-red-600' : 'text-emerald-600'}`}>
                            {syncResult}
                        </p>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-200 gap-8">
                <button
                    onClick={() => { setActiveTab("products"); setSearchQuery(""); }}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "products" ? "text-primary-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Sản phẩm ({products.length})
                    </div>
                    {activeTab === "products" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />}
                </button>
                <button
                    onClick={() => { setActiveTab("customers"); setSearchQuery(""); }}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "customers" ? "text-primary-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Khách hàng ({customers.length})
                    </div>
                    {activeTab === "customers" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />}
                </button>
                <button
                    onClick={() => { setActiveTab("config"); setSearchQuery(""); }}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "config" ? "text-primary-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Cấu hình Kết nối
                    </div>
                    {activeTab === "config" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />}
                </button>
            </div>

            {/* Config Content */}
            {activeTab === "config" ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-2xl">
                    <h3 className="font-bold text-lg text-slate-900 mb-4">Thông tin kết nối Misa Amis (Open API)</h3>
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">API URL</label>
                                <input
                                    value={misaConfig.apiUrl}
                                    onChange={(e) => setMisaConfig({ ...misaConfig, apiUrl: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="https://openservice.misa.com.vn"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">App ID (Client ID)</label>
                                <input
                                    value={misaConfig.appId}
                                    onChange={(e) => setMisaConfig({ ...misaConfig, appId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Nhập App ID..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Access Code (Secret)</label>
                                <input
                                    value={misaConfig.accessCode}
                                    onChange={(e) => setMisaConfig({ ...misaConfig, accessCode: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    type="password"
                                    placeholder="Nhập Access Code..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Mã Chi nhánh (Company Code)</label>
                                <input
                                    value={misaConfig.companyCode}
                                    onChange={(e) => setMisaConfig({ ...misaConfig, companyCode: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="ví dụ: hcm_branch"
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleSaveConfig}
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu Cấu hình
                                </button>

                                <button
                                    onClick={async () => {
                                        setIsSaving(true);
                                        try {
                                            const res = await fetch('/api/misa/test', { method: 'POST' });
                                            const data = await res.json();
                                            if (data.success) {
                                                alert("✅ " + data.message);
                                            } else {
                                                alert("❌ Kết nối thất bại: " + data.error);
                                            }
                                        } catch (e) {
                                            alert("❌ Lỗi mạng hoặc server internal error");
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-white text-slate-700 border border-slate-300 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin hidden" />
                                    Kiểm tra kết nối
                                </button>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                                <p className="font-bold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Lưu ý:
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Thông tin này được dùng để tự động đẩy đơn hàng sang Amis Kế toán.</li>
                                    <li>Đảm bảo App ID và Access Code chính xác từ trang quản trị Misa Developer.</li>
                                    <li>Mã chi nhánh cần khớp với dữ liệu bên Misa.</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={activeTab === "products" ? "Tìm theo tên hoặc SKU..." : "Tìm tên hoặc Mã số thuế..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Content Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                            </div>
                        ) : filteredItemsSize === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Database className="w-12 h-12 text-slate-200 mb-4" />
                                <p className="text-slate-500">Không tìm thấy kết quả.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                                        <tr>
                                            <th className="px-6 py-4">{activeTab === "products" ? "Sản phẩm / SKU" : "Khách hàng / Tên"}</th>
                                            <th className="px-6 py-4">{activeTab === "products" ? "Đơn vị" : "Mã số thuế"}</th>
                                            <th className="px-6 py-4">Mã MISA</th>
                                            <th className="px-6 py-4 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {activeTab === "products" ? (
                                            products.filter(p => (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900">{p.name || "Không tên"}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono tracking-wider">{p.sku || "N/A"}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 lowercase">
                                                        {p.unit || "Cái/Hộp"}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {p.misa_code ? (
                                                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs font-mono font-bold">
                                                                {p.misa_code}
                                                            </span>
                                                        ) : (
                                                            <span className="text-orange-400 text-xs italic">Chưa map</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setEditingItem({ id: p.id, type: "product", value: p.misa_code || "" })}
                                                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            customers.filter(c => (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (c.tax_code || "").includes(searchQuery)).map((c) => (
                                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900">{c.name || "Không tên"}</div>
                                                        <div className="text-[10px] text-slate-400 uppercase">{c.type}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        {c.tax_code || <span className="text-slate-300 italic">Thiếu MST</span>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {c.misa_code ? (
                                                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs font-mono font-bold">
                                                                {c.misa_code}
                                                            </span>
                                                        ) : (
                                                            <span className="text-orange-400 text-xs italic">Chưa map</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setEditingItem({ id: c.id, type: "customer", value: c.misa_code || "", tax_code: c.tax_code || "" })}
                                                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )
            }

            {/* Edit Modal (Existing code unchanged) */}
            {
                editingItem && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <h3 className="font-bold text-slate-900">Thiết lập Mã MISA</h3>
                                <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-slate-200 rounded-lg">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                {editingItem.type === "customer" && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mã số thuế</label>
                                        <input
                                            value={editingItem.tax_code || ""}
                                            onChange={(e) => setEditingItem({ ...editingItem, tax_code: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Nhập MST khách hàng..."
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mã định danh MISA</label>
                                    <div className="relative">
                                        <input
                                            value={editingItem.value}
                                            onChange={(e) => {
                                                setEditingItem({ ...editingItem, value: e.target.value });
                                                setMisaSearch(e.target.value);
                                                setShowMisaDropdown(true);
                                            }}
                                            onFocus={() => {
                                                if (misaItems.length === 0) handleSyncMisa();
                                                setShowMisaDropdown(true);
                                            }}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none pr-8"
                                            placeholder={editingItem.type === "product" ? "Nhập hoặc chọn từ MISA..." : "Ví dụ: KH001"}
                                        />
                                        {editingItem.type === "product" && (
                                            <button
                                                onClick={() => setShowMisaDropdown(!showMisaDropdown)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        )}

                                        {/* MISA Products Dropdown */}
                                        {showMisaDropdown && editingItem.type === "product" && misaItems.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                {isSyncing ? (
                                                    <div className="p-3 text-center text-sm text-slate-400">
                                                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />Đang tải...
                                                    </div>
                                                ) : filteredMisaItems.length === 0 ? (
                                                    <div className="p-3 text-center text-sm text-slate-400">Không tìm thấy</div>
                                                ) : (
                                                    filteredMisaItems.map((item) => (
                                                        <button
                                                            key={item.inventory_item_code}
                                                            onClick={() => {
                                                                setEditingItem({ ...editingItem, value: item.inventory_item_code });
                                                                setShowMisaDropdown(false);
                                                                setMisaSearch("");
                                                            }}
                                                            className="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm flex justify-between items-center border-b border-slate-50 last:border-0"
                                                        >
                                                            <div>
                                                                <span className="font-mono text-primary-600 font-bold text-xs">{item.inventory_item_code}</span>
                                                                <span className="text-slate-600 ml-2">{item.inventory_item_name}</span>
                                                            </div>
                                                            {item.unit_name && (
                                                                <span className="text-xs text-slate-400">{item.unit_name}</span>
                                                            )}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 italic">
                                        {misaItems.length > 0
                                            ? `💡 Gõ để tìm trong ${misaItems.length} SP từ MISA, hoặc nhập tay mã.`
                                            : '* Click vào ô để tải danh sách MISA, hoặc nhập tay mã.'
                                        }
                                    </p>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={() => setEditingItem(null)}
                                        className="flex-1 px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleSaveMisa}
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                    <ClipboardPaste className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Import từ MISA</h3>
                                    <p className="text-xs text-slate-400">Dán dữ liệu từ Excel/MISA để auto-map</p>
                                </div>
                            </div>
                            <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 text-sm">
                            <p className="text-blue-800 font-medium">📋 Hướng dẫn:</p>
                            <ol className="text-blue-700 text-xs mt-1 list-decimal list-inside space-y-0.5">
                                <li>Mở MISA → Danh mục → Vật tư hàng hóa</li>
                                <li>Chọn tất cả → Copy (Ctrl+C) các cột <b>Mã</b> và <b>Tên</b></li>
                                <li>Paste (Ctrl+V) vào ô bên dưới</li>
                            </ol>
                        </div>

                        {/* Textarea */}
                        <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4">
                            <textarea
                                value={importText}
                                onChange={(e) => handleParseImport(e.target.value)}
                                placeholder={"Dán dữ liệu ở đây...\n\nVí dụ (tab-separated):\n00001\tHàng xá bành phồng tôm\n00002\tHàng xá bành phồng cua\n6971443680729\tKhoai môn sấy vị cay từ xuyên 75g"}
                                className="w-full h-40 px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono resize-none focus:ring-2 focus:ring-primary-500 outline-none"
                            />

                            {/* Preview Results */}
                            {importText.trim() && (
                                <div className="space-y-3">
                                    {/* Matched */}
                                    {importPreview.matched.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Khớp: {importPreview.matched.length} sản phẩm
                                            </h4>
                                            <div className="mt-1 bg-emerald-50 rounded-lg p-2 max-h-32 overflow-y-auto">
                                                {importPreview.matched.map((m, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                                                        <span className={`px-1 rounded text-[10px] font-bold ${m.matchType === 'SKU' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{m.matchType}</span>
                                                        <span className="font-mono text-emerald-700 font-bold">{m.misaCode}</span>
                                                        <span className="text-slate-400">→</span>
                                                        <span className="text-slate-600">{m.misaName}</span>
                                                        {m.currentName !== m.misaName && (
                                                            <span className="text-orange-500 text-[10px]">(đổi tên)</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Unmatched */}
                                    {importPreview.unmatched.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-600 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" />
                                                Chưa khớp: {importPreview.unmatched.length} dòng
                                            </h4>
                                            <div className="mt-1 bg-amber-50 rounded-lg p-2 max-h-24 overflow-y-auto">
                                                {importPreview.unmatched.slice(0, 10).map((u, i) => (
                                                    <div key={i} className="text-xs text-amber-700 py-0.5 truncate">{u}</div>
                                                ))}
                                                {importPreview.unmatched.length > 10 && (
                                                    <p className="text-xs text-amber-500 mt-1">...và {importPreview.unmatched.length - 10} dòng khác</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* App Products Not Matched */}
                                    {importPreview.unmatchedApp.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-red-600 flex items-center gap-1">
                                                <Package className="w-4 h-4" />
                                                SP trong app chưa khớp: {importPreview.unmatchedApp.length}
                                            </h4>
                                            <div className="mt-1 bg-red-50 rounded-lg p-2 max-h-32 overflow-y-auto">
                                                {importPreview.unmatchedApp.map((p, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                                                        <span className="font-mono text-red-600 font-bold min-w-[110px]">{p.sku || 'no-sku'}</span>
                                                        <span className="text-slate-600">{p.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-red-400 mt-1 italic">So sánh SKU trên với mã MISA trong phần &quot;Chưa khớp&quot; để tìm lý do</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-xs text-slate-400">
                                {importPreview.matched.length > 0 && `${importPreview.matched.length} SP sẽ được cập nhật`}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-sm"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleExecuteImport}
                                    disabled={isImporting || importPreview.matched.length === 0}
                                    className="px-6 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                                >
                                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Áp dụng {importPreview.matched.length > 0 ? `(${importPreview.matched.length})` : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
