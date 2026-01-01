"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    List,
    Search,
    Plus,
    Calendar,
    Phone,
    CheckCircle2,
    Trash2,
    Edit2,
    Settings,
    Eye,
    EyeOff,
    Filter,
    RotateCcw,
    Bell,
    AlertTriangle,
    Building,
    FileText,
    ShoppingCart,
    XCircle
} from "lucide-react";
import {
    CRMDeal,
    DealStage,
    DealPriority,
    DEAL_PRIORITY_LABELS,
    DEAL_STAGE_LABELS,
    fetchDealsForUser,
    updateDeal,
    createDeal,
    deleteDeal,
    createCustomer,
    loadCRMColumns,
    saveCRMColumns,
    CRMColumn,
    DEFAULT_CRM_COLUMNS,
    canEditDeal,
    canDeleteDeal
} from "@/lib/crmDealsStore";
import { CreateDealModal } from "@/components/telesales/CreateDealModal";
import { LostReasonModal } from "@/components/telesales/LostReasonModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

// --- Local Column Management Functions ---
const addColumn = () => {
    const cols = loadCRMColumns();
    const newId = `col_${Date.now()}`;
    const newCol: CRMColumn = {
        id: newId,
        label: "Cột mới",
        stage: 'new_data' as DealStage,
        order: cols.length,
        isDefault: false,
        isVisible: true
    };
    const newCols = [...cols, newCol];
    saveCRMColumns(newCols);
    return newCols;
};

const deleteColumn = (id: string) => {
    const cols = loadCRMColumns().filter(c => c.id !== id);
    saveCRMColumns(cols);
    return cols;
};

const updateColumn = (id: string, patch: Partial<CRMColumn>) => {
    const cols = loadCRMColumns().map(c => c.id === id ? { ...c, ...patch } : c);
    saveCRMColumns(cols);
    return cols;
};

const resetColumns = () => {
    saveCRMColumns(DEFAULT_CRM_COLUMNS);
    return DEFAULT_CRM_COLUMNS;
};

// --- Components ---

const PriorityBadge = ({ priority }: { priority: DealPriority }) => {
    const colors = {
        low: "bg-slate-100 text-slate-700",
        normal: "bg-blue-100 text-blue-700",
        high: "bg-orange-100 text-orange-700",
        urgent: "bg-red-100 text-red-700",
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || colors.normal}`}>
            {DEAL_PRIORITY_LABELS[priority]}
        </span>
    );
};

const CustomerTypeBadge = ({ type }: { type?: string }) => {
    const colors: Record<string, string> = {
        tap_hoa: "bg-green-100 text-green-700",
        mini_mart: "bg-purple-100 text-purple-700",
        dai_ly: "bg-blue-100 text-blue-700",
        npp: "bg-orange-100 text-orange-700",
        sieu_thi: "bg-pink-100 text-pink-700",
    };
    const labels: Record<string, string> = {
        tap_hoa: "Tạp hóa",
        mini_mart: "Mini mart",
        dai_ly: "Đại lý",
        npp: "NPP",
        sieu_thi: "Siêu thị",
    };
    return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[type || 'tap_hoa'] || colors.tap_hoa}`}>
            {labels[type || 'tap_hoa'] || type}
        </span>
    );
};

interface DealCardProps {
    deal: CRMDeal;
    isDragging: boolean;
    onDragStart: (e: React.DragEvent, id: string, colId: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDragEnd: () => void;
    dropIndicator: { dealId: string; position: 'top' | 'bottom' } | null;
    onEdit: (deal: CRMDeal) => void;
    onViewDetails: (dealId: string) => void;
    onCreateOrder: (deal: CRMDeal) => void;
    onMarkLost: (deal: CRMDeal) => void;
    onRefresh: () => Promise<void>;
    isOverdue?: boolean;
    isHighlighted?: boolean;
}

const DealCard = ({ deal, isDragging, onDragStart, onDragOver, onDragEnd, dropIndicator, onEdit, onViewDetails, onCreateOrder, onMarkLost, onRefresh, isOverdue, isHighlighted }: DealCardProps) => {
    const { session } = useAuth();

    const handleMarkWon = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateDeal(deal.id, { status: 'won', stage: 'done' }, session?.access_token);
        await onRefresh();
    };

