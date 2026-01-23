"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    XCircle,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";
import { useDebounce } from "use-debounce";
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
    fetchCRMColumnsFromDB,
    saveCRMColumnsToDB,
    CRMColumn,
    DEFAULT_CRM_COLUMNS,
    canEditDeal,
    canDeleteDeal,
    fetchPaginatedDeals,
    getDealStageCounts
} from "@/lib/crmDealsStore";
import { CreateDealModal } from "@/components/telesales/CreateDealModal";
import { LostReasonModal } from "@/components/telesales/LostReasonModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton, KanbanSkeleton, TableSkeleton } from "@/components/ui/SkeletonUI";

// --- Local Column Management Functions ---
// --- Local Column Management Functions ---
// Now wrapped to use DB sync if possible
const addColumn = async () => {
    // 1. Local update first
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

    // 2. Save both local and DB
    saveCRMColumns(newCols); // Immediate local UI update
    await saveCRMColumnsToDB(newCols); // Sync to server

    return newCols;
};

const deleteColumn = async (id: string) => {
    const cols = loadCRMColumns().filter(c => c.id !== id);
    saveCRMColumns(cols);
    await saveCRMColumnsToDB(cols);
    return cols;
};

const updateColumn = async (id: string, patch: Partial<CRMColumn>) => {
    const cols = loadCRMColumns().map(c => c.id === id ? { ...c, ...patch } : c);
    saveCRMColumns(cols);
    await saveCRMColumnsToDB(cols);
    return cols;
};

const resetColumns = async () => {
    saveCRMColumns(DEFAULT_CRM_COLUMNS);
    await saveCRMColumnsToDB(DEFAULT_CRM_COLUMNS);
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
    // Combine old snake_case and new UPPERCASE keys
    const colors: Record<string, string> = {
        tap_hoa: "bg-green-100 text-green-700",
        RETAIL: "bg-green-100 text-green-700",
        mini_mart: "bg-purple-100 text-purple-700",
        dai_ly: "bg-blue-100 text-blue-700",
        AGENCY: "bg-blue-100 text-blue-700",
        npp: "bg-orange-100 text-orange-700",
        DISTRIBUTOR: "bg-orange-100 text-orange-700",
        sieu_thi: "bg-pink-100 text-pink-700",
        CTV: "bg-indigo-100 text-indigo-700",
    };
    const labels: Record<string, string> = {
        tap_hoa: "Tạp hóa",
        RETAIL: "Khách lẻ",
        mini_mart: "Mini mart",
        dai_ly: "Đại lý",
        AGENCY: "Đại lý",
        npp: "NPP",
        DISTRIBUTOR: "NPP",
        sieu_thi: "Siêu thị",
        CTV: "CTV",
    };
    const key = type || 'tap_hoa';
    return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[key] || colors.tap_hoa}`}>
            {labels[key] || key}
        </span>
    );
};

const PotentialBadge = ({ level }: { level?: string }) => {
    if (!level) return null;
    const colors: Record<string, string> = {
        HOT: "bg-red-500 text-white",
        WARM: "bg-yellow-400 text-white",
        COLD: "bg-blue-300 text-white",
    };
    const icons: Record<string, string> = {
        HOT: "🔥",
        WARM: "⭐️",
        COLD: "❄️",
    };
    return (
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${colors[level] || 'bg-slate-200'} flex items-center gap-1`}>
            <span>{icons[level]}</span>
            <span>{level}</span>
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
    onMarkWon: (deal: CRMDeal) => void;
    onMarkLost: (deal: CRMDeal) => void;
    onRefresh: () => Promise<void>;
    isOverdue?: boolean;
    isHighlighted?: boolean;
}

