"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    fetchMasterProducts, updateProductMisa, MisaProduct
} from "@/lib/masterDataStore";
import {
    fetchCustomers, updateCustomer, Customer
} from "@/lib/crmDealsStore";
import { fetchAppSettings, updateAppSettings, AppSettings } from "@/lib/settingsStore";
import {
    Search, Filter, Loader2, Save, X, Pencil,
    Building2, Package, CheckCircle2, AlertCircle,
    Copy, ExternalLink, Database, Settings
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
        ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())).length
        : customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.tax_code?.includes(searchQuery)).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Danh mục & Cấu hình MISA</h1>
                <p className="text-sm text-slate-600 mt-1">Đồng bộ mã danh mục và thiết lập kết nối tới Misa Amis</p>
            </div>

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
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50"
                                    disabled
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
                                            products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900">{p.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono tracking-wider">{p.sku}</div>
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
                                            customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.tax_code?.includes(searchQuery)).map((c) => (
                                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900">{c.name}</div>
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
            )}

            {/* Edit Modal (Existing code unchanged) */}
            {editingItem && (
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
                                <input
                                    value={editingItem.value}
                                    onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder={editingItem.type === "product" ? "Ví dụ: SP001" : "Ví dụ: KH001"}
                                />
                                <p className="text-[10px] text-slate-400 mt-1 italic">
                                    * Mã này phải khớp với mã đã khai báo trong danh mục của MISA AMIS/SME.
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
            )}
        </div>
    );
}