    const handleMarkLost = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMarkLost(deal);
    };

    return (
        <>
            {dropIndicator?.dealId === deal.id && dropIndicator.position === 'top' && (
                <div className="mb-3 h-24 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/50 animate-pulse pointer-events-none" />
            )}

            <div
                id={`deal-${deal.id}`}
                draggable
                onClick={() => onEdit(deal)}
                onDragStart={(e) => {
                    e.stopPropagation();
                    onDragStart(e, deal.id, deal.stage);
                }}
                onDragEnd={onDragEnd}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDragOver(e, deal.id);
                }}
                className={`relative bg-white p-3 rounded-lg shadow-sm border cursor-move transition-all mb-3 group/card 
                ${isDragging ? 'opacity-50 scale-95 ring-2 ring-primary-200 rotate-1' :
                        isHighlighted ? 'border-yellow-400 ring-2 ring-yellow-400 shadow-md scale-[1.02] z-10' :
                            deal.status === 'won' ? 'border-green-200 bg-green-50/30' :
                                deal.status === 'lost' ? 'border-red-200 bg-red-50/30 opacity-60' :
                                    isOverdue ? 'border-red-300 ring-1 ring-red-100' :
                                        'border-slate-200 hover:shadow-md hover:border-primary-200'
                    }`}
            >
                {/* Status Badge */}
                {deal.status !== 'open' && (
                    <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded text-[10px] font-bold ${deal.status === 'won' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                        {deal.status === 'won' ? 'WON' : 'LOST'}
                    </div>
                )}

                {/* Customer Info */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Building className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-medium text-slate-900 text-sm truncate">
                                {deal.customer?.name || "Khách hàng"}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Phone className="w-3 h-3" />
                                <a href={`tel:${deal.customer?.phone}`} onClick={e => e.stopPropagation()} className="hover:text-primary-600">
                                    {deal.customer?.phone || "N/A"}
                                </a>
                            </div>
                        </div>
                    </div>
                    <CustomerTypeBadge type={deal.customer?.type} />
                </div>

                {/* Deal Title */}
                <h4 className="font-medium text-slate-800 text-sm mb-2 line-clamp-2">{deal.title}</h4>

                {/* Tags */}
                {deal.tags && deal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {deal.tags.map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                        {deal.next_action_at ? (
                            <>
                                {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                <span>{new Date(deal.next_action_at).toLocaleDateString('vi-VN')}</span>
                            </>
                        ) : (
                            <PriorityBadge priority={deal.priority} />
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <a
                            href={`tel:${deal.customer?.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="p-1 hover:bg-green-100 rounded text-slate-400 hover:text-green-600"
                            title="Gọi điện"
                        >
                            <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                            onClick={(e) => { e.stopPropagation(); onViewDetails(deal.id); }}
                            className="p-1 hover:bg-purple-100 rounded text-slate-400 hover:text-purple-600"
                            title="Xem chi tiết"
                        >
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onCreateOrder(deal); }}
                            className="p-1 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-600"
                            title="Lên đơn"
                        >
                            <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                        {deal.status === 'open' ? (
                            <>
                                <button
                                    onClick={handleMarkWon}
                                    className="p-1 hover:bg-green-100 rounded text-slate-400 hover:text-green-600"
                                    title="Đánh dấu Won"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={handleMarkLost}
                                    className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-600"
                                    title="Đánh dấu Lost"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                </button>
                            </>
                        ) : (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${deal.status === 'won' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {deal.status === 'won' ? 'WON' : 'LOST'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {dropIndicator?.dealId === deal.id && dropIndicator.position === 'bottom' && (
                <div className="mb-3 h-24 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/50 animate-pulse pointer-events-none" />
            )}
        </>
    );
};

// Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// --- Main Page ---

export default function CRMPage() {
    const { user, session, role: authRole, isLoading: authIsLoading } = useAuth();
    const router = useRouter();
    const [deals, setDeals] = useState<CRMDeal[]>([]);
    const [columns, setColumns] = useState<CRMColumn[]>([]);
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false); // For hydration fix

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 150);
    const [filterPriority, setFilterPriority] = useState<DealPriority | "all">("all");
    const [filterStatus, setFilterStatus] = useState<"all" | "open" | "won" | "lost">("open");
    const [filterCustomerType, setFilterCustomerType] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "due_date">("newest");

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalInitialStage, setCreateModalInitialStage] = useState<DealStage>("new_data");
    const [editingDeal, setEditingDeal] = useState<CRMDeal | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // DnD States
    const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ dealId: string; position: 'top' | 'bottom' } | null>(null);
    const [dragOverColId, setDragOverColId] = useState<string | null>(null);
    const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
    const [dropColIndicator, setDropColIndicator] = useState<{ colId: string; position: 'left' | 'right' } | null>(null);

    // Notification
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [highlightedDealId, setHighlightedDealId] = useState<string | null>(null);
    const [debugLogs, setDebugLogs] = useState<{ time: string, msg: string, type: 'info' | 'error' }[]>([]);

    // Lost Reason Modal
    const [isLostModalOpen, setIsLostModalOpen] = useState(false);
    const [dealToMarkLost, setDealToMarkLost] = useState<CRMDeal | null>(null);

    // Inline column editing
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const editInputRef = useRef<HTMLInputElement>(null);

    // Debug Helper
    const logDebug = (msg: string, type: 'info' | 'error' = 'info') => {
        const time = new Date().toLocaleTimeString();
        setDebugLogs(prev => [{ time, msg, type }, ...prev]);
    };

    const handleDrop = async (e: React.DragEvent, targetColId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("crm/deal");
        const sourceColId = e.dataTransfer.getData("crm/source-col");
        setDraggedDealId(null);
        setDropIndicator(null);
        setDragOverColId(null);

        const dealToMove = deals.find(d => d.id === draggedId);
        if (!dealToMove) return;

        // Check if dragging from 'done' to another column - need to reopen
        const isMovingFromDone = sourceColId === 'done' && targetColId !== 'done';

        logDebug(`Moving deal ${dealToMove.title} to ${targetColId}...`);

        if (targetColId === draggedId) return; // Same column check

        // Optimistic UI Update first...

        let success = false;
        if (isMovingFromDone && dealToMove.status !== 'open') {
            // ... logic
            const updatedDeal = { ...dealToMove, stage: targetColId as DealStage, status: 'open' as const };
            setDeals(deals.map(d => d.id === draggedId ? updatedDeal : d));
            success = await updateDeal(draggedId, { stage: targetColId as DealStage, status: 'open' }, session?.access_token);
        } else {
            const updatedDeal = { ...dealToMove, stage: targetColId as DealStage };
            setDeals(deals.map(d => d.id === draggedId ? updatedDeal : d));
            success = await updateDeal(draggedId, { stage: targetColId as DealStage }, session?.access_token);
        }

        if (!success) {
            logDebug(`FAILED to save deal ${dealToMove.title}.`, 'error');
            alert("Lỗi: Không thể lưu thay đổi (Permission denied or Network error).");
            refreshData(); // Revert the optimistic update
            return;
        }

        // SUCCESS: Don't call refreshData() here!
        // Realtime subscription will handle syncing.
        // This avoids request conflicts that cause hanging.
        logDebug(`SUCCESS saved deal ${dealToMove.title}.`, 'info');
    };

    const getUserInfo = (): { id: string | null; role: string } => {
        // First try: Supabase auth with role from profiles table
        if (user?.id && authRole) {
            return { id: user.id, role: authRole };
        }
        // Fallback: localStorage mock user
        if (typeof window !== "undefined") {
            const mockUserStr = localStorage.getItem("lyhu_user");
            if (mockUserStr) {
                try {
                    const mockUser = JSON.parse(mockUserStr);
                    return {
                        id: mockUser.id || mockUser.uid || mockUser.user_id || null,
                        role: mockUser.role || 'telesales'
                    };
                } catch { return { id: null, role: 'telesales' }; }
            }
        }
        return { id: null, role: 'telesales' };
    };

    // Get user info from auth or localStorage
    const userInfo = getUserInfo();

    // Check if user is Admin or Sale Admin (can see all deals)
    const isAdminOrSaleAdmin = userInfo.role === 'admin' || userInfo.role === 'sale_admin';

    // Only Admin can customize columns
    const isAdmin = userInfo.role === 'admin';

    const refreshData = async () => {
        console.log('[CRM Debug] refreshData called, userInfo:', userInfo);
        if (!userInfo.id) {
            setIsDataLoading(false);
            return;
        }

        // Don't show loading spinner for background refreshes (Realtime triggers)
        // Only show for initial load (when deals is empty)
        const isInitialLoad = deals.length === 0;
        if (isInitialLoad) {
            setIsDataLoading(true);
        }

        try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 10000)
            );

            const fetchedDeals = await Promise.race([
                fetchDealsForUser(userInfo.id, userInfo.role, session?.access_token),
                timeoutPromise
            ]) as CRMDeal[];

            console.log('[CRM Debug] fetched deals:', fetchedDeals.length);
            setDeals(fetchedDeals);
            setColumns(loadCRMColumns().sort((a, b) => a.order - b.order));
        } catch (err) {
            console.error('[CRM Debug] refreshData error/timeout:', err);
        } finally {
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        // Realtime Subscription - RE-ENABLED after fixing updateDeal to use pure fetch
        if (!userInfo.id) return;

        let refreshTimeout: NodeJS.Timeout;

        const channel = supabase
            .channel('crm_realtime_updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'crm_deals'
                },
                (payload: any) => {
                    console.log('[Realtime] Change detected:', payload);
                    // Debounce refresh to avoid conflicts
                    clearTimeout(refreshTimeout);
                    refreshTimeout = setTimeout(() => {
                        console.log('[Realtime] Triggering refresh...');
                        refreshData();
                    }, 500);
                }
            )
            .subscribe((status: any) => {
                console.log('[Realtime] Status:', status);
            });

        return () => {
            clearTimeout(refreshTimeout);
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo.id, userInfo.role]);

    useEffect(() => {
        // Always set default columns first to ensure UI shows something
        setColumns(DEFAULT_CRM_COLUMNS.sort((a, b) => a.order - b.order));

        // Wait for auth to finish loading before fetching data
        if (authIsLoading) {
            console.log('[CRM Effect] Auth loading, skipping refresh');
            return;
        }

        console.log('[CRM Effect] Auth loaded. User:', user?.id, 'Role:', authRole);
        console.log('[CRM Effect] Calling refreshData...');

        refreshData();
        const handleColumnUpdate = () => {
            setColumns(loadCRMColumns().sort((a, b) => a.order - b.order));
        };
        window.addEventListener("crm-columns-updated", handleColumnUpdate);
        return () => window.removeEventListener("crm-columns-updated", handleColumnUpdate);
    }, [user?.id, authRole, authIsLoading]);

    useEffect(() => {
        if (editingColumnId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingColumnId]);

    // Hydration fix: set mounted after first render
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const openCreateModal = (stage: DealStage = "new_data") => {
        setCreateModalInitialStage(stage);
        setEditingDeal(null);
        setIsCreateModalOpen(true);
    };

    const handleEditDeal = (deal: CRMDeal) => {
        setEditingDeal(deal);
        setCreateModalInitialStage(deal.stage);
        setIsCreateModalOpen(true);
    };

    const handleCreateOrder = (deal: CRMDeal) => {
        router.push(`/telesales/create-order?deal_id=${deal.id}&customer_id=${deal.customer_id}`);
    };

    const handleViewDetails = (dealId: string) => {
        router.push(`/crm/${dealId}`);
    };

    const handleSaveDeal = async (dealData: any) => {
        if (!userInfo.id) return;

        setIsDataLoading(true);
        try {
            if (editingDeal?.id) {
                await updateDeal(editingDeal.id, {
                    title: dealData.title,
                    customer_id: dealData.customer_id,
                    stage: dealData.stage,
                    priority: dealData.priority,
                    next_action_at: dealData.next_action_at,
                    note: dealData.note,
                    expected_value: dealData.expected_value,
                    source: dealData.source
                }, session?.access_token);
            } else {
                let customerId = dealData.customer_id;

                // Create new customer if needed
                if (dealData.isNewCustomer && dealData.newCustomerData) {
                    const newCustomer = await createCustomer({
                        ...dealData.newCustomerData,
                        owner_user_id: userInfo.id
                    }, session?.access_token);
                    // No need to check newCustomer is null here to alert, the function will throw.
                    if (newCustomer) {
                        customerId = newCustomer.id;
                    }
                }

                await createDeal({
                    title: dealData.title,
                    customer_id: customerId,
                    stage: dealData.stage,
                    priority: dealData.priority,
                    next_action_at: dealData.next_action_at,
                    note: dealData.note,
                    expected_value: dealData.expected_value,
                    source: dealData.source,
                    owner_user_id: userInfo.id
                }, session?.access_token);
            }

            await refreshData();
            setIsCreateModalOpen(false);
            setEditingDeal(null);
        } catch (error) {
            console.error("Failed to save deal", error);
            // Show specific error message
            alert("Lỗi: " + (error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại."));
        } finally {
            setIsDataLoading(false);
        }
    };

    const handleDeleteDeal = async (dealId: string) => {
        if (confirm("Bạn chắc chắn muốn xóa cơ hội này?")) {
            await deleteDeal(dealId);
            setIsCreateModalOpen(false);
            setEditingDeal(null);
            refreshData();
        }
    };

    // Lost Modal Handlers
    const handleOpenLostModal = (deal: CRMDeal) => {
        setDealToMarkLost(deal);
        setIsLostModalOpen(true);
    };

    const handleConfirmLost = async (reason: string) => {
        if (dealToMarkLost) {
            await updateDeal(dealToMarkLost.id, {
                status: 'lost',
                stage: 'done',  // Chuyển sang cột Hoàn tất
                lost_reason: reason
            }, session?.access_token);
            setIsLostModalOpen(false);
            setDealToMarkLost(null);
            await refreshData();
        }
    };

    // Stats Calculations
    const totalDeals = deals.length;
    const openDeals = deals.filter(d => d.status === 'open').length;
    const wonDeals = deals.filter(d => d.status === 'won').length;
    const lostDeals = deals.filter(d => d.status === 'lost').length;
    const conversionRate = totalDeals > 0 ? Math.round((wonDeals / (wonDeals + lostDeals || 1)) * 100) : 0;

    // Drag & Drop
    const handleDealDragStart = (e: React.DragEvent, id: string, colId: string) => {
        setDraggedDealId(id);
        e.dataTransfer.setData("crm/deal", id);
        e.dataTransfer.setData("crm/source-col", colId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDealDragEnd = () => {
        setDraggedDealId(null);
        setDropIndicator(null);
        setDragOverColId(null);
    };

    const handleDragOverColumn = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverColId(colId);
        if (e.currentTarget === e.target) setDropIndicator(null);
    };

    const handleDealDragOver = (e: React.DragEvent, targetDealId: string) => {
        if (!draggedDealId || draggedDealId === targetDealId) return;
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const y = e.clientY - rect.top;
        setDropIndicator({ dealId: targetDealId, position: y < rect.height / 2 ? 'top' : 'bottom' });
        setDragOverColId(null);
    };



    // Column management
    const handleAddColumn = () => {
        addColumn();
        setColumns(loadCRMColumns());
    };

    const deleteColumnHandler = (id: string, isDefault?: boolean) => {
        if (isDefault && (id === 'new_data' || id === 'done')) {
            alert("Không thể xóa cột mặc định này.");
            return;
        }
        if (!confirm("Bạn có chắc chắn muốn xóa cột này?")) return;
        deleteColumn(id);
        setColumns(loadCRMColumns());
    };

    const toggleColumnVisibility = (colId: string, currentVisible: boolean) => {
        updateColumn(colId, { isVisible: !currentVisible });
        setColumns(loadCRMColumns());
    };

    // Column Drag & Drop for reordering
    const handleColumnDragStart = (e: React.DragEvent, colId: string) => {
        setDraggedColumnId(colId);
        e.dataTransfer.setData("crm/column", colId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleColumnDragOver = (e: React.DragEvent, targetColId: string) => {
        if (!draggedColumnId || draggedColumnId === targetColId) return;
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        setDropColIndicator({ colId: targetColId, position: x < rect.width / 2 ? 'left' : 'right' });
    };

    const handleColumnDrop = (e: React.DragEvent, targetColId: string) => {
        e.preventDefault();
        const draggedColId = e.dataTransfer.getData("crm/column");

        if (draggedColId && draggedColId !== targetColId) {
            const draggedIndex = columns.findIndex(c => c.id === draggedColId);
            let targetIndex = columns.findIndex(c => c.id === targetColId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                const newColumns = [...columns];
                const [removed] = newColumns.splice(draggedIndex, 1);

                // Adjust target index if needed
                if (dropColIndicator?.position === 'right') {
                    targetIndex = targetIndex > draggedIndex ? targetIndex : targetIndex + 1;
                } else {
                    targetIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
                }

                newColumns.splice(targetIndex, 0, removed);

                // Save to localStorage using unified function
                saveCRMColumns(newColumns);
                setColumns(newColumns);
            }
        }

        setDraggedColumnId(null);
        setDropColIndicator(null);
    };

    const handleColumnDragEnd = () => {
        setDraggedColumnId(null);
        setDropColIndicator(null);
    };

    const startEditing = (col: CRMColumn) => {
        setEditingColumnId(col.id);
        setEditingTitle(col.label);
    };

    const saveEditing = (id: string) => {
        if (editingTitle?.trim()) {
            updateColumn(id, { label: editingTitle.trim() });
        }
        setEditingColumnId(null);
        setColumns(loadCRMColumns());
    };

    // Filtering and Sorting
    const filteredDeals = deals.filter(deal => {
        const matchesSearch = !debouncedSearchQuery ||
            deal.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            (deal.customer?.name && deal.customer.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
            (deal.customer?.phone && deal.customer.phone.includes(debouncedSearchQuery));

        const matchesPriority = filterPriority === "all" || deal.priority === filterPriority;

        // Always show deals in 'done' stage (won/lost), or match status filter
        const matchesStatus = filterStatus === "all" || deal.status === filterStatus || deal.stage === 'done';

        // Customer type filter
        const matchesCustomerType = filterCustomerType === "all" || deal.customer?.type === filterCustomerType;

        return matchesSearch && matchesPriority && matchesStatus && matchesCustomerType;
    }).sort((a, b) => {
        if (sortBy === "newest") {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortBy === "oldest") {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (sortBy === "due_date") {
            // Deals with due date first, then by date
            if (!a.next_action_at && !b.next_action_at) return 0;
            if (!a.next_action_at) return 1;
            if (!b.next_action_at) return -1;
            return new Date(a.next_action_at).getTime() - new Date(b.next_action_at).getTime();
        }
        return 0;
    });

    const visibleColumns = columns.filter(c => c.isVisible !== false);
    const msToday = new Date().setHours(0, 0, 0, 0);
    // Hydration fix: only calculate date dependent metrics on client
    const overdueCount = isMounted ? deals.filter(d => d.next_action_at && new Date(d.next_action_at).getTime() < msToday && d.status === 'open').length : 0;
    const todayCount = isMounted ? deals.filter(d => d.next_action_at && new Date(d.next_action_at).setHours(0, 0, 0, 0) === msToday && d.status === 'open').length : 0;

    // Prevent hydration mismatch by only rendering content on client
    if (!isMounted) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col relative" onClick={() => setIsSettingsOpen(false)}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-[60] relative">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        CRM - {isMounted && isAdminOrSaleAdmin ? 'Tất cả cơ hội' : 'Cơ hội của tôi'}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {isMounted && isAdminOrSaleAdmin ? 'Xem và quản lý cơ hội của toàn team' : 'Sales pipeline theo chuẩn Odoo'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openCreateModal()}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tạo cơ hội</span>
                    </button>

                    {/* Notification Bell */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsNotificationOpen(true); }}
                        className="relative p-2 bg-white border rounded-lg hover:bg-slate-50 text-slate-600"
                    >
                        <Bell className="w-4 h-4" />
                        {(overdueCount + todayCount) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {overdueCount + todayCount}
                            </span>
                        )}
                    </button>

                    {/* Settings - Only for Admin */}
                    {isMounted && isAdmin && (
                        <div className="relative z-[60]">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }}
                                className={`bg-white border p-2 rounded-lg hover:bg-slate-50 ${isSettingsOpen ? 'ring-2 ring-primary-100' : ''}`}
                            >
                                <Settings className="w-4 h-4" />
                            </button>

                            {isSettingsOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border p-2 z-[9999]" onClick={e => e.stopPropagation()}>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase px-2 py-1">Hiển thị cột</h4>
                                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                                        {columns.map(col => (
                                            <div key={col.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded text-sm">
                                                <span>{col.label}</span>
                                                <button onClick={() => toggleColumnVisibility(col.id, col.isVisible !== false)}>
                                                    {col.isVisible !== false ? <Eye className="w-4 h-4 text-primary-600" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t mt-2 pt-2">
                                        <button onClick={() => { handleAddColumn(); setIsSettingsOpen(false); }} className="w-full flex items-center justify-center gap-2 text-sm text-primary-600 hover:bg-primary-50 py-2 rounded">
                                            <Plus className="w-4 h-4" /> Thêm cột
                                        </button>
                                        <button onClick={() => { resetColumns(); setColumns(loadCRMColumns()); setIsSettingsOpen(false); }} className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:bg-slate-50 py-2 rounded">
                                            <RotateCcw className="w-4 h-4" /> Reset
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white border p-1 rounded-lg flex">
                        <button onClick={() => setViewMode("kanban")} className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-slate-100' : ''}`}>
                            <LayoutDashboard className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100' : ''}`}>
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-3 rounded-xl border shadow-sm">
                    <div className="text-2xl font-bold text-slate-900">{totalDeals}</div>
                    <div className="text-xs text-slate-500">Tổng cơ hội</div>
                </div>
                <div className="bg-white p-3 rounded-xl border shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{openDeals}</div>
                    <div className="text-xs text-slate-500">Đang mở</div>
                </div>
                <div className="bg-white p-3 rounded-xl border shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{wonDeals}</div>
                    <div className="text-xs text-slate-500">Thắng</div>
                </div>
                <div className="bg-white p-3 rounded-xl border shadow-sm">
                    <div className="text-2xl font-bold text-red-600">{lostDeals}</div>
                    <div className="text-xs text-slate-500">Thua</div>
                </div>
                <div className="bg-white p-3 rounded-xl border shadow-sm col-span-2 sm:col-span-1">
                    <div className="text-2xl font-bold text-purple-600">{conversionRate}%</div>
                    <div className="text-xs text-slate-500">Tỷ lệ thắng</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between sticky top-[60px] z-10">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên cơ hội, khách hàng, SĐT..."
                        className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
                        <option value="all">Tất cả trạng thái</option>
                        <option value="open">Đang mở</option>
                        <option value="won">Thắng</option>
                        <option value="lost">Thua</option>
                    </select>
                    <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
                        <option value="all">Tất cả ưu tiên</option>
                        <option value="low">Thấp</option>
                        <option value="normal">Bình thường</option>
                        <option value="high">Cao</option>
                        <option value="urgent">Khẩn</option>
                    </select>
                    <select value={filterCustomerType} onChange={(e) => setFilterCustomerType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                        <option value="all">Tất cả loại khách</option>
                        <option value="tap_hoa">Tạp hóa</option>
                        <option value="mini_mart">Mini mart</option>
                        <option value="dai_ly">Đại lý</option>
                        <option value="npp">NPP</option>
                        <option value="sieu_thi">Siêu thị</option>
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="due_date">Hạn nhắc việc</option>
                    </select>
                </div>
            </div>

            {/* Kanban View */}
            {viewMode === "kanban" && (
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-[100%] h-full items-start">
                        {visibleColumns.map(col => {
                            const columnDeals = filteredDeals.filter(d => d.stage === col.id);
                            const showAppendPlaceholder = draggedDealId && dragOverColId === col.id && !dropIndicator;
                            const isColDragging = draggedColumnId === col.id;
                            const showLeftIndicator = dropColIndicator?.colId === col.id && dropColIndicator.position === 'left';
                            const showRightIndicator = dropColIndicator?.colId === col.id && dropColIndicator.position === 'right';

                            return (
                                <div key={col.id} className="flex items-start">
                                    {/* Left drop indicator */}
                                    {showLeftIndicator && (
                                        <div className="w-1 h-full min-h-[200px] bg-primary-500 rounded animate-pulse mx-1" />
                                    )}
                                    <div
                                        draggable={isAdmin}
                                        onDragStart={(e) => isAdmin && handleColumnDragStart(e, col.id)}
                                        onDragOver={(e) => {
                                            handleDragOverColumn(e, col.id);
                                            if (isAdmin) handleColumnDragOver(e, col.id);
                                        }}
                                        onDragEnd={handleColumnDragEnd}
                                        onDrop={(e) => {
                                            handleColumnDrop(e, col.id);
                                            handleDrop(e, col.id);
                                        }}
                                        className={`flex-1 min-w-[280px] bg-slate-50/50 rounded-xl flex flex-col max-h-[calc(100vh-280px)] group/col border-2 transition-all ${dragOverColId === col.id ? 'border-primary-300 bg-primary-50/20' : 'border-transparent hover:border-slate-200'
                                            } ${isColDragging ? 'opacity-50 scale-95' : ''}`}
                                    >
                                        {/* Column Header */}
                                        <div className={`p-3 border-b bg-slate-50/95 rounded-t-xl sticky top-0 z-20 flex items-center justify-between ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                                            <div className="flex items-center gap-2 flex-1">
                                                {editingColumnId === col.id ? (
                                                    <input
                                                        ref={editInputRef}
                                                        className="text-sm font-semibold px-2 py-1 border rounded w-full"
                                                        value={editingTitle}
                                                        onChange={(e) => setEditingTitle(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') saveEditing(col.id); if (e.key === 'Escape') setEditingColumnId(null); }}
                                                        onBlur={() => saveEditing(col.id)}
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2" onDoubleClick={() => startEditing(col)}>
                                                        <h3 className="font-semibold text-slate-700 text-sm uppercase truncate">{col.label}</h3>
                                                        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{columnDeals.length}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Column actions - Only for Admin */}
                                            {isAdmin && (
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover/col:opacity-100">
                                                    <button onClick={() => startEditing(col)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-blue-600">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => deleteColumnHandler(col.id, col.isDefault)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-600">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => openCreateModal(col.id as DealStage)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 ml-1">
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            {/* Quick add button for non-admin */}
                                            {!isAdmin && (
                                                <button onClick={() => openCreateModal(col.id as DealStage)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 opacity-0 group-hover/col:opacity-100">
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Deals */}
                                        <div className="p-2 flex-1 overflow-y-auto min-h-[100px]">
                                            {columnDeals.length === 0 && !showAppendPlaceholder ? (
                                                <div className="text-center py-12 text-slate-400">
                                                    <div className="text-4xl mb-2">📋</div>
                                                    <p className="text-sm">Chưa có cơ hội</p>
                                                </div>
                                            ) : (
                                                columnDeals.map(deal => {
                                                    const isOverdue = !!(deal.next_action_at && new Date(deal.next_action_at).getTime() < msToday && deal.status === 'open');
                                                    return (
                                                        <DealCard
                                                            key={deal.id}
                                                            deal={deal}
                                                            isDragging={draggedDealId === deal.id}
                                                            onDragStart={handleDealDragStart}
                                                            onDragOver={handleDealDragOver}
                                                            onDragEnd={handleDealDragEnd}
                                                            dropIndicator={dropIndicator}
                                                            onEdit={handleEditDeal}
                                                            onViewDetails={handleViewDetails}
                                                            onCreateOrder={handleCreateOrder}
                                                            onMarkLost={handleOpenLostModal}
                                                            onRefresh={refreshData}
                                                            isOverdue={isOverdue}
                                                            isHighlighted={highlightedDealId === deal.id}
                                                        />
                                                    );
                                                })
                                            )}
                                            {showAppendPlaceholder && (
                                                <div className="h-24 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/50 animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                    {/* Right drop indicator */}
                                    {showRightIndicator && (
                                        <div className="w-1 h-full min-h-[200px] bg-primary-500 rounded animate-pulse mx-1" />
                                    )}
                                </div>
                            );
                        })}
                        {/* Add Column Button - Only for Admin */}
                        {isAdmin && (
                            <div className="min-w-[50px] flex items-start pt-2">
                                <button onClick={handleAddColumn} className="p-2 rounded-full hover:bg-slate-200 text-slate-400">
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
                <div className="flex-1 bg-white rounded-xl shadow-sm border p-4">
                    <div className="space-y-2">
                        {filteredDeals.map(deal => (
                            <div key={deal.id} className="flex justify-between items-center p-3 border rounded hover:bg-slate-50 cursor-pointer" onClick={() => handleEditDeal(deal)}>
                                <div className="flex items-center gap-3">
                                    <Building className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <div className="font-medium">{deal.customer?.name} - {deal.title}</div>
                                        <div className="text-sm text-slate-500">{deal.customer?.phone} • {DEAL_STAGE_LABELS[deal.stage]}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <PriorityBadge priority={deal.priority} />
                                    <span className={`px-2 py-0.5 rounded text-xs ${deal.status === 'won' ? 'bg-green-100 text-green-700' : deal.status === 'lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {deal.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            <CreateDealModal
                isOpen={isCreateModalOpen}
                initialData={editingDeal || undefined}
                initialStage={createModalInitialStage}
                onClose={() => { setIsCreateModalOpen(false); setEditingDeal(null); }}
                onSave={handleSaveDeal}
                onDelete={editingDeal ? () => handleDeleteDeal(editingDeal.id) : undefined}
                userId={userInfo.id || undefined}
            />

            {/* Notification Panel */}
            {isNotificationOpen && (
                <>
                    <div className="fixed inset-0 bg-black/20 z-[9990]" onClick={() => setIsNotificationOpen(false)} />
                    <div className="fixed top-0 right-0 h-full w-[320px] bg-white shadow-2xl z-[9999] flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2"><Bell className="w-4 h-4" /> Thông báo</h3>
                            <button onClick={() => setIsNotificationOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            <div className="text-sm font-medium text-slate-700">Quá hạn ({overdueCount})</div>
                            {deals.filter(d => d.next_action_at && new Date(d.next_action_at).getTime() < msToday && d.status === 'open').map(d => (
                                <div key={d.id} className="p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:shadow" onClick={() => { setIsNotificationOpen(false); setHighlightedDealId(d.id); setTimeout(() => setHighlightedDealId(null), 2000); }}>
                                    <div className="font-medium text-sm">{d.customer?.name}</div>
                                    <div className="text-xs text-red-600">{d.title}</div>
                                </div>
                            ))}
                            <div className="text-sm font-medium text-slate-700 mt-4">Hôm nay ({todayCount})</div>
                            {deals.filter(d => d.next_action_at && new Date(d.next_action_at).setHours(0, 0, 0, 0) === msToday && d.status === 'open').map(d => (
                                <div key={d.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:shadow" onClick={() => { setIsNotificationOpen(false); setHighlightedDealId(d.id); setTimeout(() => setHighlightedDealId(null), 2000); }}>
                                    <div className="font-medium text-sm">{d.customer?.name}</div>
                                    <div className="text-xs text-blue-600">{d.title}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {isDataLoading && (
                <div className="absolute inset-0 bg-white/50 z-[100] flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                </div>
            )}

            {/* DEBUG CONSOLE (Temporary) */}
            <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg z-[99999] max-w-md max-h-[300px] overflow-auto font-mono text-xs shadow-xl border border-white/20">
                <div className="flex justify-between items-center mb-2 border-b border-white/20 pb-1">
                    <span className="font-bold text-yellow-400">DEBUG CONSOLE</span>
                    <button onClick={() => setDebugLogs([])} className="text-gray-400 hover:text-white">Clear</button>
                </div>
                {debugLogs.length === 0 ? <div className="text-gray-500 italic">Waiting for actions...</div> : (
                    debugLogs.map((log, i) => (
                        <div key={i} className={`mb-1 border-b border-white/10 pb-1 ${log.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                            <span className="text-gray-500">[{log.time}]</span> {log.msg}
                        </div>
                    ))
                )}
            </div>
            {/* Lost Reason Modal */}
            <LostReasonModal
                isOpen={isLostModalOpen}
                onClose={() => { setIsLostModalOpen(false); setDealToMarkLost(null); }}
                onConfirm={handleConfirmLost}
                dealTitle={dealToMarkLost?.title}
            />
        </div>
    );
}
