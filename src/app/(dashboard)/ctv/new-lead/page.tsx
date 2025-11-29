"use client";

import { useState } from "react";
import { UserPlus, Save, X } from "lucide-react";

const CUSTOMER_TYPES = ["Tạp hóa", "Mini mart", "Đại lý", "NPP"];
const AREAS = [
    "Hà Đông, Hà Nội",
    "Thanh Xuân, Hà Nội",
    "Cầu Giấy, Hà Nội",
    "Đống Đa, Hà Nội",
    "Long Biên, Hà Nội",
    "Hoàn Kiếm, Hà Nội",
];

export default function NewLeadPage() {
    const [formData, setFormData] = useState({
        storeName: "",
        contactPerson: "",
        phone: "",
        area: "",
        type: "Tạp hóa" as "Tạp hóa" | "Mini mart" | "Đại lý" | "NPP",
        notes: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.storeName.trim()) {
            newErrors.storeName = "Vui lòng nhập tên cửa hàng";
        }
        if (!formData.contactPerson.trim()) {
            newErrors.contactPerson = "Vui lòng nhập người liên hệ";
        }
        if (!formData.phone.trim()) {
            newErrors.phone = "Vui lòng nhập số điện thoại";
        } else if (!/^[0-9]{10,11}$/.test(formData.phone.trim())) {
            newErrors.phone = "Số điện thoại không hợp lệ (10-11 số)";
        }
        if (!formData.area) {
            newErrors.area = "Vui lòng chọn khu vực";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const newLead = {
            id: Date.now().toString(),
            ...formData,
            status: "new",
            createdAt: new Date().toISOString(),
            ctvId: "4", // Mock CTV ID
            ctvName: "Phạm Thị Dung", // Mock CTV name
        };

        console.log("Creating new lead:", newLead);
        alert("✅ Tạo lead thành công!\n\nChi tiết đã được ghi vào console.");

        // Reset form
        handleReset();
    };

    const handleReset = () => {
        setFormData({
            storeName: "",
            contactPerson: "",
            phone: "",
            area: "",
            type: "Tạp hóa",
            notes: "",
        });
        setErrors({});
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tạo Lead mới</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Thêm thông tin khách hàng tiềm năng
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary-50 rounded-lg">
                            <UserPlus className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">Thông tin Lead</h3>
                            <p className="text-sm text-slate-600">Điền đầy đủ thông tin bên dưới</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Store Name */}
                        <div className="sm:col-span-2">
                            <label htmlFor="storeName" className="block text-sm font-medium text-slate-700 mb-2">
                                Tên cửa hàng <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                id="storeName"
                                name="storeName"
                                value={formData.storeName}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.storeName ? "border-red-500" : "border-slate-200"
                                    }`}
                                placeholder="VD: Tạp hóa Ngọc Lan"
                            />
                            {errors.storeName && (
                                <p className="mt-1 text-xs text-red-600">{errors.storeName}</p>
                            )}
                        </div>

                        {/* Contact Person */}
                        <div>
                            <label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700 mb-2">
                                Người liên hệ <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                id="contactPerson"
                                name="contactPerson"
                                value={formData.contactPerson}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.contactPerson ? "border-red-500" : "border-slate-200"
                                    }`}
                                placeholder="VD: Chị Lan"
                            />
                            {errors.contactPerson && (
                                <p className="mt-1 text-xs text-red-600">{errors.contactPerson}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                                Số điện thoại <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.phone ? "border-red-500" : "border-slate-200"
                                    }`}
                                placeholder="VD: 0912345678"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                            )}
                        </div>

                        {/* Area */}
                        <div>
                            <label htmlFor="area" className="block text-sm font-medium text-slate-700 mb-2">
                                Khu vực <span className="text-red-600">*</span>
                            </label>
                            <select
                                id="area"
                                name="area"
                                value={formData.area}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.area ? "border-red-500" : "border-slate-200"
                                    }`}
                            >
                                <option value="">-- Chọn khu vực --</option>
                                {AREAS.map((area) => (
                                    <option key={area} value={area}>
                                        {area}
                                    </option>
                                ))}
                            </select>
                            {errors.area && (
                                <p className="mt-1 text-xs text-red-600">{errors.area}</p>
                            )}
                        </div>

                        {/* Type */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-2">
                                Loại khách <span className="text-red-600">*</span>
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                {CUSTOMER_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Notes */}
                        <div className="sm:col-span-2">
                            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                                Ghi chú
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                placeholder="Ghi chú thêm về lead này..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-slate-200">
                        <button
                            type="submit"
                            className="flex-1 sm:flex-none px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            Tạo Lead
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex-1 sm:flex-none px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <X className="w-5 h-5" />
                            Hủy
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <p className="text-sm text-primary-700">
                        <strong>💡 Lưu ý:</strong> Lead mới sẽ có trạng thái "Mới". Bạn có thể cập nhật trạng thái sau khi liên hệ với khách hàng.
                    </p>
                </div>
            </form>
        </div>
    );
}
