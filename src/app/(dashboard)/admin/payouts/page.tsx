"use client";

import { useEffect, useState, useMemo } from "react";
import {
    loadPayouts,
    approvePayoutRequest,
    rejectPayoutRequest,
    markPaid,
    autoGeneratePayoutDraftsForCurrentCycle,
    type PayoutRequest,
    type PayoutStatus
} from "@/lib/payoutStore";
import { getCurrentCycle, getCycleLabel } from "@/lib/payoutCycles";
import { recomputeWalletsFromSourceData } from "@/lib/walletStore";
import { Wallet, Clock, CheckCircle, DollarSign, Search, Filter, X, RefreshCw, Zap } from "lucide-react";

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

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<PayoutStatus | "all">("all");
    const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
    const [modalType, setModalType] = useState<"approve" | "reject" | "paid" | null>(null);
    const [approvedAmount, setApprovedAmount] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const cycle = useMemo(() => getCurrentCycle(), []);

    useEffect(() => {
        refreshPayouts();
    }, []);

    const refreshPayouts = () => {
        recomputeWalletsFromSourceData();
        const allPayouts = loadPayouts();
        setPayouts(allPayouts);
    };

    const handleGenerateDrafts = () => {
        setGenerating(true);
        const count = autoGeneratePayoutDraftsForCurrentCycle();
        setMessage(`Đã tạo/cập nhật ${count} đề xuất thanh toán cho kỳ ${cycle.label}`);
        refreshPayouts();
        setGenerating(false);
        setTimeout(() => setMessage(null), 3000);
    };

    const filteredPayouts = useMemo(() => {
        let result = payouts;

        if (filterStatus !== "all") {
            result = result.filter(p => p.status === filterStatus);
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.ctvName.toLowerCase().includes(lowerTerm) ||
                p.id.toLowerCase().includes(lowerTerm)
            );
        }

        return result;
    }, [payouts, filterStatus, searchTerm]);

    const stats = useMemo(() => ({
        draftCount: payouts.filter(p => p.status === "DRAFT").length,
        pendingCount: payouts.filter(p => p.status === "REQUESTED").length,
        pendingAmount: payouts.filter(p => p.status === "REQUESTED").reduce((sum, p) => sum + p.requestedAmount, 0),
        approvedAmount: payouts.filter(p => p.status === "APPROVED").reduce((sum, p) => sum + (p.approvedAmount || p.requestedAmount), 0),
        paidAmount: payouts.filter(p => p.status === "PAID").reduce((sum, p) => sum + (p.approvedAmount || p.requestedAmount), 0),
    }), [payouts]);

    const handleApprove = () => {
        if (!selectedPayout) return;
        const amount = approvedAmount ? parseFloat(approvedAmount) : undefined;
        approvePayoutRequest(selectedPayout.id, amount, adminNote || undefined);
        refreshPayouts();
        closeModal();
    };

    const handleReject = () => {
        if (!selectedPayout) return;
        rejectPayoutRequest(selectedPayout.id, adminNote || undefined);
        refreshPayouts();
        closeModal();
    };

    const handleMarkPaid = () => {
        if (!selectedPayout) return;
        markPaid(selectedPayout.id, adminNote || undefined);
        refreshPayouts();
        closeModal();
    };

    const openModal = (payout: PayoutRequest, type: "approve" | "reject" | "paid") => {
        setSelectedPayout(payout);
        setModalType(type);
        setApprovedAmount(payout.requestedAmount.toString());
        setAdminNote("");
    };

    const closeModal = () => {
        setSelectedPayout(null);
        setModalType(null);
        setApprovedAmount("");
        setAdminNote("");
    };

    const summaryCards = [
        {
            label: "Đề xuất (Draft)",
            value: stats.draftCount.toString(),
            sub: "Chờ CTV xác nhận",
            icon: Zap,
            color: "text-slate-600",
            bg: "bg-slate-50",
        },
        {
            label: "Chờ duyệt",
            value: stats.pendingCount.toString(),
            sub: formatPrice(stats.pendingAmount),
            icon: Clock,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
        },
        {
            label: "Đã duyệt",
            value: formatPrice(stats.approvedAmount),
            sub: "Chờ thanh toán",
            icon: CheckCircle,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Đã thanh toán",
            value: formatPrice(stats.paidAmount),
            sub: "Tổng đã chi trả",
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-50",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý thanh toán CTV</h1>
                    <p className="text-slate-600">Kỳ hiện tại: {cycle.label}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={refreshPayouts}
                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Làm mới</span>
                    </button>
                    <button
                        onClick={handleGenerateDrafts}
                        disabled={generating}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Zap className="w-4 h-4" />
                        <span>Tạo đề xuất kỳ này</span>
                    </button>
                </div>
            </div>

            {message && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{message}</span>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
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

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo CTV hoặc mã yêu cầu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as PayoutStatus | "all")}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">Tất cả</option>
                            <option value="DRAFT">Đề xuất</option>
                            <option value="REQUESTED">Chờ duyệt</option>
                            <option value="APPROVED">Đã duyệt</option>
                            <option value="REJECTED">Từ chối</option>
                            <option value="PAID">Đã thanh toán</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Mã yêu cầu</th>
                                <th className="px-6 py-3 font-medium">CTV</th>
                                <th className="px-6 py-3 font-medium">Kỳ</th>
                                <th className="px-6 py-3 font-medium text-right">Yêu cầu</th>
                                <th className="px-6 py-3 font-medium text-right">Duyệt</th>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium">Ngày</th>
                                <th className="px-6 py-3 font-medium">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredPayouts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                                        Không có yêu cầu nào
                                    </td>
                                </tr>
                            ) : (
                                filteredPayouts.map((payout) => (
                                    <tr key={payout.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-sm">{payout.id}</td>
                                        <td className="px-6 py-4 font-medium">{payout.ctvName}</td>
                                        <td className="px-6 py-4">
                                            {payout.cycleKey ? getCycleLabel(payout.cycleKey) : `${payout.periodMonth}/${payout.periodYear}`}
                                        </td>
                                        <td className="px-6 py-4 text-right">{formatPrice(payout.requestedAmount)}</td>
                                        <td className="px-6 py-4 text-right">
                                            {payout.approvedAmount ? formatPrice(payout.approvedAmount) : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[payout.status].color}`}>
                                                {STATUS_CONFIG[payout.status].label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{formatDate(payout.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {(payout.status === "REQUESTED" || payout.status === "DRAFT") && (
                                                    <>
                                                        <button
                                                            onClick={() => openModal(payout, "approve")}
                                                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                        >
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => openModal(payout, "reject")}
                                                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}
                                                {payout.status === "APPROVED" && (
                                                    <button
                                                        onClick={() => openModal(payout, "paid")}
                                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                    >
                                                        Đã thanh toán
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalType && selectedPayout && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {modalType === "approve" && "Duyệt yêu cầu"}
                                {modalType === "reject" && "Từ chối yêu cầu"}
                                {modalType === "paid" && "Xác nhận đã thanh toán"}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                                <p className="text-sm"><strong>CTV:</strong> {selectedPayout.ctvName}</p>
                                <p className="text-sm"><strong>Kỳ:</strong> {selectedPayout.cycleKey ? getCycleLabel(selectedPayout.cycleKey) : `${selectedPayout.periodMonth}/${selectedPayout.periodYear}`}</p>
                                <p className="text-sm"><strong>Hoa hồng đơn:</strong> {formatPrice(selectedPayout.commissionFromOrders)}</p>
                                <p className="text-sm"><strong>Thưởng giới thiệu:</strong> {formatPrice(selectedPayout.commissionFromReferrals)}</p>
                                <p className="text-sm font-medium"><strong>Tổng yêu cầu:</strong> {formatPrice(selectedPayout.requestedAmount)}</p>
                            </div>

                            {modalType === "approve" && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Số tiền duyệt
                                    </label>
                                    <input
                                        type="number"
                                        value={approvedAmount}
                                        onChange={(e) => setApprovedAmount(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Ghi chú (tùy chọn)
                                </label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            {modalType === "approve" && (
                                <button
                                    onClick={handleApprove}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Duyệt
                                </button>
                            )}
                            {modalType === "reject" && (
                                <button
                                    onClick={handleReject}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Từ chối
                                </button>
                            )}
                            {modalType === "paid" && (
                                <button
                                    onClick={handleMarkPaid}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Xác nhận đã thanh toán
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
