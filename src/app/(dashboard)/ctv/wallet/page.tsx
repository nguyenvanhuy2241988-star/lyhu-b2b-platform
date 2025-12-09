"use client";

import { useEffect, useState, useMemo } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getWalletByCtv, recomputeWalletsFromSourceData, CtvWallet } from "@/lib/walletStore";
import { getCurrentCycle } from "@/lib/payoutCycles";
import { getDraftForCycle, getPayoutsByCtv, type PayoutRequest } from "@/lib/payoutStore";
import { Wallet, TrendingUp, CreditCard, Clock, Calendar, ArrowRight } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

export default function CTVWalletPage() {
    const [wallet, setWallet] = useState<CtvWallet | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentDraft, setCurrentDraft] = useState<PayoutRequest | null>(null);

    const cycle = useMemo(() => getCurrentCycle(), []);

    useEffect(() => {
        recomputeWalletsFromSourceData();

        const user = getCurrentUser();
        setCurrentUser(user);

        if (user) {
            const walletData = getWalletByCtv(user.id);
            setWallet(walletData);

            const draft = getDraftForCycle(user.id, cycle.cycleKey);
            setCurrentDraft(draft || null);
        }
    }, [cycle.cycleKey]);

    const walletCards = [
        {
            label: "Số dư ví",
            value: formatPrice(wallet?.balance || 0),
            sub: "Có thể rút",
            icon: Wallet,
            color: "text-green-600",
            bg: "bg-green-50",
            borderColor: "border-green-200",
        },
        {
            label: "Tổng đã kiếm",
            value: formatPrice(wallet?.totalEarned || 0),
            sub: "Đơn hàng + Giới thiệu",
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-50",
            borderColor: "border-blue-200",
        },
        {
            label: "Tổng đã nhận",
            value: formatPrice(wallet?.totalPaid || 0),
            sub: "Đã thanh toán",
            icon: CreditCard,
            color: "text-purple-600",
            bg: "bg-purple-50",
            borderColor: "border-purple-200",
        },
        {
            label: "Đang chờ xử lý",
            value: formatPrice(wallet?.pendingPayoutAmount || 0),
            sub: "Draft + Yêu cầu + Đã duyệt",
            icon: Clock,
            color: "text-orange-600",
            bg: "bg-orange-50",
            borderColor: "border-orange-200",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Ví CTV</h1>
                <p className="text-slate-600">Theo dõi thu nhập và số dư của bạn</p>
            </div>

            {/* Wallet Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {walletCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className={`bg-white p-6 rounded-xl shadow-sm border-2 ${card.borderColor}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${card.bg}`}>
                                    <Icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">{card.label}</p>
                                    <p className="text-xl font-bold text-slate-900">{card.value}</p>
                                    <p className="text-xs text-slate-500">{card.sub}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Current Cycle Info */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
                <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-primary-900">Kỳ chốt hiện tại</h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-2xl font-bold text-primary-700">{cycle.label}</p>
                        <p className="text-sm text-primary-600">
                            Kỳ {cycle.cycleLetter === "A" ? "đầu tháng (1-15)" : "cuối tháng (16-cuối)"}
                        </p>
                    </div>
                    {currentDraft && (
                        <div className="bg-white rounded-lg px-4 py-3 border border-primary-300">
                            <p className="text-sm text-slate-600">Đề xuất thanh toán</p>
                            <p className="text-lg font-bold text-green-600">{formatPrice(currentDraft.requestedAmount)}</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                {currentDraft.status === "DRAFT" ? "Chờ xác nhận" : currentDraft.status}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                    href="/ctv/payouts"
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                            <CreditCard className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-1">Yêu cầu rút tiền</h4>
                            <p className="text-sm text-slate-600">Xem & xác nhận thanh toán</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                </a>
                <a
                    href="/ctv/earnings"
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all group flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-1">Chi tiết thu nhập</h4>
                            <p className="text-sm text-slate-600">Hoa hồng theo tháng</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                </a>
            </div>
        </div>
    );
}
