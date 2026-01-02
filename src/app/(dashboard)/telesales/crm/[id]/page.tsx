"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft, Phone, Building, Calendar, Clock, Edit2, Trash2, Plus,
    CheckCircle2, XCircle, MessageSquare, FileText, Tag, ShoppingCart, Package
} from "lucide-react";
import {
    CRMDeal, CRMActivity, CRMDealItem,
    fetchDeal, updateDeal, deleteDeal, fetchActivities, createActivity, fetchDealItems,
    DEAL_STAGE_LABELS, DEAL_PRIORITY_LABELS, CALL_RESULT_LABELS, ACTIVITY_TYPE_LABELS,
    CallResult
} from "@/lib/crmDealsStore";
import { CreateDealModal } from "@/components/telesales/CreateDealModal";
import { LogCallModal } from "@/components/telesales/LogCallModal";
import { LostReasonModal } from "@/components/telesales/LostReasonModal";
import DealProducts from "@/components/telesales/DealProducts";
import { useAuth } from "@/components/auth/AuthProvider";

// Customer Type Labels
const CUSTOMER_TYPE_LABELS: Record<string, string> = {
    tap_hoa: "Tạp hóa",
    mini_mart: "Mini mart",
    dai_ly: "Đại lý",
    npp: "NPP",
    sieu_thi: "Siêu thị"
};

const DEAL_SOURCE_LABELS: Record<string, string> = {
    data_moi: 'Data mới',
    inbound: 'Khách gọi đến',
    referral: 'Giới thiệu',
    reactivation: 'Kích hoạt lại'
};

