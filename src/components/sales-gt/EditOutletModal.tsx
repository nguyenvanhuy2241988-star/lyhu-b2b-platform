"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Copy, User, MapPin, Building, Info } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

const OUTLET_TYPES = [
    { value: 'tap_hoa', label: 'Tạp hóa' },
    { value: 'mini_mart', label: 'Mini mart' },
    { value: 'dai_ly', label: 'Đại lý' },
    { value: 'npp', label: 'Nhà phân phối' },
    { value: 'sieu_thi', label: 'Siêu thị' },
    { value: 'khac', label: 'Khác' },
];

export interface GTOutletData {
    id: string;
    name: string;
    owner_name?: string;
    phone?: string;
    address: string;
    district: string;
    ward?: string;
    outlet_type: string;
    notes?: string;
    created_at?: string;
}

interface EditOutletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: GTOutletData | null;
}

export default function EditOutletModal({ isOpen, onClose, onSuccess, initialData }: EditOutletModalProps) {
    const { user, session } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        owner_name: "",
        phone: "",
        address: "",
        district: "",
        ward: "",
        outlet_type: "tap_hoa",
        notes: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || "",
                    owner_name: initialData.owner_name || "",
                    phone: initialData.phone || "",
                    address: initialData.address || "",
                    district: initialData.district || "",
                    ward: initialData.ward || "",
                    outlet_type: initialData.outlet_type || "tap_hoa",
                    notes: initialData.notes || "",
                });
            } else {
                setFormData({
                    name: "", owner_name: "", phone: "", address: "",
                    district: "", ward: "", outlet_type: "tap_hoa", notes: "",
                });
            }
            setErrors({});
        }
    }, [isOpen, initialData]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Vui lòng nhập tên điểm bán";
        if (!formData.district.trim()) newErrors.district = "Vui lòng nhập quận/huyện";
        if (!formData.address.trim()) newErrors.address = "Vui lòng nhập địa chỉ";
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
            const payload = {
                name: formData.name.trim(),
                owner_name: formData.owner_name.trim() || null,
                phone: formData.phone.trim() || null,
                address: formData.address.trim(),
                district: formData.district.trim(),
                ward: formData.ward.trim() || null,
                outlet_type: formData.outlet_type,
                notes: formData.notes.trim() || null,
                updated_at: new Date().toISOString(),
            };

            if (initialData) {
                const { error } = await supabase
                    .from('gt_outlets')
                    .update(payload)
                    .eq('id', initialData.id);

                if (error) {
                    toast.error("Không thể cập nhật: " + error.message);
                } else {
                    toast.success("Cập nhật điểm bán thành công");
                    onSuccess();
                    onClose();
                }
            } else {
                const { error } = await supabase
                    .from('gt_outlets')
                    .insert({
                        ...payload,
                        created_by: user.id,
                        assigned_to: user.id,
                    });

                if (error) {
                    toast.error("Không thể tạo mới: " + error.message);
                } else {
                    toast.success("Thêm điểm bán thành công");
                    onSuccess();
                    onClose();
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
                            {initialData ? "Cập nhật thông tin điểm bán" : "Thêm điểm bán mới"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Nhập thông tin chi tiết để quản lý điểm bán tốt hơn
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
                                <Building className="w-4 h-4 text-teal-600" />
                                Thông tin Điểm bán
                            </h3>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Tên điểm bán <span className="text-red-500">*</span></label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 outline-none ${errors.name ? 'border-red-500' : 'border-slate-300'}`}
                                    placeholder="Ví dụ: Tạp hóa Cô Ba"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Chủ cửa hàng</label>
                                <input
                                    value={formData.owner_name}
                                    onChange={(e) => handleChange('owner_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                                    placeholder="Tên chủ cửa hàng"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Số điện thoại</label>
                                <input
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                                    placeholder="0912345678"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Loại hình</label>
                                <select
                                    value={formData.outlet_type}
                                    onChange={(e) => handleChange('outlet_type', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 outline-none bg-white"
                                >
                                    {OUTLET_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Ghi chú</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* Column 2: Address */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b">
                                <MapPin className="w-4 h-4 text-teal-600" />
                                Địa chỉ
                            </h3>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Quận / Huyện <span className="text-red-500">*</span></label>
                                <input
                                    value={formData.district}
                                    onChange={(e) => handleChange('district', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 outline-none ${errors.district ? 'border-red-500' : 'border-slate-300'}`}
                                    placeholder="Ví dụ: Hà Đông"
                                />
                                {errors.district && <p className="text-xs text-red-500">{errors.district}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Phường / Xã</label>
                                <input
                                    value={formData.ward}
                                    onChange={(e) => handleChange('ward', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                                    placeholder="Ví dụ: Phú Lương"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Địa chỉ chi tiết <span className="text-red-500">*</span></label>
                                <input
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 outline-none ${errors.address ? 'border-red-500' : 'border-slate-300'}`}
                                    placeholder="Số nhà, tên đường..."
                                />
                                {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-start gap-2 bg-teal-50 p-3 rounded-lg text-teal-700 text-sm">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>Thông tin đầy đủ sẽ giúp đội ngũ Sales và CSKH làm việc hiệu quả hơn.</p>
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 sticky bottom-0 z-10 backdrop-blur-md">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-white border border-transparent hover:border-slate-300 rounded-lg text-sm font-medium transition-all">
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-teal-600 text-white hover:bg-teal-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm shadow-teal-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {initialData ? "Lưu thay đổi" : "Thêm điểm bán"}
                    </button>
                </div>
            </div>
        </div>
    );
}
