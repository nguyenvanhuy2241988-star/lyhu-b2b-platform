"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, setCurrentUser, type AuthUser } from "@/lib/auth"; // auth types
import { CheckCircle, ChevronRight, User, MapPin, Briefcase, Truck, ArrowRight, ArrowLeft } from "lucide-react";

// Mock provinces for dropdown
const PROVINCES = [
    "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
    "Bắc Ninh", "Hải Dương", "Hưng Yên", "Nam Định", "Thái Bình"
];

const REGIONS = ["Miền Bắc", "Miền Trung", "Miền Nam"];

const CTV_TYPES = [
    {
        id: "Indie",
        label: "Cá nhân (Indie)",
        description: "Bán lẻ, kiếm thêm thu nhập lúc rảnh rỗi.",
        icon: User
    },
    {
        id: "Community Leader",
        label: "Trưởng nhóm (Community Leader)",
        description: "Quản lý đội nhóm, nhận hoa hồng quản lý.",
        icon: Users
    },
    {
        id: "KOL",
        label: "KOL / Influencer",
        description: "Quảng bá thương hiệu, hợp tác chiến lược.",
        icon: Star
    }
];

const CTV_MODES = [
    {
        id: "Self-Ship",
        label: "Tự vận chuyển (Self-ship)",
        description: "Nhập hàng về kho riêng, tự giao cho khách. Lợi nhuận cao hơn.",
        icon: Truck
    },
    {
        id: "No-Capital",
        label: "Không vốn (Dropshipping)",
        description: "Chỉ cần lên đơn, LYHU lo vận chuyển. Không cần bỏ vốn.",
        icon: Box
    }
];

