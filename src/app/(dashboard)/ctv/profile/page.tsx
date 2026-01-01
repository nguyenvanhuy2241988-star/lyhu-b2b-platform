"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { loadUsers, updateUser, User, Region } from "@/lib/usersStore";
import { PROVINCES_VN, getRegionFromProvince, REGION_LABELS } from "@/lib/locations";
import { normalizePhone, isPhoneUniqueForCtv, isValidVietnamesePhone } from "@/lib/userUtils";
import { User as UserIcon, Phone, MapPin, Building2, CheckCircle, AlertCircle, Save } from "lucide-react";

export default function CTVProfilePage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        province: "",
    });
    const [derivedRegion, setDerivedRegion] = useState<Region>("Other");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        (async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);

            if (user) {
                const users = loadUsers();
                const fullUser = users.find(u => u.id === user.id);
                if (fullUser) {
                    setFormData({
                        name: fullUser.name || "",
                        phone: fullUser.phone || "",
                        address: fullUser.address || "",
                        province: fullUser.province || "",
                    });
                    setDerivedRegion(fullUser.region || getRegionFromProvince(fullUser.province || ""));
                }
            }
        })();
    }, []);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: "" }));

        if (field === "province") {
            setDerivedRegion(getRegionFromProvince(value));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        const users = loadUsers();

        // Phone validation
        if (!formData.phone.trim()) {
            newErrors.phone = "Vui lòng nhập số điện thoại";
        } else if (!isValidVietnamesePhone(formData.phone)) {
            newErrors.phone = "Số điện thoại không hợp lệ (10 số, bắt đầu với 0)";
        } else if (!isPhoneUniqueForCtv(formData.phone, currentUser?.id || "", users)) {
            newErrors.phone = "Số điện thoại đã được CTV khác sử dụng";
        }

        // Province validation
        if (!formData.province) {
            newErrors.province = "Vui lòng chọn tỉnh/thành phố";
        }

        // Address soft validation
        if (!formData.address.trim()) {
            newErrors.address = "Nên nhập địa chỉ để hệ thống chống gian lận hoạt động tốt hơn";
        }

        setErrors(newErrors);

        // Only block save for phone and province errors
        return !newErrors.phone && !newErrors.province;
    };

    const handleSave = () => {
        if (!currentUser) return;
        if (!validate()) return;

        setSaving(true);

        updateUser(currentUser.id, {
            name: formData.name.trim(),
            phone: normalizePhone(formData.phone),
            address: formData.address.trim(),
            province: formData.province,
            region: derivedRegion,
        });

        // Update localStorage currentUser for immediate reflection
        const stored = localStorage.getItem("lyhu_current_user");
        if (stored) {
            const currentUserData = JSON.parse(stored);
            currentUserData.name = formData.name.trim();
            currentUserData.phone = normalizePhone(formData.phone);
            currentUserData.address = formData.address.trim();
            currentUserData.province = formData.province;
            currentUserData.region = derivedRegion;
            localStorage.setItem("lyhu_current_user", JSON.stringify(currentUserData));
        }

        setMessage({ type: "success", text: "Đã lưu thông tin thành công!" });
        setSaving(false);

        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Hồ sơ CTV</h1>
                <p className="text-slate-600">Cập nhật thông tin cá nhân để hệ thống hoạt động chính xác</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="space-y-6">
                    {/* Full Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <UserIcon className="w-4 h-4" />
                            Họ tên
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Nhập họ tên đầy đủ"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <Phone className="w-4 h-4" />
                            Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="0901234567"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.phone ? "border-red-300 bg-red-50" : "border-slate-300"}`}
                        />
                        {errors.phone && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.phone}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">Dùng để xác minh và chống đặt đơn gian lận</p>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <MapPin className="w-4 h-4" />
                            Địa chỉ
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                            placeholder="Số nhà, đường, phường/xã, quận/huyện"
                            rows={2}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.address ? "border-yellow-300 bg-yellow-50" : "border-slate-300"}`}
                        />
                        {errors.address && (
                            <p className="mt-1 text-sm text-yellow-600 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.address}
                            </p>
                        )}
                    </div>

                    {/* Province */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Building2 className="w-4 h-4" />
                                Tỉnh/Thành phố <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.province}
                                onChange={(e) => handleChange("province", e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.province ? "border-red-300 bg-red-50" : "border-slate-300"}`}
                            >
                                <option value="">-- Chọn tỉnh/thành phố --</option>
                                {PROVINCES_VN.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                            {errors.province && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.province}
                                </p>
                            )}
                        </div>

                        {/* Region (auto) */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                Khu vực (tự động)
                            </label>
                            <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${derivedRegion === "North" ? "bg-blue-100 text-blue-700" :
                                    derivedRegion === "Central" ? "bg-green-100 text-green-700" :
                                        derivedRegion === "South" ? "bg-orange-100 text-orange-700" :
                                            "bg-slate-200 text-slate-700"
                                    }`}>
                                    {REGION_LABELS[derivedRegion]}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">Được xác định dựa trên tỉnh/thành phố</p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 border-t border-slate-200">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            <span>Lưu thông tin</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Tại sao cần cập nhật thông tin?</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-600">
                            <li>Số điện thoại giúp hệ thống phát hiện đơn hàng tự đặt</li>
                            <li>Địa chỉ dùng để kiểm tra gian lận địa chỉ trùng</li>
                            <li>Tỉnh/Thành phố để xếp hạng CTV theo khu vực</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
