"use client";

import { useEffect, useState, useMemo } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getUserById, ensureCtvReferralCodes } from "@/lib/usersStore";
import { getParentReferralSummary, ReferralSummary } from "@/lib/referralAnalytics";
import { ACTIVATION_BONUS, OVERRIDE_RATE, OVERRIDE_DURATION_DAYS } from "@/lib/referralRules";
import { Users, CheckCircle, Gift, TrendingUp, Copy, Check, Info } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

export default function CTVReferralsPage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [fullUser, setFullUser] = useState<any>(null);
    const [summary, setSummary] = useState<ReferralSummary | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        ensureCtvReferralCodes();
        (async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);
        })();
    }, []);

    useEffect(() => {
        if (currentUser) {
            const userData = getUserById(currentUser.id);
            setFullUser(userData);

            // Re-fetch orders/users from localStorage to ensure we have latest mock data
            if (userData?.referralCode) {
                const referralSummary = getParentReferralSummary(userData.referralCode);
                setSummary(referralSummary);
            }
        }
    }, [currentUser, fullUser?.referralCode]); // Dependencies updated to re-run if referralCode changes

    const handleCopy = () => {
        if (fullUser?.referralCode) {
            navigator.clipboard.writeText(fullUser.referralCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const kpiCards = useMemo(() => {
        if (!summary) return [];
        return [
            {
                label: "Tổng CTV con",
                value: summary.totalChildren.toString(),
                icon: Users,
                color: "text-blue-600",
                bg: "bg-blue-50",
            },
            {
                label: "CTV đã kích hoạt",
                value: summary.activatedChildren.toString(),
                icon: CheckCircle,
                color: "text-green-600",
                bg: "bg-green-50",
            },
            {
                label: "Thưởng kích hoạt",
                value: formatPrice(summary.activationBonusTotal),
                subLabel: `${formatPrice(ACTIVATION_BONUS)}/CTV`,
                icon: Gift,
                color: "text-purple-600",
                bg: "bg-purple-50",
            },
            {
                label: "Thưởng doanh số tuyến dưới",
                value: formatPrice(summary.overrideBonusTotal),
                subLabel: `${(OVERRIDE_RATE * 100).toFixed(0)}% hoa hồng`,
                icon: TrendingUp,
                color: "text-orange-600",
                bg: "bg-orange-50",
            },
        ];
    }, [summary]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Chương trình giới thiệu</h1>
                    <p className="text-slate-600">Giới thiệu CTV mới và nhận thưởng</p>
                </div>
            </div>

            {/* Referral Code Card */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-primary-100 text-sm mb-1">Mã giới thiệu của bạn</p>
                        <p className="text-3xl font-bold tracking-wider">{fullUser?.referralCode || "---"}</p>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="w-5 h-5" />
                                <span>Đã sao chép</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-5 h-5" />
                                <span>Sao chép mã</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-primary-100">
                            Chia sẻ mã này cho CTV mới. Khi họ có đơn giao thành công, bạn nhận {formatPrice(ACTIVATION_BONUS)} thưởng kích hoạt
                            + {(OVERRIDE_RATE * 100).toFixed(0)}% hoa hồng họ trong {OVERRIDE_DURATION_DAYS} ngày đầu.
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${card.bg}`}>
                                    <Icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-medium mb-1">{card.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
                                {card.subLabel && (
                                    <p className="text-xs text-slate-500 mt-1">{card.subLabel}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Total Referral Earnings */}
            {summary && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-700 font-medium">Tổng thu nhập từ giới thiệu</p>
                            <p className="text-sm text-green-600">Thưởng kích hoạt + Thưởng doanh số</p>
                        </div>
                        <p className="text-3xl font-bold text-green-700">{formatPrice(summary.totalReferralEarnings)}</p>
                    </div>
                </div>
            )}

            {/* Children Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Danh sách CTV con</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tên CTV</th>
                                <th className="px-6 py-3 font-medium">Mã</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Doanh số</th>
                                <th className="px-6 py-3 font-medium text-right">Hoa hồng CTV</th>
                                <th className="px-6 py-3 font-medium text-right">Thưởng bạn nhận</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {!summary || summary.children.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="py-12 flex flex-col items-center justify-center text-center">
                                            <div className="bg-slate-50 p-4 rounded-full mb-3">
                                                <Users className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-slate-900 font-medium mb-1">Chưa có CTV con</h3>
                                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                                Chia sẻ mã giới thiệu của bạn để xây dựng đội ngũ và nhận hoa hồng thụ động!
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                summary.children.map((child) => (
                                    <tr key={child.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{child.name}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-sm">{child.referralCode}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${child.isActivated
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                {child.isActivated ? "Đã kích hoạt" : "Chưa kích hoạt"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-900">{formatPrice(child.childSales)}</td>
                                        <td className="px-6 py-4 text-right text-slate-600">{formatPrice(child.childCommission)}</td>
                                        <td className="px-6 py-4 text-right font-medium text-green-600">
                                            {formatPrice(child.overrideEarnedForParent + (child.isActivated ? ACTIVATION_BONUS : 0))}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