import { Users, Star, Box } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null); // Use any to support extended fields not in basic AuthUser
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    // Form Data
    const [formData, setFormData] = useState({
        phone: "",
        address: "",
        province: "",
        region: "",
        ctvType: "",
        ctvMode: "",
    });

    useEffect(() => {
        (async () => {
            const currentUser = await getCurrentUser();
            // Simulate checking extended profile from "DB" (mock data)
            // In real app, we fetch /api/me to get full profile
            // Here we just use what's in localStorage or mapped from mockUsers if we had a backend

            if (currentUser) {
                setUser(currentUser);
                // Initialize form if data exists
                setFormData(prev => ({
                    ...prev,
                    phone: (currentUser as any).phone || "",
                    address: (currentUser as any).address || "",
                    province: (currentUser as any).province || "",
                    region: (currentUser as any).region || "",
                    ctvType: (currentUser as any).ctvType || "",
                    ctvMode: (currentUser as any).ctvMode || "",
                }));

                // If already onboarded, maybe redirect? For now we allow re-onboarding for testing
            }
            setIsLoading(false);
        })();
    }, []);

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleFinish = () => {
        // Save to localStorage to simulate "DB Update"
        if (user) {
            const updatedUser = {
                ...user,
                ...formData,
                onboardingStep: 3, // Completed
            };
            setCurrentUser(updatedUser);

            // Show success
            alert("🎉 Chúc mừng! Bạn đã hoàn tất hồ sơ CTV.");

            // Redirect
            router.push("/ctv");
        }
    };

    // Validation
    const isStep1Valid = formData.phone && formData.address && formData.province && formData.region;
    const isStep2Valid = formData.ctvType;
    const isStep3Valid = formData.ctvMode;

    const canProceed = () => {
        if (step === 1) return isStep1Valid;
        if (step === 2) return isStep2Valid;
        if (step === 3) return isStep3Valid;
        return false;
    };

    if (isLoading) return <div className="p-10 text-center">Đang tải...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Chào mừng gia nhập LYHU</h1>
                    <p className="text-slate-600 mt-2">Hoàn tất hồ sơ để bắt đầu kinh doanh ngay hôm nay</p>
                </div>

                {/* Progress */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0">
                            <div
                                className="h-full bg-primary-500 transition-all duration-300"
                                style={{ width: `${((step - 1) / 2) * 100}%` }}
                            />
                        </div>

                        {/* Steps */}
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="relative z-10 flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-4 ${step >= s
                                        ? "bg-primary-500 text-white border-white shadow-lg"
                                        : "bg-white text-slate-400 border-slate-100"
                                        }`}
                                >
                                    {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                                </div>
                                <div className="mt-2 text-xs font-medium text-slate-600">
                                    {s === 1 ? "Thông tin" : s === 2 ? "Loại hình" : "Chế độ"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">

                    {/* Step 1: Profile */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-6 h-6 text-primary-500" />
                                Cập nhật thông tin nhận hàng
                            </h2>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                                    <input
                                        type="text"
                                        value={user?.name || ""}
                                        disabled
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Nhập số điện thoại liên hệ"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                                        <select
                                            value={formData.province}
                                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        >
                                            <option value="">Chọn Tỉnh/Thành</option>
                                            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Khu vực <span className="text-red-500">*</span></label>
                                        <select
                                            value={formData.region}
                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        >
                                            <option value="">Chọn Khu vực</option>
                                            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ chi tiết <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Số nhà, tên đường, phường/xã..."
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: CTV Type */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-primary-500" />
                                Chọn mô hình hoạt động
                            </h2>
                            <p className="text-slate-600 mb-4">Bạn muốn hợp tác với LYHU dưới hình thức nào?</p>

                            <div className="space-y-3">
                                {CTV_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    const isSelected = formData.ctvType === type.id;
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => setFormData({ ...formData, ctvType: type.id })}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${isSelected
                                                ? "border-primary-500 bg-primary-50 shadow-md"
                                                : "border-slate-200 hover:border-slate-300"
                                                }`}
                                        >
                                            <div className={`p-3 rounded-lg ${isSelected ? "bg-white text-primary-600" : "bg-slate-100 text-slate-500"}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className={`font-semibold ${isSelected ? "text-primary-800" : "text-slate-900"}`}>{type.label}</h3>
                                                <p className="text-sm text-slate-600 mt-1">{type.description}</p>
                                            </div>
                                            {isSelected && <CheckCircle className="w-6 h-6 text-primary-600 ml-auto self-center" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Mode */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Truck className="w-6 h-6 text-primary-500" />
                                Chọn hình thức vận chuyển
                            </h2>
                            <p className="text-slate-600 mb-4">Cách bạn muốn giao hàng đến tay khách?</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {CTV_MODES.map((mode) => {
                                    const Icon = mode.icon;
                                    const isSelected = formData.ctvMode === mode.id;
                                    return (
                                        <button
                                            key={mode.id}
                                            onClick={() => setFormData({ ...formData, ctvMode: mode.id })}
                                            className={`p-6 rounded-xl border-2 text-left transition-all h-full flex flex-col ${isSelected
                                                ? "border-primary-500 bg-primary-50 shadow-md"
                                                : "border-slate-200 hover:border-slate-300"
                                                }`}
                                        >
                                            <div className={`p-3 rounded-lg w-fit mb-4 ${isSelected ? "bg-white text-primary-600" : "bg-slate-100 text-slate-500"}`}>
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            <h3 className={`font-semibold text-lg mb-2 ${isSelected ? "text-primary-800" : "text-slate-900"}`}>{mode.label}</h3>
                                            <p className="text-sm text-slate-600">{mode.description}</p>
                                            {isSelected && <CheckCircle className="w-6 h-6 text-primary-600 mt-auto pt-4 self-end" />}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <h4 className="font-semibold text-yellow-800 text-sm mb-1">Lưu ý quan trọng</h4>
                                <ul className="text-sm text-yellow-700 list-disc ml-4 space-y-1">
                                    <li>Chế độ <strong>Self-ship</strong> yêu cầu bạn phải nhập hàng về kho (tối thiểu 1 thùng).</li>
                                    <li>Chế độ <strong>Dropshipping</strong> không cần vốn, nhưng hoa hồng sẽ thấp hơn.</li>
                                    <li>Bạn có thể thay đổi chế độ này sau trong phần Cài đặt.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${step === 1
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-lg font-medium shadow-sm transition-all ${!canProceed()
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-primary-500 hover:bg-primary-600 text-white hover:shadow-md"
                                }`}
                        >
                            {step === 3 ? "Hoàn tất" : "Tiếp tục"}
                            {step < 3 && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
