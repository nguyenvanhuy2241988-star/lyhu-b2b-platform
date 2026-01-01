"use client";

import { useEffect, useState, useMemo } from "react";
import { getCurrentUser } from "@/lib/auth";
import { loadOrders } from "@/lib/ordersStore";
import { loadUsers } from "@/lib/usersStore";
import {
    createPayoutRequest,
    getPayoutsByCtv,
    hasPendingPayoutForMonth,
    getDraftForCycle,
    confirmDraftToRequested,
    type PayoutRequest,
    type PayoutStatus
} from "@/lib/payoutStore";
import { getTotalEligibleForMonth } from "@/lib/payoutEligibility";
import { getCurrentCycle, getCycleLabel } from "@/lib/payoutCycles";
import { Wallet, Clock, CheckCircle, AlertCircle, Send, Calendar, ArrowRight } from "lucide-react";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
};

const STATUS_CONFIG: Record<PayoutStatus, { label: string; color: string }> = {
    DRAFT: { label: "Đề xuất", color: "bg-slate-100 text-slate-700" },
    REQUESTED: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
    APPROVED: { label: "Đã duyệt", color: "bg-blue-100 text-blue-700" },
    REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-700" },
    PAID: { label: "Đã thanh toán", color: "bg-green-100 text-green-700" },
};

const MONTHS = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