const DealCard = ({ deal, isDragging, onDragStart, onDragOver, onDragEnd, dropIndicator, onEdit, onViewDetails, onCreateOrder, onMarkWon, onMarkLost, onRefresh, isOverdue, isHighlighted }: DealCardProps) => {
    const { session } = useAuth();

    const handleMarkWon = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMarkWon(deal);
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

                {/* Badges Row */}
                {(deal.potential_level || deal.source_category) && (
                    <div className="flex gap-1 mb-2">
                        <PotentialBadge level={deal.potential_level} />
                        {deal.source_category && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 border border-slate-200">
                                {deal.source_category === 'SELF_FOUND' ? 'Tự tìm' : 'Cty cấp'}
                            </span>
                        )}
                    </div>
                )}

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
                    <div className="flex items-center gap-2">
                        {/* Owner Avatar */}
                        {deal.owner && (
                            <div className="flex items-center gap-1 group/owner relative cursor-help" title={`Phụ trách: ${deal.owner.full_name}`}>
                                {deal.owner.avatar_url ? (
                                    <img src={deal.owner.avatar_url} alt={deal.owner.full_name} className="w-5 h-5 rounded-full object-cover border border-white shadow-sm" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[9px] border border-white shadow-sm">
                                        {deal.owner.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        )}

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


// --- Main Page ---

import CRMBanner from "@/components/crm/CRMBanner";

export default function CRMPage() {
    const { user, session, role: authRole, isLoading: authIsLoading } = useAuth();
    const router = useRouter();
    const [deals, setDeals] = useState<CRMDeal[]>([]);
    const [columns, setColumns] = useState<CRMColumn[]>([]);
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false); // For hydration fix

    // ... (rest of the state hooks)

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery] = useDebounce(searchQuery, 150);
    const [filterPriority, setFilterPriority] = useState<DealPriority | "all">("all");
    const [filterStatus, setFilterStatus] = useState<"all" | "open" | "won" | "lost">("open");
    const [filterCustomerType, setFilterCustomerType] = useState<string>("all");
    const [filterUserId, setFilterUserId] = useState<string>("all");
    const [userOptions, setUserOptions] = useState<{ id: string, full_name: string }[]>([]);
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "due_date">("newest");

    // Pagination & Stage Filter
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(15); // Smaller page size for columns
    const [totalCount, setTotalCount] = useState(0);
    const [stageFilter, setStageFilter] = useState<DealStage | 'all'>('all');

    // Per-column Load More States
    const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
    const [overdueCountServer, setOverdueCountServer] = useState(0);
    const [todayCountServer, setTodayCountServer] = useState(0);

    const [stagePages, setStagePages] = useState<Record<string, number>>({});
    const [stageHasMore, setStageHasMore] = useState<Record<string, boolean>>({});
    const [loadingStages, setLoadingStages] = useState<Record<string, boolean>>({});

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
        // ...
    };

    // --- Deep Linking Logic ---
    const searchParams = useSearchParams(); // Should be imported

    useEffect(() => {
        const dealIdFromUrl = searchParams.get('dealId');
        if (dealIdFromUrl && !isDataLoading) {
            // Find deal in populated columns
            // Data structure: deals array
            const dealExists = deals.find(d => d.id === dealIdFromUrl);

            if (dealExists) {
                setTimeout(() => {
                    const el = document.getElementById(`deal-${dealIdFromUrl}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setHighlightedDealId(dealIdFromUrl);
                        // Clear highlight after 3s
                        setTimeout(() => setHighlightedDealId(null), 3000);
                    }
                }, 1000);
            }
        }
    }, [searchParams, isDataLoading, deals]);

    const getUserInfo = useCallback((): { id: string | null; role: string } => {

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

    const getUserInfo = useCallback((): { id: string | null; role: string } => {
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
    }, [user?.id, authRole]);

    // Get user info from auth or localStorage
    const userInfo = useMemo(() => getUserInfo(), [getUserInfo]);

    // Check if user is Admin or Sale Admin (can see all deals)
    const isAdminOrSaleAdmin = useMemo(() => userInfo.role === 'admin' || userInfo.role === 'sale_admin', [userInfo.role]);

    // Only Admin can customize columns
    const isAdmin = useMemo(() => userInfo.role === 'admin', [userInfo.role]);

    const refreshCounts = useCallback(async () => {
        if (!userInfo.id) return;
        try {
            const telemetry = await getDealStageCounts(isAdminOrSaleAdmin ? undefined : userInfo.id, session?.access_token);
            setStageCounts(telemetry.stages);
            setOverdueCountServer(telemetry.overdue);
            setTodayCountServer(telemetry.today);

            // Calculate total count from per-stage counts
            const total = Object.values(telemetry.stages).reduce((a, b) => a + (b || 0), 0);
            setTotalCount(total);
        } catch (err) {
            console.error('[CRM Debug] Error refreshing counts:', err);
        }
    }, [userInfo.id, isAdminOrSaleAdmin, session?.access_token]);

    // Fetch users for filter (Admin only)
    useEffect(() => {
        if (isAdminOrSaleAdmin && isMounted) {
            const fetchUsers = async () => {
                const { data } = await supabase.from('profiles').select('id, full_name').order('full_name');
                if (data) setUserOptions(data);
            };
            fetchUsers();
        }
    }, [isAdminOrSaleAdmin, isMounted]);

    const loadDealsForStage = useCallback(async (stage: DealStage, pageNum: number = 1, append: boolean = false) => {
        if (!userInfo.id) return;

        setLoadingStages(prev => ({ ...prev, [stage]: true }));
        try {
            const { data, count } = await fetchPaginatedDeals(
                pageNum,
                pageSize,
                stage,
                debouncedSearchQuery,
                isAdminOrSaleAdmin ? (filterUserId === 'all' ? undefined : filterUserId) : userInfo.id,
                session?.access_token
            );

            setDeals(prev => {
                if (append) {
                    // Filter out any duplicates just in case
                    const existingIds = new Set(prev.map(d => d.id));
                    const newDeals = data.filter(d => !existingIds.has(d.id));
                    return [...prev, ...newDeals];
                } else {
                    // Replace all deals for this stage in the flat array
                    const otherDeals = prev.filter(d => d.stage !== stage);
                    return [...otherDeals, ...data];
                }
            });

            setStagePages(prev => ({ ...prev, [stage]: pageNum }));
            setStageHasMore(prev => ({ ...prev, [stage]: (pageNum * pageSize) < count }));
        } catch (err) {
            console.error(`[CRM Debug] Error loading stage ${stage}:`, err);
        } finally {
            setLoadingStages(prev => ({ ...prev, [stage]: false }));
        }
    }, [userInfo.id, isAdminOrSaleAdmin, session?.access_token, pageSize, debouncedSearchQuery, filterUserId]);

    const refreshData = useCallback(async (isManual = false) => {
        if (!userInfo.id) return;

        console.log('[CRM Debug] refreshData (Kanban Optimized) START');
        if (isManual || deals.length === 0) setIsDataLoading(true);

        try {
            // 1. Get counts first
            await refreshCounts();

            // 2. Load data
            if (viewMode === 'list' || debouncedSearchQuery) {
                const { data, count } = await fetchPaginatedDeals(
                    currentPage,
                    25,
                    stageFilter,
                    debouncedSearchQuery,
                    isAdminOrSaleAdmin ? (filterUserId === 'all' ? undefined : filterUserId) : userInfo.id,
                    session?.access_token
                );
                setDeals(data);
                setTotalCount(count);
            } else {
                const visibleCols = loadCRMColumns().filter(c => c.isVisible !== false);
                setDeals([]);
                await Promise.all(visibleCols.map(col => loadDealsForStage(col.stage, 1)));
            }
        } catch (err) {
            console.error('[CRM Debug] refreshData error:', err);
        } finally {
            setIsDataLoading(false);
        }
        // Removed refreshCounts and loadDealsForStage from deps as they depend on the same things 
        // as this function, and we want to avoid unnecessary recreations of this callback.
        // We use them inside, so we'll just keep the primary data deps.
        // We use them inside, so we'll just keep the primary data deps.
    }, [userInfo.id, isAdminOrSaleAdmin, session?.access_token, currentPage, stageFilter, debouncedSearchQuery, viewMode, filterUserId]);

    // Realtime Subscription
    useEffect(() => {
        if (!userInfo.id || !isMounted) return;

        console.log('[CRM Realtime] Initializing subscription for user:', userInfo.id);
        let refreshTimeout: NodeJS.Timeout;

        // Channel for Deals
        const dealsChannel = supabase
            .channel(`crm-realtime-${userInfo.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'crm_deals'
                },
                (payload: any) => {
                    console.log('[CRM Realtime] Change detected:', payload.eventType);
                    // Debounce refresh
                    clearTimeout(refreshTimeout);
                    refreshTimeout = setTimeout(() => {
                        refreshData();
                    }, 1000); // 1s debounce for stability
                }
            )
            .subscribe((status: string) => {
                console.log('[CRM Realtime] Status:', status);
            });

        // Channel for Column Config (Shared)
        const settingsChannel = supabase
            .channel(`crm-settings-realtime`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'app_settings',
                },
                async (payload: any) => {
                    // Check if crm_columns changed
                    if (payload.new && payload.new.crm_columns) {
                        console.log('[CRM Realtime] Columns updated via Realtime!');
                        const newCols = payload.new.crm_columns as CRMColumn[];
                        // Save to local
                        saveCRMColumns(newCols);
                        // Update state
                        setColumns(newCols); // This will trigger re-render
                    }
                }
            )
            .subscribe();

        return () => {
            console.log('[CRM Realtime] Cleanup channel');
            clearTimeout(refreshTimeout);
            supabase.removeChannel(dealsChannel);
            supabase.removeChannel(settingsChannel);
        };
    }, [userInfo.id, refreshData, isMounted]);

    useEffect(() => {
        // Always set default columns first to ensure UI shows something
        setColumns(DEFAULT_CRM_COLUMNS.sort((a, b) => a.order - b.order));

        // Wait for auth to finish loading before fetching data
        if (authIsLoading) {
            console.log('[CRM Effect] Auth loading, skipping refresh');
            return;
        }

        if (user?.id) {
            console.log('[CRM Effect] Calling refreshData...');
            refreshData();

            // Also fetch columns from DB
            fetchCRMColumnsFromDB(session?.access_token).then(cols => {
                if (cols && cols.length > 0) setColumns(cols);
            });
        } else if (!authIsLoading) {
            // Stop spinner if auth finished but no user found
            setIsDataLoading(false);
        }
        const handleColumnUpdate = () => {
            setColumns(loadCRMColumns().sort((a, b) => a.order - b.order));
        };
        window.addEventListener("crm-columns-updated", handleColumnUpdate);
        return () => window.removeEventListener("crm-columns-updated", handleColumnUpdate);
    }, [user, authRole, authIsLoading, refreshData]);

    // Reset page on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, stageFilter, filterUserId]);

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
                    source: dealData.source,
                    source_category: dealData.source_category,
                    source_detail: dealData.source_detail,
                    potential_level: dealData.potential_level,
                    customer_type: dealData.customer_type
                }, session?.access_token);
            } else {
                let customerId = dealData.customer_id;

                // Create new customer if needed
                if (dealData.isNewCustomer && dealData.newCustomerData) {
                    const newCustomer = await createCustomer({
                        ...dealData.newCustomerData,
                        owner_user_id: userInfo.id
                    }, session?.access_token);

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
                    source_category: dealData.source_category,
                    source_detail: dealData.source_detail,
                    potential_level: dealData.potential_level,
                    owner_user_id: userInfo.id
                }, session?.access_token);
            }

            await refreshData();
            setIsCreateModalOpen(false);
            setEditingDeal(null);
        } catch (error) {
            console.error("Failed to save deal", error);
            alert("Lỗi: " + (error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại."));
        } finally {
            setIsDataLoading(false);
        }
    };

    const handleDeleteDeal = async (dealId: string) => {
        if (confirm("Bạn chắc chắn muốn xóa cơ hội này?")) {
            await deleteDeal(dealId, session?.access_token);
            setIsCreateModalOpen(false);
            setEditingDeal(null);
            refreshData();
        }
    };

    const handleMarkWon = async (deal: CRMDeal) => {
        const originalDeals = [...deals];
        const dealId = deal.id;

        // 🚀 Optimistic update
        setDeals(prev => prev.map(d =>
            d.id === dealId ? { ...d, status: 'won', stage: 'done' } : d
        ));
        logDebug(`Optimistically marked deal ${deal.title} as WON.`);

        const success = await updateDeal(dealId, {
            status: 'won',
            stage: 'done'
        }, session?.access_token);

        if (!success) {
            logDebug(`FAILED to mark deal as WON. Reverting...`, 'error');
            setDeals(originalDeals);
            alert("Lỗi: Không thể cập nhật trạng thái Thắng.");
        } else {
            logDebug(`SUCCESS marked deal as WON.`, 'info');
        }
    };

    // Lost Modal Handlers
    const handleOpenLostModal = (deal: CRMDeal) => {
        setDealToMarkLost(deal);
        setIsLostModalOpen(true);
    };

    const handleConfirmLost = async (reason: string) => {
        if (dealToMarkLost) {
            const originalDeals = [...deals];
            const dealId = dealToMarkLost.id;

            // 🚀 Optimistic update
            setDeals(prev => prev.map(d =>
                d.id === dealId ? { ...d, status: 'lost', stage: 'done', lost_reason: reason } : d
            ));
            setIsLostModalOpen(false);
            setDealToMarkLost(null);
            logDebug(`Optimistically marked deal ${dealToMarkLost.title} as LOST.`);

            const success = await updateDeal(dealId, {
                status: 'lost',
                stage: 'done',
                lost_reason: reason
            }, session?.access_token);

            if (!success) {
                logDebug(`FAILED to mark deal as LOST. Reverting...`, 'error');
                setDeals(originalDeals);
                alert("Lỗi: Không thể cập nhật trạng thái Thua.");
            } else {
                logDebug(`SUCCESS marked deal as LOST.`, 'info');
            }
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
    const handleAddColumn = async () => {
        await addColumn();
        // setColumnsUpdated triggered by saveCRMColumns -> window event
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
    // Use server counts for badges
    const overdueCount = overdueCountServer;
    const todayCount = todayCountServer;

    // Optimized loading: If we have counts, show the UI even if deals are still loading
    const showGlobalLoading = isDataLoading && Object.keys(stageCounts).length === 0 && deals.length === 0;

    if (showGlobalLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                {viewMode === "kanban" ? <KanbanSkeleton /> : <TableSkeleton rows={8} cols={6} />}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col relative" onClick={() => setIsSettingsOpen(false)}>
            <CRMBanner />
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

                <div className="flex gap-3 flex-wrap">
                    <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm bg-primary-50 text-primary-700 font-medium border-primary-100">
                        <option value="all">Tất cả giai đoạn</option>
                        {Object.entries(DEAL_STAGE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>

                    {isAdminOrSaleAdmin && (
                        <select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm max-w-[150px]">
                            <option value="all">Tất cả nhân viên</option>
                            {userOptions.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name || 'Unnamed'}</option>
                            ))}
                        </select>
                    )}

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
                                                        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                                                            {stageCounts[col.id] || 0}
                                                        </span>
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
                                            {loadingStages[col.id] && columnDeals.length === 0 ? (
                                                <div className="space-y-3 p-1">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="bg-slate-100/50 h-24 rounded-lg animate-pulse border border-slate-100" />
                                                    ))}
                                                </div>
                                            ) : columnDeals.length === 0 && !showAppendPlaceholder ? (
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
                                                            onMarkWon={handleMarkWon}
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

                                            {/* Load More Button for Column */}
                                            {stageHasMore[col.stage] && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        loadDealsForStage(col.stage as DealStage, (stagePages[col.stage] || 1) + 1, true);
                                                    }}
                                                    disabled={loadingStages[col.stage]}
                                                    className="w-full py-2 mt-2 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg border border-dashed border-primary-200 transition-colors disabled:opacity-50"
                                                >
                                                    {loadingStages[col.stage] ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            <span>Đang tải...</span>
                                                        </div>
                                                    ) : (
                                                        "Xem thêm..."
                                                    )}
                                                </button>
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

            {/* Pagination Controls */}
            {!isDataLoading && totalCount > pageSize && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border shadow-sm mt-4">
                    <div className="text-sm text-slate-500">
                        Hiển thị <span className="font-medium">{deals.length}</span> cơ hội
                        (Tổng <span className="font-medium">{totalCount}</span>)
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }}
                            disabled={currentPage === 1}
                            className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium">Trang {currentPage} / {Math.ceil(totalCount / pageSize)}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}
                            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                            className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
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
