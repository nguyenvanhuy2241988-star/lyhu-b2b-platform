"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, setCurrentUser } from "@/lib/auth";
import { getUserByReferralCode, linkReferral, ensureCtvReferralCodes, getUserById } from "@/lib/usersStore";
import { Gift, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

export default function CTVOnboardingPage() {
    const router = useRouter();
    const [referralCode, setReferralCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUserState] = useState<any>(null);

    useEffect(() => {
        ensureCtvReferralCodes();
        const user = getCurrentUser();

        if (!user || user.role !== "ctv") {
            router.replace("/login");
            return;
        }

        // Check if already has referral info
        const fullUser = getUserById(user.id);
        if (fullUser && fullUser.referredByCode) {
            // Already onboarded, redirect to dashboard
            router.replace("/ctv");
            return;
        }

        setCurrentUserState(user);
        setLoading(false);
    }, [router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!currentUser) return;

        if (referralCode.trim()) {
            const parent = getUserByReferralCode(referralCode.trim().toUpperCase());
            if (!parent) {
                setError("Mã giới thiệu không hợp lệ");
                return;
            }
            if (parent.id === currentUser.id) {
                setError("Bạn không thể sử dụng mã giới thiệu của chính mình");
                return;
            }

            const linked = linkReferral(currentUser.id, referralCode.trim().toUpperCase());
            if (!linked) {
                setError("Không thể liên kết mã giới thiệu");
                return;
            }
            setSuccess(true);
        }

        // Redirect after a short delay
        setTimeout(() => {
            router.push("/ctv");
        }, success ? 1500 : 500);
    };

    const handleSkip = () => {
        router.push("/ctv");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                        <Gift className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Chào mừng CTV mới!</h1>
                    <p className="text-slate-600">
                        Bạn có mã giới thiệu từ CTV khác không? Nhập để nhận thêm ưu đãi.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Mã giới thiệu (tùy chọn)
                        </label>
                        <input
                            type="text"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            placeholder="VD: CTV-A7K2"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-lg tracking-wider"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">Liên kết thành công! Đang chuyển hướng...</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            type="submit"
                            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>Xác nhận</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                        >
                            Bỏ qua
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Bạn có thể nhập mã giới thiệu sau nếu chưa có ngay.
                </p>
            </div>
        </div>
    );
}
