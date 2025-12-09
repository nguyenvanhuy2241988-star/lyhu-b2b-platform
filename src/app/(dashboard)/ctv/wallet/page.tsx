"use client";

import { useEffect, useState, useMemo } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getWalletByCtv, recomputeWalletsFromSourceData, CtvWallet } from "@/lib/walletStore";
import { getCurrentCycle } from "@/lib/payoutCycles";
import { getDraftForCycle, getPayoutsByCtv, type PayoutRequest } from "@/lib/payoutStore";
import { Wallet, TrendingUp, CreditCard, Clock, Calendar, ArrowRight, History, X } from "lucide-react";
import { format } from "date-fns";

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
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);

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

            const history = getPayoutsByCtv(user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setPayoutHistory(history);
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
                <button
                    onClick={() => setShowRequestModal(true)}
                    disabled={!wallet || wallet.balance < 50000} // Minimum withdrawal
                    className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all group flex items-center justify-between text-left w-full
                        ${(!wallet || wallet.balance < 50000) ? "opacity-60 cursor-not-allowed" : "hover:shadow-md hover:border-primary-200"}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                            <CreditCard className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-1">Yêu cầu rút tiền</h4>
                            <p className="text-sm text-slate-600">
                                {wallet && wallet.balance >= 50000
                                    ? "Số dư khả dụng"
                                    : "Tối thiểu 50.000đ"}
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                </button>
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
            {/* Transaction History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-500" />
                    <h3 className="text-lg font-semibold text-slate-900">Lịch sử giao dịch</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mã giao dịch</th>
                                <th className="px-6 py-3 font-medium">Ngày tạo</th>
                                <th className="px-6 py-3 font-medium">Số tiền</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-right">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {payoutHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Chưa có giao dịch nào
                                    </td>
                                </tr>
                            ) : (
                                payoutHistory.map((payout) => (
                                    <tr key={payout.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-slate-600">
                                            {payout.id.slice(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 text-slate-900">
                                            {format(new Date(payout.createdAt), "dd/MM/yyyy HH:mm")}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {formatPrice(payout.requestedAmount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${payout.status === "PAID" ? "bg-green-100 text-green-700" :
                                                    payout.status === "REQUESTED" ? "bg-blue-100 text-blue-700" :
                                                        payout.status === "DRAFT" ? "bg-yellow-100 text-yellow-700" :
                                                            "bg-red-100 text-red-700"}`}>
                                                {payout.status === "PAID" ? "Đã thanh toán" :
                                                    payout.status === "REQUESTED" ? "Đã yêu cầu" :
                                                        payout.status === "DRAFT" ? "Bản nháp" : "Từ chối"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">
                                            {payout.adminNote || "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Request Payout Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Yêu cầu rút tiền</h3>
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 mb-6 text-center border border-green-200">
                            <p className="text-sm text-green-700 mb-1">Số dư khả dụng</p>
                            <p className="text-3xl font-bold text-green-700">{formatPrice(wallet?.balance || 0)}</p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 text-center">
                                Yêu cầu rút tiền sẽ được gửi đến Admin phê duyệt.
                                Thời gian xử lý từ 1-3 ngày làm việc.
                            </p>

                            <button
                                onClick={() => {
                                    alert("Tính năng đang phát triển: Gửi yêu cầu thành công!");
                                    setShowRequestModal(false);
                                }}
                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors"
                            >
                                Xác nhận rút tất cả
                            </button>

                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="w-full py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