export default function CTVPayoutsPage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [requestAmount, setRequestAmount] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [currentDraft, setCurrentDraft] = useState<PayoutRequest | null>(null);

    const cycle = useMemo(() => getCurrentCycle(), []);

    const refreshData = async () => {
        const user = await getCurrentUser();
        if (user) {
            const ctvPayouts = getPayoutsByCtv(user.id);
            setPayouts(ctvPayouts);

            const draft = getDraftForCycle(user.id, cycle.cycleKey);
            setCurrentDraft(draft || null);
        }
    };

    useEffect(() => {
        (async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);
            await refreshData();
        })();
    }, [cycle.cycleKey]);

    const eligibility = useMemo(() => {
        if (!currentUser) return null;
        return getTotalEligibleForMonth(currentUser.id, selectedYear, selectedMonth);
    }, [currentUser, selectedYear, selectedMonth]);

    const hasPending = useMemo(() => {
        if (!currentUser) return false;
        return hasPendingPayoutForMonth(currentUser.id, selectedYear, selectedMonth);
    }, [currentUser, selectedYear, selectedMonth]);

    const handleConfirmDraft = () => {
        if (!currentDraft) return;
        confirmDraftToRequested(currentDraft.id);
        setMessage({ type: "success", text: "Đã xác nhận yêu cầu thanh toán!" });
        refreshData();
    };

    const handleSubmit = () => {
        if (!currentUser || !eligibility) return;

        const amount = requestAmount ? parseFloat(requestAmount) : eligibility.totalEligible;

        if (amount <= 0) {
            setMessage({ type: "error", text: "Số tiền phải lớn hơn 0" });
            return;
        }
        if (amount > eligibility.totalEligible) {
            setMessage({ type: "error", text: "Số tiền vượt quá hoa hồng đủ điều kiện" });
            return;
        }

        setSubmitting(true);

        const users = loadUsers();
        const ctv = users.find(u => u.id === currentUser.id);

        createPayoutRequest({
            ctvId: currentUser.id,
            ctvName: ctv?.name || currentUser.name || "CTV",
            periodYear: selectedYear,
            periodMonth: selectedMonth,
            requestedAmount: amount,
            commissionFromOrders: eligibility.commissionFromOrders,
            commissionFromReferrals: eligibility.commissionFromReferrals,
            totalEligibleAtRequestTime: eligibility.totalEligible,
            coveredOrderIds: eligibility.eligibleOrderIds,
        });

        refreshData();
        setRequestAmount("");
        setMessage({ type: "success", text: "Đã gửi yêu cầu thanh toán thành công!" });
        setSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Yêu cầu rút tiền</h1>
                    <p className="text-slate-600">Quản lý yêu cầu thanh toán hoa hồng của bạn</p>
                </div>
                <a
                    href="/ctv/wallet"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                    <Wallet className="w-4 h-4" />
                    <span>Xem ví</span>
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>

            {/* Current Cycle Draft */}
            {currentDraft && currentDraft.status === "DRAFT" && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-1">Đề xuất thanh toán kỳ {getCycleLabel(currentDraft.cycleKey || "")}</h3>
                            <p className="text-sm text-slate-600">Hệ thống đã tạo đề xuất dựa trên đơn hàng đã giao</p>
                            <div className="mt-2 flex flex-wrap gap-4 text-sm">
                                <span>Hoa hồng đơn: <strong>{formatPrice(currentDraft.commissionFromOrders)}</strong></span>
                                <span>Thưởng giới thiệu: <strong>{formatPrice(currentDraft.commissionFromReferrals)}</strong></span>
                            </div>
                            <p className="mt-2 text-lg font-bold text-green-600">Tổng: {formatPrice(currentDraft.requestedAmount)}</p>
                        </div>
                        <button
                            onClick={handleConfirmDraft}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 flex-shrink-0"
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span>Xác nhận yêu cầu trả</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Month Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-500" />
                    <span className="text-sm text-slate-600">Tạo yêu cầu thủ công:</span>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Manual Request Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Yêu cầu thủ công</h3>

                {message && (
                    <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span>{message.text}</span>
                    </div>
                )}

                {hasPending ? (
                    <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                        <p>Bạn đã có yêu cầu đang chờ duyệt cho tháng này.</p>
                    </div>
                ) : eligibility && eligibility.totalEligible > 0 ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="text-sm text-slate-600">Hoa hồng đơn hàng</p>
                                <p className="text-lg font-semibold text-slate-900">{formatPrice(eligibility.commissionFromOrders)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Thưởng giới thiệu</p>
                                <p className="text-lg font-semibold text-slate-900">{formatPrice(eligibility.commissionFromReferrals)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Tổng đủ điều kiện</p>
                                <p className="text-lg font-bold text-green-600">{formatPrice(eligibility.totalEligible)}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Số tiền muốn rút (tùy chọn)
                                </label>
                                <input
                                    type="number"
                                    value={requestAmount}
                                    onChange={(e) => setRequestAmount(e.target.value)}
                                    placeholder={eligibility.totalEligible.toString()}
                                    max={eligibility.totalEligible}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>Gửi yêu cầu</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-slate-50 text-slate-600 rounded-lg">
                        <p>Không có hoa hồng đủ điều kiện để rút trong tháng này.</p>
                    </div>
                )}
            </div>

            {/* Payout History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Lịch sử yêu cầu</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mã yêu cầu</th>
                                <th className="px-6 py-3 font-medium">Kỳ</th>
                                <th className="px-6 py-3 font-medium text-right">Số tiền yêu cầu</th>
                                <th className="px-6 py-3 font-medium text-right">Số tiền duyệt</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium">Ghi chú</th>
                                <th className="px-6 py-3 font-medium">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {payouts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        Chưa có yêu cầu nào
                                    </td>
                                </tr>
                            ) : (
                                payouts.map((payout) => (
                                    <tr key={payout.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-sm">{payout.id}</td>
                                        <td className="px-6 py-4">
                                            {payout.cycleKey ? getCycleLabel(payout.cycleKey) : `${payout.periodMonth}/${payout.periodYear}`}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">{formatPrice(payout.requestedAmount)}</td>
                                        <td className="px-6 py-4 text-right">
                                            {payout.approvedAmount ? formatPrice(payout.approvedAmount) : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[payout.status].color}`}>
                                                {STATUS_CONFIG[payout.status].label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">
                                            {payout.adminNote || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{formatDate(payout.createdAt)}</td>
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