export default function DealDetailPage() {
    const params = useParams();
    const dealId = params.id as string;

    const router = useRouter();
    const { user, session } = useAuth();
    const [deal, setDeal] = useState<CRMDeal | null>(null);
    const [activities, setActivities] = useState<CRMActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'activities' | 'notes' | 'products'>('activities');
    const [dealItems, setDealItems] = useState<CRMDealItem[]>([]);

    // Modal states
    const [isLogCallOpen, setIsLogCallOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLostModalOpen, setIsLostModalOpen] = useState(false);

    // Helper to get user ID
    const getUserId = (): string | null => {
        if (user?.id) return user.id;
        if (typeof window !== "undefined") {
            const mockUserStr = localStorage.getItem("lyhu_user");
            if (mockUserStr) {
                try {
                    const mockUser = JSON.parse(mockUserStr);
                    return mockUser.id || mockUser.uid || mockUser.user_id || null;
                } catch { return null; }
            }
        }
        return null;
    };

    // Load deal and activities
    useEffect(() => {
        const loadData = async () => {
            if (!dealId) return;
            setIsLoading(true);
            try {
                const [d, acts, items] = await Promise.all([
                    fetchDeal(dealId, session?.access_token),
                    fetchActivities(dealId, session?.access_token),
                    fetchDealItems(dealId, session?.access_token)
                ]);
                setDeal(d);
                setActivities(acts);
                setDealItems(items);
            } catch (err) {
                console.error('Error loading deal:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [dealId, session?.access_token]);

    const handleItemsChange = async () => {
        if (!deal) return;
        const items = await fetchDealItems(deal.id);
        setDealItems(items);

        // Update deal value and optimistic update
        const total = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
        if (total !== deal.expected_value) {
            await updateDeal(deal.id, { expected_value: total }, session?.access_token);
            setDeal(prev => prev ? ({ ...prev, expected_value: total }) : null);
        }
    };

    const handleLogCall = async (data: any) => {
        if (!deal || !user?.id) return;

        const callResult = data.call_result || 'answered';
        const duration = data.call_duration_seconds || 0;
        const description = data.description || data.note || '';

        const activity = await createActivity({
            deal_id: deal.id,
            customer_id: deal.customer_id,
            type: 'call',
            subject: `Cuộc gọi - ${CALL_RESULT_LABELS[callResult as CallResult] || callResult}`,
            description: description,
            call_duration_seconds: duration,
            call_result: callResult as CallResult,
            user_id: user.id
        }, session?.access_token);

        if (activity) {
            setActivities(prev => [activity, ...prev]);
        }

        setIsLogCallOpen(false);
    };

    const handleMarkWon = async () => {
        if (!deal) return;
        await updateDeal(deal.id, { status: 'won', stage: 'done' }, session?.access_token);
        setDeal(prev => prev ? { ...prev, status: 'won', stage: 'done' } : null);
    };

    const handleMarkLost = () => {
        setIsLostModalOpen(true);
    };

    const handleConfirmLost = async (reason: string) => {
        if (!deal) return;
        await updateDeal(deal.id, { status: 'lost', stage: 'done', lost_reason: reason }, session?.access_token);
        setDeal(prev => prev ? { ...prev, status: 'lost', stage: 'done', lost_reason: reason } : null);
        setIsLostModalOpen(false);
    };

    const handleReopen = async () => {
        if (!deal) return;
        if (confirm("Bạn muốn mở lại cơ hội này? Trạng thái sẽ về 'Đang mở'.")) {
            // Reset to open
            await updateDeal(deal.id, { status: 'open' }, session?.access_token);
            setDeal(prev => prev ? { ...prev, status: 'open' } : null);
        }
    };

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (updatedData: any) => {
        if (!deal) return;

        // Update local state immediately
        const updatedDeal = { ...deal, ...updatedData };
        setDeal(updatedDeal);
        setIsEditModalOpen(false);

        // Update DB
        await updateDeal(deal.id, updatedData, session?.access_token);
    };

    const handleDelete = async () => {
        if (!deal) return;
        if (confirm("Bạn chắc chắn muốn xóa cơ hội này?")) {
            await deleteDeal(deal.id, session?.access_token);
            router.push('/telesales/crm');
        }
    };

    const formatPrice = (amount?: number | null) => {
        if (!amount) return "—";
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "—";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center h-[60vh]">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-slate-500">Không tìm thấy cơ hội</p>
                    <button
                        onClick={() => router.push('/telesales/crm')}
                        className="mt-4 text-primary-600 hover:underline"
                    >
                        Quay lại CRM
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/telesales/crm')}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{deal.title}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${deal.status === 'won' ? 'bg-green-100 text-green-700' :
                                deal.status === 'lost' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {deal.status === 'won' ? 'THẮNG' : deal.status === 'lost' ? 'THUA' : 'ĐANG MỞ'}
                            </span>
                            <span className="text-sm text-slate-500">
                                {DEAL_STAGE_LABELS[deal.stage]}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleEdit}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                        title="Chỉnh sửa"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => router.push(`/telesales/create-order?deal_id=${deal.id}&customer_id=${deal.customer_id}`)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-indigo-600"
                        title="Tạo đơn hàng"
                    >
                        <ShoppingCart className="w-5 h-5" />
                    </button>
                    {deal.status === 'open' ? (
                        <>
                            <button
                                onClick={handleMarkWon}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Thắng
                            </button>
                            <button
                                onClick={handleMarkLost}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                            >
                                <XCircle className="w-4 h-4" />
                                Thua
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleReopen}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Mở lại
                        </button>
                    )}
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button
                        onClick={handleDelete}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                        title="Xóa"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Customer Info */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Customer Card */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Thông tin khách hàng
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <div className="text-xs text-slate-500">Tên cửa hàng</div>
                                <div className="font-medium text-slate-900">{deal.customer?.name || "—"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Số điện thoại</div>
                                <a href={`tel:${deal.customer?.phone}`} className="font-medium text-primary-600 hover:underline flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {deal.customer?.phone || "—"}
                                </a>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Loại khách</div>
                                <div className="font-medium text-slate-900">
                                    {CUSTOMER_TYPE_LABELS[deal.customer?.type || ''] || deal.customer?.type || "—"}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Địa chỉ</div>
                                <div className="font-medium text-slate-900">{deal.customer?.address || "—"}</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsLogCallOpen(true)}
                            className="w-full mt-4 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                            <Phone className="w-4 h-4" />
                            Ghi cuộc gọi
                        </button>
                    </div>

                    {/* Deal Info Card */}
                    <div className="bg-white rounded-xl border p-4 shadow-sm">
                        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Thông tin cơ hội
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <div className="text-xs text-slate-500">Giá trị dự kiến</div>
                                <div className="font-medium text-indigo-600 font-bold">{formatPrice(deal.expected_value)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Độ ưu tiên</div>
                                <div className="font-medium text-slate-900">{DEAL_PRIORITY_LABELS[deal.priority]}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Nguồn</div>
                                <div className="font-medium text-slate-900">
                                    {deal.source ? (DEAL_SOURCE_LABELS[deal.source] || deal.source) : "—"}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Nhắc việc</div>
                                <div className="font-medium text-slate-900 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {deal.next_action_at ? new Date(deal.next_action_at).toLocaleDateString('vi-VN') : "Chưa đặt"}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">Tạo lúc</div>
                                <div className="text-sm text-slate-700">{formatDate(deal.created_at)}</div>
                            </div>
                            {deal.lost_reason && (
                                <div>
                                    <div className="text-xs text-slate-500">Lý do thua</div>
                                    <div className="text-sm text-red-600">{deal.lost_reason}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Tabs */}
                <div className="lg:col-span-2">
                    {/* Tab Buttons */}
                    <div className="flex border-b mb-4">
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activities'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            onClick={() => setActiveTab('activities')}
                        >
                            <Phone className="w-4 h-4 inline mr-1" />
                            Hoạt động ({activities.length})
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notes'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            onClick={() => setActiveTab('notes')}
                        >
                            <MessageSquare className="w-4 h-4 inline mr-1" />
                            Ghi chú
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'products'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            onClick={() => setActiveTab('products')}
                        >
                            <Package className="w-4 h-4 inline mr-1" />
                            Sản phẩm ({dealItems.length})
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-xl border shadow-sm">
                        {activeTab === 'activities' && (
                            <div className="p-4">
                                {activities.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>Chưa có hoạt động nào</p>
                                        <button
                                            onClick={() => setIsLogCallOpen(true)}
                                            className="mt-3 text-primary-600 hover:underline text-sm"
                                        >
                                            + Ghi cuộc gọi đầu tiên
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activities.map(activity => (
                                            <div key={activity.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.call_result === 'answered' ? 'bg-green-100 text-green-600' :
                                                    activity.call_result === 'no_answer' ? 'bg-red-100 text-red-600' :
                                                        'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    <Phone className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm text-slate-900">
                                                            {activity.subject || ACTIVITY_TYPE_LABELS[activity.type]}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {formatDate(activity.created_at)}
                                                        </span>
                                                    </div>
                                                    {activity.call_result && (
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {CALL_RESULT_LABELS[activity.call_result]} • {formatDuration(activity.call_duration_seconds)}
                                                        </div>
                                                    )}
                                                    {activity.description && (
                                                        <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div className="p-4">
                                {deal.note ? (
                                    <div className="prose prose-sm max-w-none">
                                        <p className="whitespace-pre-wrap text-slate-700">{deal.note}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>Chưa có ghi chú</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'products' && (
                            <div className="p-4">
                                <DealProducts
                                    dealId={deal.id}
                                    items={dealItems}
                                    onItemsChange={handleItemsChange}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Log Call Modal */}
            <LogCallModal
                isOpen={isLogCallOpen}
                onClose={() => setIsLogCallOpen(false)}
                onSave={handleLogCall}
                customerName={deal.customer?.name}
                customerPhone={deal.customer?.phone}
            />

            {/* Edit Deal Modal */}
            <CreateDealModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveEdit}
                initialData={deal}
                userId={user?.id}
            />

            {/* Lost Reason Modal */}
            <LostReasonModal
                isOpen={isLostModalOpen}
                onClose={() => setIsLostModalOpen(false)}
                onConfirm={handleConfirmLost}
                dealTitle={deal.title}
            />
        </div>
    );
}
