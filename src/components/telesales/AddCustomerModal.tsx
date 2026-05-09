"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Copy, User, MessageSquare, MapPin, Building, Info } from "lucide-react";
import { Customer, createCustomer, updateCustomer } from "@/lib/crmDealsStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { PROVINCES, fetchWards, LocationOption, fetchLegacyProvinces, fetchLegacyDistricts, fetchLegacyWards } from "@/lib/vn-locations";

const CUSTOMER_TYPES = [
    { value: 'tap_hoa', label: 'Tạp hóa' },
    { value: 'mini_mart', label: 'Mini mart' },
    { value: 'dai_ly', label: 'Đại lý' },
    { value: 'npp', label: 'Nhà phân phối' },
    { value: 'sieu_thi', label: 'Siêu thị' },
    { value: 'nha_thuoc', label: 'Nhà thuốc' },
    { value: 'khac', label: 'Khác' },
];

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Customer | null;
}

export default function AddCustomerModal({ isOpen, onClose, onSuccess, initialData }: AddCustomerModalProps) {
    const { user, session } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        type: "tap_hoa",
        tax_code: "",
        contact_person: "",
        phone: "",
        zalo: "",
        email: "",
        address: "",
        province: "",
        district: "",
        ward: "",
        notes: "",
        old_address: ""
    });

    // Location State (2-cấp sau sáp nhập 2025: Tỉnh/Thành → Phường/Xã)
    const [wards, setWards] = useState<LocationOption[]>([]);
    const [loadingWards, setLoadingWards] = useState(false);

    // Legacy Location State
    const [legacyProvinces, setLegacyProvinces] = useState<LocationOption[]>([]);
    const [legacyDistricts, setLegacyDistricts] = useState<LocationOption[]>([]);
    const [legacyWards, setLegacyWards] = useState<LocationOption[]>([]);
    const [loadingLegacyDistricts, setLoadingLegacyDistricts] = useState(false);
    const [loadingLegacyWards, setLoadingLegacyWards] = useState(false);
    
    const [legacyP, setLegacyP] = useState("");
    const [legacyD, setLegacyD] = useState("");
    const [legacyW, setLegacyW] = useState("");

    // Load legacy provinces on mount
    useEffect(() => {
        fetchLegacyProvinces().then(data => setLegacyProvinces(data));
    }, []);

    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Init data
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || "",
                    type: initialData.type || "tap_hoa",
                    tax_code: initialData.tax_code || "",
                    contact_person: initialData.contact_person || "",
                    phone: initialData.phone || "",
                    zalo: initialData.zalo || "",
                    email: initialData.email || "",
                    address: initialData.address || "",
                    province: initialData.province || "",
                    district: initialData.district || "",
                    ward: initialData.ward || "",
                    notes: initialData.notes || "",
                    old_address: initialData.old_address || ""
                });

                // Initialize wards if province exists
                if (initialData.province) onProvinceChange(initialData.province, false);
            } else {
                setFormData({
                    name: "",
                    type: "tap_hoa",
                    tax_code: "",
                    contact_person: "",
                    phone: "",
                    zalo: "",
                    email: "",
                    address: "",
                    province: "",
                    district: "",
                    ward: "",
                    notes: "",
                    old_address: ""
                });
                setWards([]);
            }
            
            // Reset legacy dropdowns
            setLegacyP("");
            setLegacyD("");
            setLegacyW("");
            setLegacyDistricts([]);
            setLegacyWards([]);
            
            setErrors({});
        }
    }, [isOpen, initialData]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const onProvinceChange = async (provinceName: string, resetLower = true) => {
        handleChange('province', provinceName);
        if (resetLower) {
            setFormData(prev => ({ ...prev, ward: "" }));
            setWards([]);
        }

        const province = PROVINCES.find(p => p.value === provinceName);
        if (province) {
            setLoadingWards(true);
            const data = await fetchWards(province.code);
            setWards(data);
            setLoadingWards(false);
        }
    };

    const onLegacyProvinceChange = async (pCode: string) => {
        setLegacyP(pCode);
        setLegacyD("");
        setLegacyW("");
        setLegacyWards([]);
        
        if (pCode) {
            setLoadingLegacyDistricts(true);
            const data = await fetchLegacyDistricts(pCode);
            setLegacyDistricts(data);
            setLoadingLegacyDistricts(false);
        } else {
            setLegacyDistricts([]);
        }
    };

    const onLegacyDistrictChange = async (dCode: string) => {
        setLegacyD(dCode);
        setLegacyW("");
        
        if (dCode) {
            setLoadingLegacyWards(true);
            const data = await fetchLegacyWards(dCode);
            setLegacyWards(data);
            setLoadingLegacyWards(false);
        } else {
            setLegacyWards([]);
        }
    };

    const onLegacyWardChange = (wCode: string) => {
        setLegacyW(wCode);
        if (wCode && legacyP && legacyD) {
            const pName = legacyProvinces.find(x => x.code === legacyP)?.label || "";
            const dName = legacyDistricts.find(x => x.code === legacyD)?.label || "";
            const wName = legacyWards.find(x => x.code === wCode)?.label || "";
            const fullLegacy = [wName, dName, pName].filter(Boolean).join(", ");
            handleChange('old_address', fullLegacy);
        } else {
            handleChange('old_address', "");
        }
    };

    const copyPhoneToZalo = () => {
        if (formData.phone) {
            handleChange('zalo', formData.phone);
            toast.success("Đã copy số điện thoại sang Zalo");
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Vui lòng nhập tên cửa hàng";
        if (!formData.phone.trim()) {
            newErrors.phone = "Vui lòng nhập số điện thoại";
        } else if (!/^\d{8,12}$/.test(formData.phone.trim())) {
            newErrors.phone = "Số điện thoại không hợp lệ";
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        if (!user || !session?.access_token) {
            toast.error("Phiên đăng nhập hết hạn");
            return;
        }

        setIsSaving(true);
        try {
            // Build full address string
            // "123 Le Loi, P. Ben Thanh, Quan 1, TP. HCM"
            const addressParts = [
                formData.address,
                formData.ward,
                formData.district,
                formData.province
            ].filter(Boolean);
            const fullAddress = addressParts.join(", ");

            const payload = {
                ...formData,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                // Store explicit fields
                province: formData.province,
                district: formData.district,
                ward: formData.ward,
                // Also update legacy address field primarily for display
                address: fullAddress,
                old_address: formData.old_address.trim() || undefined
            };

            if (initialData) {
                const success = await updateCustomer(initialData.id, payload, session.access_token);
                if (success) {
                    toast.success("Cập nhật khách hàng thành công");
                    onSuccess();
                    onClose();
                } else {
                    toast.error("Không thể cập nhật. Vui lòng thử lại.");
                }
            } else {
                const newCustomer = await createCustomer({
                    ...payload,
                    owner_user_id: user.id,
                    status: 'active'
                }, session.access_token);

                if (newCustomer) {
                    toast.success("Thêm khách hàng thành công");
                    onSuccess();
                    onClose();
                } else {
                    toast.error("Không thể tạo mới. Vui lòng thử lại.");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {initialData ? "Cập nhật thông tin khách hàng" : "Thêm khách hàng mới"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Nhập thông tin chi tiết để quản lý khách hàng tốt hơn
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column 1: Store Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b">
                                <Building className="w-4 h-4 text-indigo-600" />
                                Thông tin Cửa hàng
                            </h3>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Tên cửa hàng <span className="text-red-500">*</span></label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none ${errors.name ? 'border-red-500' : 'border-slate-300'}`}
                                    placeholder="Ví dụ: Tạp hóa Cô Ba"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Mã số thuế</label>
                                <input
                                    value={formData.tax_code}
                                    onChange={(e) => handleChange('tax_code', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Loại hình</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                                >
                                    {CUSTOMER_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Ghi chú</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* Column 2: Contact Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b">
                                <User className="w-4 h-4 text-indigo-600" />
                                Liên hệ & Địa chỉ
                            </h3>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Người liên hệ</label>
                                <input
                                    value={formData.contact_person}
                                    onChange={(e) => handleChange('contact_person', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Số điện thoại <span className="text-red-500">*</span></label>
                                    <input
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none ${errors.phone ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                                </div>
                                <div className="space-y-1.5 relative">
                                    <label className="text-sm font-medium text-slate-700 flex justify-between">
                                        Zalo
                                        <button onClick={copyPhoneToZalo} type="button" className="text-indigo-600 text-xs hover:underline flex items-center gap-1">
                                            <Copy className="w-3 h-3" /> Copy
                                        </button>
                                    </label>
                                    <input
                                        value={formData.zalo}
                                        onChange={(e) => handleChange('zalo', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Tỉnh / Thành phố</label>
                                <select
                                    value={formData.province}
                                    onChange={(e) => onProvinceChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                                >
                                    <option value="">-- Chọn Tỉnh/Thành --</option>
                                    {PROVINCES.map(p => (
                                        <option key={p.code} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Phường / Xã</label>
                                <div className="relative">
                                    <select
                                        value={formData.ward}
                                        onChange={(e) => handleChange('ward', e.target.value)}
                                        disabled={!formData.province || loadingWards}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white disabled:bg-slate-100"
                                    >
                                        <option value="">-- Chọn Phường/Xã --</option>
                                        {wards.map(w => (
                                            <option key={w.code} value={w.value}>{w.label}</option>
                                        ))}
                                    </select>
                                    {loadingWards && <Loader2 className="absolute right-8 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Số nhà, Tên đường</label>
                                <input
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    placeholder="Số 123..."
                                />
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-100">
                                <h4 className="text-sm font-semibold text-slate-800 mb-3">Địa chỉ cũ (Trước sáp nhập - Giao hàng)</h4>
                                
                                {formData.old_address && !legacyP && (
                                    <div className="mb-3 text-sm text-slate-600 bg-amber-50 p-3 rounded border border-amber-100">
                                        <strong>Đang lưu:</strong> {formData.old_address}
                                        <div className="text-xs text-slate-400 mt-1">Chọn lại bên dưới nếu muốn thay đổi</div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Tỉnh / Thành phố (Cũ)</label>
                                        <select
                                            value={legacyP}
                                            onChange={(e) => onLegacyProvinceChange(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                                        >
                                            <option value="">-- Chọn Tỉnh/Thành cũ --</option>
                                            {legacyProvinces.map(p => (
                                                <option key={p.code} value={p.code}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Quận / Huyện (Cũ)</label>
                                            <div className="relative">
                                                <select
                                                    value={legacyD}
                                                    onChange={(e) => onLegacyDistrictChange(e.target.value)}
                                                    disabled={!legacyP || loadingLegacyDistricts}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white disabled:bg-slate-100"
                                                >
                                                    <option value="">-- Chọn Quận/Huyện cũ --</option>
                                                    {legacyDistricts.map(d => (
                                                        <option key={d.code} value={d.code}>{d.label}</option>
                                                    ))}
                                                </select>
                                                {loadingLegacyDistricts && <Loader2 className="absolute right-8 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Phường / Xã (Cũ)</label>
                                            <div className="relative">
                                                <select
                                                    value={legacyW}
                                                    onChange={(e) => onLegacyWardChange(e.target.value)}
                                                    disabled={!legacyD || loadingLegacyWards}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white disabled:bg-slate-100"
                                                >
                                                    <option value="">-- Chọn Phường/Xã cũ --</option>
                                                    {legacyWards.map(w => (
                                                        <option key={w.code} value={w.code}>{w.label}</option>
                                                    ))}
                                                </select>
                                                {loadingLegacyWards && <Loader2 className="absolute right-8 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-start gap-2 bg-blue-50 p-3 rounded-lg text-blue-700 text-sm">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>Thông tin đầy đủ sẽ giúp đội ngũ Sales và CSKH làm việc hiệu quả hơn. Vui lòng kiểm tra kỹ số điện thoại.</p>
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 sticky bottom-0 z-10 backdrop-blur-md">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-white border border-transparent hover:border-slate-300 rounded-lg text-sm font-medium transition-all">
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {initialData ? "Lưu thay đổi" : "Thêm khách hàng"}
                    </button>
                </div>
            </div>
        </div>
    );
}
