"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient, supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider"; // ADDED // ADDED: For addLogSupabase

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    LayoutDashboard,
    List,
    Search,
    Plus,
    Calendar,
    User,
    Phone,
    CheckCircle2,
    Clock,
    Trash2,
    Edit2,
    Settings,
    Eye,
    EyeOff,
    Filter,
    RotateCcw,
    Bell,
    AlertTriangle,
    Loader2
} from "lucide-react";
import {
    TelesalesTask,
    TaskStatus,
    TaskPriority,
    TaskType,
    TASK_PRIORITY_LABELS,
    updateTaskSupabase,
    createTaskSupabase,
    deleteTaskSupabase,
    TelesalesColumn,
    fetchPaginatedTasks,
    updateTasksOrderSupabase,
    // New DB Column System
    DbColumn,
    fetchUserColumns,
    createUserColumn,
    updateUserColumn,
    deleteUserColumn,
    reorderUserColumns,
    fetchColumnTasks,
    moveTaskToColumn,
    createTaskPlacements,
    isDateColumn,
    isPlacementColumn
} from "@/lib/telesalesTasksStore";

// --- Helper: Convert DbColumn to TelesalesColumn for UI compatibility ---
function dbColToUiCol(col: DbColumn): TelesalesColumn {
    return {
        id: col.id,
        label: col.label,
        status: col.column_type === 'system_inbox' ? 'inbox' as TaskStatus
            : col.column_type === 'system_done' ? 'done' as TaskStatus
                : col.id as any,
        order: col.position,
        isDefault: col.column_type !== 'custom',
        isVisible: col.is_visible,
        // Store column_type for the new system
        ...(({ column_type: col.column_type }) as any)
    };
}

// FIXED: Re-enabled log functionality with Pure Fetch
const addLogSupabase = async (taskId: string, logData: any) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
        const { data } = await createClient().auth.getSession();
        const session = data?.session;
        const user = session?.user;

        if (!user) {
            console.error('[addLogSupabase] User not authenticated or timeout');
            return [];
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/telesales_task_logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey || '',
                'Authorization': `Bearer ${session?.access_token || supabaseKey}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                task_id: taskId,
                user_id: user.id,
                log: typeof logData === 'string' ? logData : JSON.stringify(logData),
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[addLogSupabase] Error:', response.status, errorText);
            return [];
        }

        return await response.json();
    } catch (err) {
        console.error('[addLogSupabase] Exception:', err);
        return [];
    }
};

import { CreateTaskModal } from "@/components/telesales/CreateTaskModal";
import { LogCallModal } from "@/components/telesales/LogCallModal";
import { TaskSimpleModal } from "@/components/telesales/TaskSimpleModal";
import { CreateLeadModal } from "@/components/telesales/CreateLeadModal";
import { FileText, Link as LinkIcon, Image as ImageIcon, CheckCircle, ChevronDown, MoreHorizontal, UserPlus, Paperclip, CheckSquare } from "lucide-react";

// --- Components ---

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
    const colors = {
        low: "bg-slate-100 text-slate-700",
        normal: "bg-blue-100 text-blue-700",
        high: "bg-orange-100 text-orange-700",
        urgent: "bg-red-100 text-red-700",
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || colors.normal}`}>
            {TASK_PRIORITY_LABELS[priority]}
        </span>
    );
};

interface Profile {
    id: string;
    full_name: string;
    email: string;
}

const Star = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

interface TaskCardProps {
    task: TelesalesTask;
    isDragging: boolean;
    onDragStart: (e: React.DragEvent, id: string, colId: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    dropIndicator: { taskId: string; position: 'top' | 'bottom' } | null;
    onLogCall: (task: TelesalesTask) => void;
    onEdit: (task: TelesalesTask) => void;
    onToggleStatus: (task: TelesalesTask) => void;
    onRefresh: () => Promise<void>;
    isOverdue?: boolean;
    isHighlighted?: boolean;
    profiles?: Profile[];
    onHandledToday?: (task: TelesalesTask) => void;
}

const TaskCard = ({ task, isDragging, onDragStart, onDragOver, dropIndicator, onLogCall, onEdit, onToggleStatus, onRefresh, isOverdue, isHighlighted, profiles = [], onHandledToday }: TaskCardProps) => {
    // Toggle Complete Handler - Option A: Direct Refresh
    const handleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleStatus(task);
    };

    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isHandledToday = task.handled_date === localDate;

    return (
        <>
            {/* Ghost Placeholder Top */}
            {dropIndicator?.taskId === task.id && dropIndicator.position === 'top' && (
                <div className="mb-3 h-24 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/50 animate-pulse pointer-events-none" />
            )}

            <div
                id={`task-${task.id}`}
                draggable
                onClick={() => onEdit(task)} // Trigger Edit
                onDragStart={(e) => {
                    e.stopPropagation();
                    onDragStart(e, task.id, task.status);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDragOver(e, task.id);
                }}
                className={`relative bg-white p-3 rounded-lg shadow-sm border cursor-move transition-all mb-3 group/card 
                ${isDragging ? 'opacity-50 scale-95 ring-2 ring-primary-200 rotate-1 border-primary-200' :
                        isHighlighted
                            ? 'border-yellow-400 ring-2 ring-yellow-400 shadow-md scale-[1.02] z-10'
                            : task.status === 'done'
                                ? 'border-primary-200 bg-primary-50/20 opacity-75'
                                : isOverdue
                                    ? 'border-red-300 ring-1 ring-red-100 hover:shadow-md'
                                    : 'border-slate-200 hover:shadow-md hover:border-primary-200'
                    }
                ${isDragging ? '' : 'active:cursor-grabbing'}
            `}
            >
                <div className="mb-2 flex items-center justify-between">
                    {task.title.startsWith('📋 PV:') ? (
                        <span className="inline-block px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium border border-primary-200">
                            📋 Phỏng vấn
                        </span>
                    ) : (
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200">
                            Công việc
                        </span>
                    )}
                    {isHandledToday && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-100">
                            <CheckSquare className="w-2.5 h-2.5" />
                            Đã xử lý hôm nay
                        </span>
                    )}
                </div>

                {/* Header: Title + Prio */}
                <div className="flex justify-between items-start mb-2 pointer-events-none">
                    <h4 className="font-medium text-slate-900 text-sm line-clamp-2 leading-snug">{task.title}</h4>
                    <PriorityBadge priority={task.priority} />
                </div>

                {/* Adaptive Content - Phase B: Show phone if exists, else note snippet */}
                {task.phone ? (
                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-2 pointer-events-auto">
                        <Phone className="w-3 h-3 flex-shrink-0 text-slate-400" />
                        <span className="font-medium">{task.phone}</span>
                        {task.customer_name && (
                            <span className="text-slate-400">• {task.customer_name}</span>
                        )}
                    </div>
                ) : task.note ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 italic">
                        <FileText className="w-3 h-3 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{task.note}</span>
                    </div>
                ) : task.customer_name ? (
                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                        <User className="w-3 h-3 flex-shrink-0 text-slate-400" />
                        <span className="font-medium">{task.customer_name}</span>
                    </div>
                ) : null}

                {/* Assignees and Leader - NEW */}
                {task.assignee_ids && task.assignee_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-slate-50">
                        {task.assignee_ids.map(id => {
                            const p = profiles.find(prof => prof.id === id);
                            const isLeader = id === task.leader_id;
                            const name = p?.full_name?.split(' ').pop() || p?.email?.split('@')[0] || '...';

                            return (
                                <div
                                    key={id}
                                    title={p?.full_name || p?.email || id}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border transition-colors 
                                        ${isLeader
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm'
                                            : 'bg-slate-50 border-slate-100 text-slate-500'
                                        }`}
                                >
                                    {isLeader ? (
                                        <Star className="w-2.5 h-2.5 fill-blue-500 text-blue-500" />
                                    ) : (
                                        <User className="w-2.5 h-2.5 opacity-60" />
                                    )}
                                    <span>{name}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Attachments Indicator - DISABLED */}
                {/* {task.attachments && task.attachments.length > 0 && (
                    <div className="flex gap-2 mb-2">
                        {task.attachments.map((att, i) => (
                            <div key={i} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1 text-slate-500 truncate max-w-[100px]">
                                {att.type === 'link' ? <LinkIcon className="w-2.5 h-2.5" /> : <Paperclip className="w-2.5 h-2.5" />}
                                <span className="truncate">{att.name}</span>
                            </div>
                        ))}
                    </div>
                )} */}

                {/* Footer & Quick Actions */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400 pointer-events-auto">
                    {/* Due Date */}
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                        {task.due_date ? (
                            <>
                                {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                <span>{new Date(task.due_date).toLocaleDateString('vi-VN')}</span>
                            </>
                        ) : (
                            <span className="text-slate-400 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Chưa đặt hạn</span>
                        )}
                    </div>

                    {/* Quick Actions Row */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                            title="Chỉnh sửa / Ghi chú"
                        >
                            <FileText className="w-3.5 h-3.5" />
                        </button>
                        {!task.due_date && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1 bg-slate-50 border border-slate-200"
                                title="Đặt ngày"
                            >
                                <Calendar className="w-3 h-3" />
                                <span className="text-[10px]">Đặt ngày</span>
                            </button>
                        )}
                        {task.phone && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onLogCall(task); }}
                                className="p-1 hover:bg-primary-100 rounded text-slate-400 hover:text-primary-600 transition-colors"
                                title="Gọi ngay"
                            >
                                <Phone className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {onHandledToday && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onHandledToday(task); }}
                                className={`p-1 rounded transition-colors ${isHandledToday ? 'text-green-600 bg-green-100 hover:bg-green-200' : 'text-slate-400 hover:bg-green-50 hover:text-green-600'}`}
                                title="Đã xử lý hôm nay"
                            >
                                <CheckSquare className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Complete Toggle - LYHU Minimalist */}
                        <button
                            onClick={handleComplete}
                            className={`p-1 rounded transition-colors ${task.status === 'done'
                                ? 'bg-primary-500 text-white hover:bg-primary-600'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-primary-600'
                                }`}
                            title={task.status === 'done' ? 'Bỏ hoàn thành' : 'Đánh dấu hoàn thành'}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Ghost Placeholder Bottom */}
            {dropIndicator?.taskId === task.id && dropIndicator.position === 'bottom' && (
                <div className="mb-3 h-24 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/50 animate-pulse pointer-events-none" />
            )}
        </>
    );
};

// Optimization #1: Memoize TaskCard to reduce re-renders
const MemoizedTaskCard = React.memo(TaskCard);

// --- Use Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

// --- Main Page ---

export default function TelesalesTasksPage() {
    const { user, session, isLoading: authIsLoading } = useAuth();
    // Force re-deploy
    const searchParams = useSearchParams(); // Added here

    // --- Deep Linking Logic ---
    // (Moved from bottom)
    // We need columnTasks and isLoading available, which are defined below.
    // Wait, hooks order matters but variable access inside useEffect depends on scope.
    // columnTasks is defined below.
    // I should place this useEffect AFTER state definitions.

    // I will insert searchParams here first.


    // Per-column states
    const [columnTasks, setColumnTasks] = useState<Record<string, TelesalesTask[]>>({});
    const [columnPages, setColumnPages] = useState<Record<string, number>>({});
    const [columnHasMore, setColumnHasMore] = useState<Record<string, boolean>>({});
    const [loadingColumns, setLoadingColumns] = useState<Record<string, boolean>>({});
    const [totalCounts, setTotalCounts] = useState<Record<string, number>>({});

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [columns, setColumns] = useState<(TelesalesColumn & { column_type?: string })[]>([]);
    const [dbColumns, setDbColumns] = useState<DbColumn[]>([]);
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [isLoading, setIsLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 150); // Optimization #2: Reduced from 300ms
    const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
    const [filterDueDate, setFilterDueDate] = useState<"all" | "overdue" | "today" | "week">("all"); // Phase B
    const [filterCustomerType, setFilterCustomerType] = useState<"all" | "customer" | "personal">("all"); // Phase B
    const [filterType, setFilterType] = useState<TaskType | "all">("all");

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // Legacy full modal
    const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false); // New Simple Modal
    const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false); // New Lead Modal

    const [createModalInitialStatus, setCreateModalInitialStatus] = useState<TaskStatus>("inbox");
    const [createFromColumnId, setCreateFromColumnId] = useState<string | null>(null); // Track which column's "+" was clicked
    const savingRef = useRef(false); // Prevent Realtime duplication during save
    const [editingTask, setEditingTask] = useState<TelesalesTask | null>(null); // New state for editing
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Log Modal State
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [taskToLog, setTaskToLog] = useState<TelesalesTask | null>(null);

    // Inline editing states
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const editInputRef = useRef<HTMLInputElement>(null);

    // DnD States
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ taskId: string; position: 'top' | 'bottom' } | null>(null);
    const [dragOverColId, setDragOverColId] = useState<string | null>(null);

    // Notification States
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [activeNotifTab, setActiveNotifTab] = useState<'overdue' | 'today'>('overdue');
    const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

    const msToday = new Date().setHours(0, 0, 0, 0);

    // --- Deep Linking Logic ---
    useEffect(() => {
        const taskIdFromUrl = searchParams.get('taskId');
        console.log("DeepLink Debug: URL taskId:", taskIdFromUrl);
        console.log("DeepLink Debug: isLoading:", isLoading);

        if (taskIdFromUrl && !isLoading) {
            // Check if task exists in loaded tasks
            const allLoadedTasks = Object.values(columnTasks).flat();
            console.log("DeepLink Debug: Loaded tasks count:", allLoadedTasks.length);

            const taskExists = allLoadedTasks.find(t => t.id === taskIdFromUrl);
            console.log("DeepLink Debug: Task found:", !!taskExists);

            if (taskExists) {
                // Small delay to ensure rendering is complete
                setTimeout(() => {
                    console.log("DeepLink Debug: Scrolling to task...");
                    handleLocateTask(taskIdFromUrl);
                }, 1000); // Increased delay to 1s
            } else {
                console.log("DeepLink Debug: Task NOT found in current view. It might be in another column or page.");
            }
        }
    }, [searchParams, isLoading, columnTasks]);


    const handleToggleTaskStatus = async (task: TelesalesTask) => {
        const taskId = task.id;
        const isDone = task.status === 'done';
        const newStatus = isDone ? 'active' : 'done';

        // 🚀 Optimistic update
        setColumnTasks(prev => {
            const newColumnTasks = { ...prev };
            for (const colId in newColumnTasks) {
                newColumnTasks[colId] = newColumnTasks[colId].map(t =>
                    t.id === taskId ? { ...t, status: newStatus as TaskStatus } : t
                );
            }
            return newColumnTasks;
        });

        const success = await updateTaskSupabase(taskId, { status: newStatus as TaskStatus });

        // Also move placement to done/inbox column
        const targetColType = isDone ? 'system_inbox' : 'system_done';
        const targetCol = dbColumns.find(c => c.column_type === targetColType);
        if (targetCol) {
            await moveTaskToColumn(taskId, targetCol.id, session?.access_token);
        }

        if (!success) {
            refreshData();
            alert("Lỗi: Không thể cập nhật trạng thái công việc.");
        } else {
            // Refresh to show task in correct column
            refreshData();
        }
    };

    const handleHandledToday = async (task: TelesalesTask) => {
        const taskId = task.id;
        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const newHandledDate = task.handled_date === localDate ? null : localDate;
        
        // 🚀 Optimistic update
        setColumnTasks(prev => {
            const newColumnTasks = { ...prev };
            for (const colId in newColumnTasks) {
                newColumnTasks[colId] = newColumnTasks[colId].map(t =>
                    t.id === taskId ? { ...t, handled_date: newHandledDate } : t
                );
            }
            return newColumnTasks;
        });

        const success = await updateTaskSupabase(taskId, { handled_date: newHandledDate }, session?.access_token);
        if (!success) {
            refreshData();
            alert("Lỗi: Không thể cập nhật trạng thái xử lý.");
        }
    };

    const loadTasksForColumn = useCallback(async (colId: string, pageNum: number = 1, isLoadMore: boolean = false, colType?: string) => {
        if (!user || !session?.access_token) return;

        setLoadingColumns(prev => ({ ...prev, [colId]: true }));
        try {
            // Determine column type from dbColumns if not provided
            const columnType = colType || dbColumns.find(c => c.id === colId)?.column_type || 'custom';

            if (isDateColumn(columnType)) {
                // DATE COLUMNS: fetch by due_date range using RPC
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                let startDate = new Date(today);
                let endDate = new Date(today);

                if (columnType === 'date_today') {
                    endDate.setHours(23, 59, 59, 999);
                } else if (columnType === 'date_tomorrow') {
                    startDate.setDate(today.getDate() + 1);
                    endDate.setDate(today.getDate() + 1);
                    endDate.setHours(23, 59, 59, 999);
                } else if (columnType === 'date_this_week') {
                    startDate.setDate(today.getDate() + 2);
                    endDate.setDate(today.getDate() + 7);
                    endDate.setHours(23, 59, 59, 999);
                } else if (columnType === 'date_overdue') {
                    startDate = new Date('2000-01-01');
                    endDate.setDate(today.getDate() - 1);
                    endDate.setHours(23, 59, 59, 999);
                }

                const { fetchUnifiedTasks } = require("@/lib/telesalesTasksStore");
                const data = await fetchUnifiedTasks({ userId: user.id, startDate, endDate }, session.access_token);

                setColumnTasks(prev => ({ ...prev, [colId]: data }));
                setColumnHasMore(prev => ({ ...prev, [colId]: false }));
                setTotalCounts(prev => ({ ...prev, [colId]: data.length }));
            } else if (isPlacementColumn(columnType)) {
                // PLACEMENT COLUMNS: fetch via RPC get_column_tasks
                const data = await fetchColumnTasks(colId, 50, isLoadMore ? (pageNum - 1) * 50 : 0, session.access_token);

                setColumnTasks(prev => ({
                    ...prev,
                    [colId]: isLoadMore ? [...(prev[colId] || []), ...data] : data
                }));
                setColumnHasMore(prev => ({ ...prev, [colId]: data.length >= 50 }));
                setColumnPages(prev => ({ ...prev, [colId]: pageNum }));
                setTotalCounts(prev => ({ ...prev, [colId]: isLoadMore ? (prev[colId] || 0) : data.length }));
            }
        } catch (error) {
            console.error(`[loadTasksForColumn] Error for ${colId}:`, error);
        } finally {
            setLoadingColumns(prev => ({ ...prev, [colId]: false }));
        }
    }, [user, session?.access_token, dbColumns, debouncedSearchQuery, filterPriority, filterDueDate, filterCustomerType]);

    const refreshData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        // Fetch profiles + columns from DB in parallel
        const [{ data: profileData }, fetchedDbCols] = await Promise.all([
            supabase.from('profiles').select('id, full_name, email'),
            fetchUserColumns(session?.access_token)
        ]);
        if (profileData) setProfiles(profileData);

        // Convert DB columns to UI format
        setDbColumns(fetchedDbCols);
        const uiCols = fetchedDbCols.map(dbColToUiCol);
        setColumns(uiCols);

        // Load each visible column independently
        const visibleCols = fetchedDbCols.filter(c => c.is_visible !== false);
        await Promise.all(visibleCols.map(col => loadTasksForColumn(col.id, 1, false, col.column_type)));

        // Admin-only: Inject interview candidates into inbox column
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        console.log('[Interview Sync] pathname:', currentPath);
        if (currentPath.includes('/admin/tasks')) {
            console.log('[Interview Sync] ✅ Admin tasks page detected, fetching interview candidates...');
            console.log('[Interview Sync] Available columns:', fetchedDbCols.map(c => ({ id: c.id, type: c.column_type, label: c.label })));
            try {
                const res = await fetch('/api/recruitment/sync-interview-tasks');
                const data = await res.json();
                console.log('[Interview Sync] API response:', JSON.stringify(data));
                if (data.success && data.tasks?.length > 0) {
                    const inboxCol = fetchedDbCols.find(c => c.column_type === 'system_inbox');
                    console.log('[Interview Sync] Inbox column found:', inboxCol?.id, inboxCol?.label);
                    if (inboxCol) {
                        setColumnTasks(prev => {
                            const existing = prev[inboxCol.id] || [];
                            console.log('[Interview Sync] Existing inbox tasks:', existing.length);
                            const newTasks = data.tasks.filter((t: any) => !existing.some((e: any) => e.id === t.id));
                            console.log('[Interview Sync] New tasks to inject:', newTasks.length);
                            if (newTasks.length === 0) return prev;
                            return { ...prev, [inboxCol.id]: [...newTasks, ...existing] };
                        });
                    } else {
                        console.warn('[Interview Sync] ❌ No inbox column found!');
                    }
                } else {
                    console.log('[Interview Sync] No tasks to sync or API error');
                }
            } catch (e) {
                console.error('[Interview Sync] ❌ Fetch failed:', e);
            }
        }

        setIsLoading(false);
    }, [user, loadTasksForColumn]);

    // Helper to scroll to task
    const handleLocateTask = (taskId: string) => {
        setIsNotificationOpen(false);
        setViewMode("kanban"); // Switch to kanban to see the card

        // Timeout to allow potential view switch render
        setTimeout(() => {
            const element = document.getElementById(`task-${taskId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedTaskId(taskId);
                setTimeout(() => setHighlightedTaskId(null), 2000); // Clear highlight after 2s
            }
        }, 100);
    };

    useEffect(() => {
        if (user) {
            refreshData();
        } else if (!authIsLoading) {
            setIsLoading(false);
        }

        const handleColumnUpdate = () => refreshData();

        window.addEventListener("telesales-columns-updated", handleColumnUpdate);




        // --- REALTIME SUBSCRIPTION ---
        let channel: any = null;
        if (user) {
            console.log("[Tasks Page] Subscribing to Realtime... VERSION: DEBUG_V5_FULL_IDENTITY");
            channel = supabase
                .channel('room_telesales_tasks')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'telesales_tasks' },
                    (payload: any) => {
                        console.log('[Tasks Page] Realtime Event:', payload);

                        // Handle INSERT
                        if (payload.eventType === 'INSERT') {
                            if (savingRef.current) {
                                console.log('[Realtime] Skipping INSERT (save in progress)');
                                return;
                            }
                            const newTask = payload.new as any;
                            const userId = user.id;
                            const isRelevant =
                                newTask.user_id === userId ||
                                newTask.owner_id === userId ||
                                newTask.assigned_to === userId ||
                                newTask.leader_id === userId ||
                                (newTask.assignee_ids && Array.isArray(newTask.assignee_ids) && newTask.assignee_ids.includes(userId));

                            if (isRelevant) {
                                // Add to inbox column (first placement column found)
                                setColumnTasks(prev => {
                                    // If already exists anywhere, skip
                                    for (const col in prev) {
                                        if (prev[col]?.some(t => t.id === newTask.id)) return prev;
                                    }
                                    // Find inbox column ID from current columns
                                    const inboxCol = columns.find((c: any) => c.column_type === 'system_inbox');
                                    if (inboxCol) {
                                        return {
                                            ...prev,
                                            [inboxCol.id]: [newTask, ...(prev[inboxCol.id] || [])]
                                        };
                                    }
                                    return prev;
                                });
                            }
                        }

                        // Handle UPDATE
                        if (payload.eventType === 'UPDATE') {
                            // Helper to check column belonging
                            const updatedTask = payload.new as any;

                            // DEBUG LOGS & Robust Relevance Check
                            const userId = user.id;

                            // Parse assignee_ids safely (handle string vs array)
                            let assigneeIds: string[] = [];
                            try {
                                if (updatedTask.assignee_ids) {
                                    if (Array.isArray(updatedTask.assignee_ids)) {
                                        assigneeIds = updatedTask.assignee_ids;
                                    } else if (typeof updatedTask.assignee_ids === 'string') {
                                        // Handle Postgres array format "{uuid,uuid}" or JSON string
                                        let cleaned = updatedTask.assignee_ids;
                                        if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
                                            cleaned = cleaned.slice(1, -1); // remove {}
                                        }
                                        if (cleaned) {
                                            assigneeIds = cleaned.split(',').map((id: string) => id.trim().replace(/['"]/g, ''));
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error('Error parsing assignee_ids:', e);
                            }

                            const isRelevant =
                                updatedTask.user_id === userId ||
                                updatedTask.owner_id === userId ||
                                updatedTask.assigned_to === userId ||
                                updatedTask.leader_id === userId ||
                                assigneeIds.includes(userId);

                            console.log('[Realtime DEBUG] Update received for task:', updatedTask.id);
                            console.log('[Realtime DEBUG] Task Title:', updatedTask.title);
                            console.log('[Realtime DEBUG] Payload Assignee Ids (raw):', updatedTask.assignee_ids, typeof updatedTask.assignee_ids);
                            console.log('[Realtime DEBUG] Parsed Assignee Ids:', assigneeIds);
                            console.log('[Realtime DEBUG] Is Relevant?:', isRelevant, 'User ID:', userId);

                            console.log('[Realtime DEBUG] Update received for task:', updatedTask.id);
                            console.log('[Realtime DEBUG] Task Title:', updatedTask.title);
                            console.log('[Realtime DEBUG] Attachments count:', updatedTask.attachments ? updatedTask.attachments.length : 0);
                            console.log('[Realtime DEBUG] Attachments FULL:', JSON.stringify(updatedTask.attachments));
                            console.log('[Realtime DEBUG] Is Relevant?:', isRelevant, 'User ID:', userId);

                            // Update Modal State if Open
                            setEditingTask(current => {
                                if (current && current.id === updatedTask.id) {
                                    console.log('[Realtime DEBUG] Updating open modal for task:', updatedTask.id);

                                    // Parse keys explicitly to ensure no casing issues
                                    const nextNote = updatedTask.note !== undefined ? updatedTask.note : current.note;

                                    // FIX: Don't replace existing attachments with empty array from stale Realtime update
                                    // If current has attachments and Realtime sends empty, keep current (likely stale update race condition)
                                    // Only replace if Realtime sends non-empty OR current is empty
                                    const rtAttachments = updatedTask.attachments;
                                    const currentAttachments = current.attachments || [];
                                    let nextAttachments;
                                    if (rtAttachments === undefined) {
                                        // Realtime didn't include attachments
                                        nextAttachments = currentAttachments;
                                    } else if (Array.isArray(rtAttachments) && rtAttachments.length === 0 && currentAttachments.length > 0) {
                                        // Realtime sent empty but we have attachments - likely stale, keep current
                                        console.log('[Realtime DEBUG] PRESERVING current attachments (RT sent empty but current has items)');
                                        nextAttachments = currentAttachments;
                                    } else {
                                        // Realtime sent actual data - use it
                                        nextAttachments = rtAttachments;
                                    }

                                    console.log('[Realtime DEBUG] Old Note:', current.note);
                                    console.log('[Realtime DEBUG] Update Payload Note:', updatedTask.note);
                                    console.log('[Realtime DEBUG] Final Next Note:', nextNote);
                                    console.log('[Realtime DEBUG] ====== ATTACHMENTS MERGE TRACE ======');
                                    console.log('[Realtime DEBUG] current.attachments COUNT:', currentAttachments.length);
                                    console.log('[Realtime DEBUG] updatedTask.attachments COUNT:', rtAttachments ? rtAttachments.length : 'undefined');
                                    console.log('[Realtime DEBUG] nextAttachments COUNT:', nextAttachments ? nextAttachments.length : 0);
                                    console.log('[Realtime DEBUG] =====================================');

                                    // Normalize assignee_ids to Array if string
                                    let normalizedAssignees = updatedTask.assignee_ids;
                                    if (typeof normalizedAssignees === 'string') {
                                        let cleaned = normalizedAssignees;
                                        if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
                                            cleaned = cleaned.slice(1, -1);
                                        }
                                        if (cleaned) {
                                            normalizedAssignees = cleaned.split(',').map((id: string) => id.trim().replace(/['"]/g, ''));
                                        } else {
                                            normalizedAssignees = [];
                                        }
                                    }

                                    const nextAssignees = normalizedAssignees !== undefined ? normalizedAssignees : current.assignee_ids;

                                    const nextState = {
                                        ...current,
                                        // Spread updatedTask but be careful not to overwrite with undefined if we handled it
                                        // Actually, safest is to spread updatedTask check for specific keys?
                                        // Let's spread updatedTask for scalar fields, but enforce our computed fields
                                        ...updatedTask,
                                        assignee_ids: nextAssignees,
                                        note: nextNote,
                                        attachments: nextAttachments,
                                        // Ensure explicit mapping for camelCase if needed (though TelesalesTask uses snake_case mostly)
                                        customer_name: updatedTask.customer_name !== undefined ? updatedTask.customer_name : current.customer_name,
                                        due_date: updatedTask.due_date !== undefined ? updatedTask.due_date : current.due_date
                                    };

                                    console.log('[Realtime DEBUG] Final Merged State:', nextState);
                                    return nextState;
                                }
                                return current;
                            });

                            const checkTaskBelongsToColumn = (task: any, colId: string, currentList: any[]): boolean => {
                                const colDef = columns.find(c => c.id === colId);
                                const cType = colDef?.column_type || colId;

                                if (task.status === 'done' && (cType === 'system_done' || colId === 'done')) return true;
                                if (task.status === 'done') return false; // Done tasks only in Done column usually

                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const taskDate = task.due_date ? new Date(task.due_date) : null;
                                if (taskDate) taskDate.setHours(0, 0, 0, 0);

                                if (cType === 'date_today' || colId === 'today') {
                                    return taskDate ? taskDate.getTime() === today.getTime() : false;
                                }
                                if (cType === 'date_tomorrow' || colId === 'tomorrow') {
                                    const tmr = new Date(today);
                                    tmr.setDate(tmr.getDate() + 1);
                                    return taskDate ? taskDate.getTime() === tmr.getTime() : false;
                                }
                                if (cType === 'date_this_week' || colId === 'this_week') {
                                    return false; // Skip complex week logic for now
                                }
                                if (cType === 'date_overdue' || colId === 'overdue') {
                                    return taskDate ? taskDate.getTime() < today.getTime() : false;
                                }
                                if (cType === 'system_inbox' || colId === 'inbox') {
                                    // For inbox, it usually matches status 'inbox' OR it is placed there.
                                    // But realistically, if it's already there and we do an update (like tick handled_date), keep it.
                                    if (currentList.some(t => t.id === task.id) && task.status !== 'done') return true;
                                    return task.status === 'inbox';
                                }
                                if (cType === 'custom') {
                                    // We can't know custom placements from task payload alone.
                                    // So if it's currently in this column, and not marked 'done', it belongs.
                                    return currentList.some(t => t.id === task.id) && task.status !== 'done';
                                }

                                // Default/Legacy columns: match status
                                return task.status === colId;
                            };

                            // Update ALL columns
                            setColumnTasks(prev => {
                                const newCols = { ...prev };

                                // For each column, decide if we Add, Update, or Remove
                                Object.keys(newCols).forEach(colId => {
                                    const currentList = newCols[colId] || [];
                                    const exists = currentList.find(t => t.id === updatedTask.id);
                                    const belongs = checkTaskBelongsToColumn(updatedTask, colId, currentList);

                                    if (belongs) {
                                        if (exists) {
                                            // UPDATE in place
                                            newCols[colId] = currentList.map(t => {
                                                if (t.id === updatedTask.id) {
                                                    // Normalize updatedTask
                                                    let normalizedAssignees = updatedTask.assignee_ids;
                                                    if (typeof normalizedAssignees === 'string') {
                                                        let cleaned = normalizedAssignees;
                                                        if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
                                                            cleaned = cleaned.slice(1, -1);
                                                        }
                                                        if (cleaned) {
                                                            normalizedAssignees = cleaned.split(',').map((id: string) => id.trim().replace(/['\"]/g, ''));
                                                        } else {
                                                            normalizedAssignees = [];
                                                        }
                                                    }

                                                    // Careful merge like setEditingTask
                                                    return {
                                                        ...t,
                                                        ...updatedTask,
                                                        assignee_ids: normalizedAssignees !== undefined ? normalizedAssignees : t.assignee_ids,
                                                        note: updatedTask.note !== undefined ? updatedTask.note : t.note,
                                                        attachments: updatedTask.attachments !== undefined ? updatedTask.attachments : t.attachments,
                                                        customer_name: updatedTask.customer_name !== undefined ? updatedTask.customer_name : t.customer_name
                                                    };
                                                }
                                                return t;
                                            });
                                        } else {
                                            // INSERT (task moved INTO this column, didn't exist before)
                                            // Normalize updatedTask before adding
                                            let normalizedAssignees = updatedTask.assignee_ids;
                                            if (typeof normalizedAssignees === 'string') {
                                                let cleaned = normalizedAssignees;
                                                if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
                                                    cleaned = cleaned.slice(1, -1);
                                                }
                                                if (cleaned) {
                                                    normalizedAssignees = cleaned.split(',').map((id: string) => id.trim().replace(/['\"]/g, ''));
                                                } else {
                                                    normalizedAssignees = [];
                                                }
                                            }
                                            const normalizedTask = {
                                                ...updatedTask,
                                                assignee_ids: normalizedAssignees !== undefined ? normalizedAssignees : []
                                            };
                                            newCols[colId] = [normalizedTask, ...currentList];
                                        }
                                    } else {
                                        if (exists) {
                                            // DELETE (moved out of this column)
                                            newCols[colId] = currentList.filter(t => t.id !== updatedTask.id);
                                        }
                                    }
                                });
                                return newCols;
                            });
                        }

                        // Handle DELETE
                        if (payload.eventType === 'DELETE') {
                            const deletedId = payload.old.id;
                            setColumnTasks(prev => {
                                const newCols = { ...prev };
                                for (const colId in newCols) {
                                    if (Array.isArray(newCols[colId])) {
                                        newCols[colId] = newCols[colId].filter(t => t.id !== deletedId);
                                    }
                                }
                                return newCols;
                            });
                        }
                    }
                )
                .subscribe((status: any) => {
                    console.log('[Tasks Page] Realtime Status:', status);
                    if (status === 'SUBSCRIBED') {
                        console.log('[Tasks Page] Successfully subscribed to changes');
                    }
                });
        }

        return () => {
            window.removeEventListener("telesales-columns-updated", handleColumnUpdate);
            if (channel) supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, session?.access_token, authIsLoading]); // Removed refreshData to prevent infinite loop

    const handleLogCall = (task: TelesalesTask) => {
        setTaskToLog(task);
        setIsLogModalOpen(true);
    };

    const handleSaveLog = async (logData: any) => {
        if (taskToLog) {
            await addLogSupabase(taskToLog.id, logData);

            // Auto-sync calls to KPI (re-count from actual CRM data)
            try {
                const { data } = await createClient().auth.getSession();
                const userId = data?.session?.user?.id;
                if (userId) {
                    // Use local date (not UTC) to match user's timezone
                    const now = new Date();
                    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const { syncCallsFromCRM } = await import('@/lib/telesalesDailyStore');
                    await syncCallsFromCRM(userId, localDate);
                }
            } catch (err) {
                console.error('Error syncing call to KPI:', err);
            }

            setIsLogModalOpen(false);
            setTaskToLog(null);
            refreshData(); // Refresh to get logs if needed
        }
    };

    // Focus input when editing starts
    useEffect(() => {
        if (editingColumnId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingColumnId]);

    // Handle Open Create/Edit
    const openCreateModal = (status: TaskStatus = "inbox", columnId?: string) => {
        setCreateModalInitialStatus(status);
        setCreateFromColumnId(columnId || null);
        setEditingTask(null);
        setIsCreateModalOpen(true);
    };

    const handleEditTask = (task: TelesalesTask) => {
        setEditingTask(task);
        setCreateModalInitialStatus(task.status);
        setIsCreateModalOpen(true); // Edit still uses full modal for now to show all fields
    };

    // Handle Save (Create or Update)
    // Handle Save (Create or Update)
    const handleSaveTask = async (taskData: any) => {
        setIsLoading(true);
        savingRef.current = true;
        try {
            if (taskData.id) {
                await updateTaskSupabase(taskData.id, taskData, session?.access_token);
                // Also create/update placements for all assignees (handles newly tagged users)
                const allUserIds = new Set<string>();
                if (user?.id) allUserIds.add(user.id);
                if (taskData.assignee_ids) taskData.assignee_ids.forEach((id: string) => allUserIds.add(id));
                if (taskData.assigned_to) allUserIds.add(taskData.assigned_to);
                if (taskData.leader_id) allUserIds.add(taskData.leader_id);
                await createTaskPlacements(taskData.id, Array.from(allUserIds), session?.access_token);
            } else {
                // Create mode - then create placements for all assignees
                const created = await createTaskSupabase(taskData, session?.access_token);
                if (created && (Array.isArray(created) ? created[0]?.id : created?.id)) {
                    const taskId = Array.isArray(created) ? created[0].id : created.id;
                    // Collect all user IDs: owner + assignees
                    const allUserIds = new Set<string>();
                    if (user?.id) allUserIds.add(user.id);
                    if (taskData.assignee_ids) taskData.assignee_ids.forEach((id: string) => allUserIds.add(id));
                    if (taskData.assigned_to) allUserIds.add(taskData.assigned_to);
                    if (taskData.leader_id) allUserIds.add(taskData.leader_id);
                    await createTaskPlacements(taskId, Array.from(allUserIds), session?.access_token);
                    // If creating from a specific column (not inbox), move creator's placement there
                    if (createFromColumnId && user?.id) {
                        await moveTaskToColumn(taskId, createFromColumnId, session?.access_token);
                    }
                }
            }
            await refreshData();
            setIsCreateModalOpen(false);
            setIsSimpleModalOpen(false);
        } catch (error: any) {
            console.error("Failed to save task", error);
            alert(`Không thể lưu công việc: ${error?.message || JSON.stringify(error)}`);
        } finally {
            savingRef.current = false;
            setIsLoading(false);
        }
    };

    // Handle Delete
    const handleDeleteTask = async (taskId: string) => {
        if (confirm("Bạn chắc chắn muốn xóa việc này?")) {
            await deleteTaskSupabase(taskId);
            setIsCreateModalOpen(false);
            refreshData();
        }
    };


    // --- Drag & Drop Logic ---

    const handleTaskDragStart = (e: React.DragEvent, id: string, colId: string) => {
        setDraggedTaskId(id);
        e.dataTransfer.setData("telesales/task", id);
        e.dataTransfer.setData("telesales/sourceColumn", colId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleColumnDragStart = (e: React.DragEvent, colId: string) => {
        if (editingColumnId) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("telesales/column", colId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleColumnDragEnd = (e: React.DragEvent) => {
        setDraggedTaskId(null);
        setDropIndicator(null);
        setDragOverColId(null);
    };

    const handleDragOverColumn = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        setDragOverColId(colId);
        if (e.currentTarget === e.target) {
            setDropIndicator(null);
        }
    };

    const handleTaskDragOver = (e: React.DragEvent, targetTaskId: string) => {
        if (!draggedTaskId) return;
        if (draggedTaskId === targetTaskId) return;

        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const position = y < rect.height / 2 ? 'top' : 'bottom';
        setDropIndicator({ taskId: targetTaskId, position });
        setDragOverColId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetColId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const draggedTaskIdData = e.dataTransfer.getData("telesales/task");
        const draggedColId = e.dataTransfer.getData("telesales/column");

        setDraggedTaskId(null);
        setDropIndicator(null);
        setDragOverColId(null);

        // 1. Handle Task Drop
        if (draggedTaskIdData) {
            const allTasks = Object.values(columnTasks).flat();
            const draggedTask = allTasks.find(t => t.id === draggedTaskIdData);
            if (!draggedTask) return;

            // Find target column type
            const targetCol = dbColumns.find(c => c.id === targetColId);
            const targetColType = targetCol?.column_type || 'custom';

            // Optimistic: move task between columns in UI
            setColumnTasks(prev => {
                const newColumnTasks = { ...prev };
                for (const colId in newColumnTasks) {
                    if (Array.isArray(newColumnTasks[colId])) {
                        newColumnTasks[colId] = newColumnTasks[colId].filter(t => t.id !== draggedTaskIdData);
                    }
                }
                newColumnTasks[targetColId] = [...(Array.isArray(newColumnTasks[targetColId]) ? newColumnTasks[targetColId] : []), draggedTask];
                return newColumnTasks;
            });

            // Handle based on target column type
            if (isDateColumn(targetColType)) {
                // Date column: update due_date on the task
                const today = new Date();
                const msOneDay = 24 * 60 * 60 * 1000;
                let newDueDate: string | null = null;

                if (targetColType === 'date_today') newDueDate = new Date().toISOString();
                else if (targetColType === 'date_tomorrow') newDueDate = new Date(today.getTime() + msOneDay).toISOString();
                else if (targetColType === 'date_this_week') newDueDate = new Date(today.getTime() + 2 * msOneDay).toISOString();
                else if (targetColType === 'date_overdue') newDueDate = draggedTask.due_date || null; // Keep existing

                await updateTaskSupabase(draggedTaskIdData, { due_date: newDueDate } as any);
                // Also move placement to inbox (inbox filters out tasks with due_date, so no duplication)
                const inboxCol = dbColumns.find(c => c.column_type === 'system_inbox');
                if (inboxCol) {
                    await moveTaskToColumn(draggedTaskIdData, inboxCol.id, session?.access_token);
                }
            } else if (isPlacementColumn(targetColType)) {
                // Placement column: move task placement
                await moveTaskToColumn(draggedTaskIdData, targetColId, session?.access_token);
                // If moving to 'done' column, also update task status
                if (targetColType === 'system_done') {
                    await updateTaskSupabase(draggedTaskIdData, { status: 'done' as TaskStatus });
                } else if (targetColType === 'system_inbox') {
                    await updateTaskSupabase(draggedTaskIdData, { status: 'active' as TaskStatus });
                }
            }

            // Refresh to sync
            setTimeout(() => refreshData(), 500);
        }

        // 2. Handle Column Drop (reorder)
        if (draggedColId && draggedColId !== targetColId) {
            const currentCols = [...columns];
            const sourceIndex = currentCols.findIndex(c => c.id === draggedColId);
            const targetIndex = currentCols.findIndex(c => c.id === targetColId);

            if (sourceIndex >= 0 && targetIndex >= 0) {
                const [movedCol] = currentCols.splice(sourceIndex, 1);
                currentCols.splice(targetIndex, 0, movedCol);
                setColumns(currentCols);
                // Save order to DB
                reorderUserColumns(currentCols.map((c, i) => ({ id: c.id, position: i })), session?.access_token);
            }
        }
    };

    // --- Column Management ---

    const handleAddColumn = async () => {
        const newCol = await createUserColumn({ label: 'Cột mới' }, session?.access_token);
        if (newCol) {
            await refreshData();
        }
    };

    const deleteColumnHandler = async (id: string, isDefault?: boolean) => {
        const col = dbColumns.find(c => c.id === id);
        if (col && (col.column_type === 'system_inbox' || col.column_type === 'system_done')) {
            alert("Không thể xóa cột hệ thống.");
            return;
        }
        if (col && col.column_type.startsWith('date_')) {
            alert("Không thể xóa cột ngày hệ thống.");
            return;
        }
        const hasTasks = (columnTasks[id] || []).length > 0;
        if (hasTasks) {
            if (!window.confirm("Cột này đang có việc. Nếu xóa, các việc sẽ chuyển về Hộp thư đến. Bạn chắc chắn chứ?")) return;
        } else {
            if (!window.confirm("Bạn có chắc chắn muốn xóa cột này?")) return;
        }
        await deleteUserColumn(id, session?.access_token);
        await refreshData();
    };

    const toggleColumnVisibility = async (colId: string, currentVisible: boolean) => {
        await updateUserColumn(colId, { is_visible: !currentVisible }, session?.access_token);
        await refreshData();
    };

    const startEditing = (col: TelesalesColumn) => {
        setEditingColumnId(col.id);
        setEditingTitle(col.label);
    };

    const saveEditing = async (id: string) => {
        const safeTitle = (editingTitle ?? "").trim();
        if (safeTitle) {
            await updateUserColumn(id, { label: safeTitle }, session?.access_token);
        }
        setEditingColumnId(null);
        setEditingTitle("");
        await refreshData();
    };

    const cancelEditing = () => {
        setEditingColumnId(null);
        setEditingTitle("");
    };

    // --- Filtering Logic (Phase B: Enhanced) ---
    const allTasks = Object.values(columnTasks).filter(Array.isArray).flat();
    const filteredTasks = allTasks.filter(task => {
        // Search filter
        const matchesSearch = !debouncedSearchQuery ||
            task.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            (task.customer_name && task.customer_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
            (task.phone && task.phone.includes(debouncedSearchQuery));

        // Priority filter
        const matchesPriority = filterPriority === "all" || task.priority === filterPriority;

        // Type filter (deprecated but kept for compatibility)
        const matchesType = filterType === "all" || task.type === filterType;

        // Due date filter (Phase B)
        let matchesDueDate = true;
        if (filterDueDate !== "all" && task.due_date) {
            const taskDate = new Date(task.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);

            if (filterDueDate === "overdue") {
                matchesDueDate = taskDate < today && task.status !== 'done';
            } else if (filterDueDate === "today") {
                matchesDueDate = taskDate.toDateString() === today.toDateString();
            } else if (filterDueDate === "week") {
                matchesDueDate = taskDate >= today && taskDate <= weekFromNow;
            }
        }

        // Customer type filter (Phase B)
        let matchesCustomerType = true;
        if (filterCustomerType === "customer") {
            matchesCustomerType = !!(task.customer_name || task.phone);
        } else if (filterCustomerType === "personal") {
            matchesCustomerType = !task.customer_name && !task.phone;
        }

        return matchesSearch && matchesPriority && matchesType && matchesDueDate && matchesCustomerType;
    });


    const visibleColumns = columns.filter(c => c.isVisible !== false);

    // Simplified metrics for bell (approximate based on loaded columns or we could fetch metrics)
    // For now, let's use what's loaded
    const loadedTasks = Object.values(columnTasks).filter(Array.isArray).flat();
    const overdueCount = loadedTasks.filter(t => t.due_date && new Date(t.due_date).getTime() < msToday && t.status !== 'done').length;
    const todayCount = loadedTasks.filter(t => t.due_date && new Date(t.due_date).setHours(0, 0, 0, 0) === msToday && t.status !== 'done').length;

    return (
        <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col relative" onClick={() => setIsSettingsOpen(false)}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-[60] relative">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Việc cần làm</h1>
                    <p className="text-sm text-slate-500">Quản lý các đầu việc và cuộc gọi hằng ngày</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Lead button removed - use CRM for lead management */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsSimpleModalOpen(true); }}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Việc mới</span>
                    </button>

                    {/* Notification Bell */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsNotificationOpen(true); }}
                        className="relative p-2 bg-white border rounded-lg hover:bg-slate-50 text-slate-600"
                    >
                        <Bell className="w-4 h-4" />
                        {(overdueCount + todayCount) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                                {overdueCount + todayCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Panel (Slide-in) */}
                    {isNotificationOpen && (
                        <>
                            {/* Overlay */}
                            <div
                                className="fixed inset-0 bg-black/20 z-[9990]"
                                onClick={() => setIsNotificationOpen(false)}
                            />
                            {/* Panel */}
                            <div className="fixed top-0 right-0 h-full w-[320px] bg-white shadow-2xl z-[9999] flex flex-col animate-in slide-in-from-right duration-200">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <Bell className="w-4 h-4" /> Thông báo
                                    </h3>
                                    <button onClick={() => setIsNotificationOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                                </div>
                                {/* Tabs */}
                                <div className="flex border-b border-slate-100">
                                    <button
                                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeNotifTab === 'overdue' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setActiveNotifTab('overdue')}
                                    >
                                        Quá hạn <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{overdueCount}</span>
                                    </button>
                                    <button
                                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeNotifTab === 'today' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setActiveNotifTab('today')}
                                    >
                                        Hôm nay <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{todayCount}</span>
                                    </button>
                                </div>
                                {/* List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                                    {(() => {
                                        const list = activeNotifTab === 'overdue'
                                            ? Object.values(columnTasks).flat().filter(t => t.due_date && new Date(t.due_date).getTime() < msToday && t.status !== 'done')
                                            : Object.values(columnTasks).flat().filter(t => t.due_date && new Date(t.due_date).setHours(0, 0, 0, 0) === msToday && t.status !== 'done');

                                        if (list.length === 0) {
                                            return <div className="text-center text-sm text-slate-400 py-8">Không có công việc nào.</div>
                                        }

                                        return list.map(t => (
                                            <div
                                                key={t.id}
                                                onClick={() => handleLocateTask(t.id)}
                                                className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-primary-300 hover:shadow-md transition-all active:scale-[0.98]"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-sm font-medium text-slate-900 line-clamp-2">{t.title}</h4>
                                                    <PriorityBadge priority={t.priority as any} />
                                                </div>
                                                <div className="text-xs text-slate-500 mb-2">{t.customer_name || "Khách lẻ"}</div>
                                                <div className={`text-xs font-medium flex items-center gap-1 ${activeNotifTab === 'overdue' ? 'text-red-600' : 'text-blue-600'}`}>
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(t.due_date!).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Settings Menu */}
                    <div className="relative z-[60]">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }}
                            className={`bg-white border p-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors ${isSettingsOpen ? 'ring-2 ring-primary-100 border-primary-500' : ''}`}
                            title="Cài đặt cột"
                        >
                            <Settings className="w-4 h-4" />
                        </button>

                        {isSettingsOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-[9999]" onClick={(e) => e.stopPropagation()}>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase px-2 py-1 mb-1">Hiển thị cột</h4>
                                <div className="max-h-[300px] overflow-y-auto space-y-1">
                                    {columns.map(col => (
                                        <div key={col.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded text-sm text-slate-700">
                                            <span>{col.label}</span>
                                            <button
                                                onClick={() => toggleColumnVisibility(col.id, col.isVisible !== false)}
                                                className={`transition-colors ${col.isVisible !== false ? 'text-primary-600' : 'text-slate-300'}`}
                                            >
                                                {col.isVisible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-slate-100 my-2 pt-2">
                                    <button
                                        onClick={() => { handleAddColumn(); setIsSettingsOpen(false); }}
                                        className="w-full flex items-center justify-center gap-2 text-sm text-primary-600 hover:bg-primary-50 py-2 rounded font-medium"
                                    >
                                        <Plus className="w-4 h-4" /> Thêm cột mới
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Khôi phục tất cả cột về mặc định? Cột tùy chỉnh sẽ bị xóa.')) {
                                                // Delete all custom columns, refresh will reload defaults
                                                const customCols = dbColumns.filter(c => c.column_type === 'custom');
                                                for (const col of customCols) {
                                                    await deleteUserColumn(col.id, session?.access_token);
                                                }
                                                await refreshData();
                                            }
                                            setIsSettingsOpen(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:bg-slate-50 py-2 rounded font-medium hover:text-red-600 mt-1"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Khôi phục mặc định
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border p-1 rounded-lg flex">
                        <button
                            onClick={(e) => { e.stopPropagation(); setViewMode("kanban"); }}
                            className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setViewMode("list"); }}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Toolbar: Filters & Search */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between z-10 sticky top-[60px]">
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên việc, khách hàng, SĐT..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <div className="flex items-center gap-2 min-w-[150px]">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value as TaskPriority | "all")}
                        >
                            <option value="all">Tất cả ưu tiên</option>
                            <option value="low">Thấp</option>
                            <option value="normal">Bình thường</option>
                            <option value="high">Cao</option>
                            <option value="urgent">Khẩn cấp</option>
                        </select>
                    </div>

                    {/* Phase B: Due Date Filter */}
                    <div className="flex items-center gap-2 min-w-[140px]">
                        <select
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={filterDueDate}
                            onChange={(e) => setFilterDueDate(e.target.value as any)}
                        >
                            <option value="all">Tất cả hạn</option>
                            <option value="overdue">Quá hạn</option>
                            <option value="today">Hôm nay</option>
                            <option value="week">Tuần này</option>
                        </select>
                    </div>

                    {/* Phase B: Customer Type Filter */}
                    <div className="flex items-center gap-2 min-w-[140px]">
                        <select
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={filterCustomerType}
                            onChange={(e) => setFilterCustomerType(e.target.value as any)}
                        >
                            <option value="all">Tất cả loại</option>
                            <option value="customer">Có khách</option>
                            <option value="personal">Cá nhân</option>
                        </select>
                    </div>

                    {/* Type filter removed - Phase 3: Tasks only have one type */}
                </div>
            </div>

            {/* Content */}
            {viewMode === "kanban" ? (
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-[100%] h-full items-start">
                        {visibleColumns.length > 0 && visibleColumns.map(col => {
                            // FIX: Use columnTasks directly because unified columns rely on RPC 'due_date' logic, NOT the string 'status' field!
                            // We intersect with `filteredTasks` to apply search and priority filters correctly.
                            const colList = columnTasks[col.id] || [];
                            const tasks = colList.filter(t => filteredTasks.some(ft => ft.id === t.id));

                            const isLoadingCol = loadingColumns[col.id];
                            const hasMore = columnHasMore[col.id];

                            const showAppendPlaceholder = draggedTaskId && dragOverColId === col.id && !dropIndicator;

                            return (
                                <div
                                    key={col.id}
                                    draggable={!editingColumnId}
                                    onDragStart={(e) => handleColumnDragStart(e, col.id)}
                                    onDragEnd={handleColumnDragEnd}
                                    onDragOver={(e) => handleDragOverColumn(e, col.id)}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                    className={`flex-1 min-w-[280px] bg-slate-50/50 rounded-xl flex flex-col max-h-[calc(100vh-280px)] group/col border-2 transition-colors 
                                        ${dragOverColId === col.id ? 'border-primary-300 bg-primary-50/20' : 'border-transparent hover:border-slate-200'}
                                    `}
                                >
                                    {/* Column Header */}
                                    <div className="p-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-slate-50/95 backdrop-blur-sm rounded-t-xl z-20 cursor-grab active:cursor-grabbing">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {editingColumnId === col.id ? (
                                                <div className="flex items-center gap-1 w-full" onMouseDown={e => e.stopPropagation()}>
                                                    <input
                                                        ref={editInputRef}
                                                        className="w-full text-sm font-semibold px-2 py-1 border border-primary-500 rounded focus:outline-none"
                                                        value={editingTitle}
                                                        onChange={(e) => setEditingTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveEditing(col.id);
                                                            if (e.key === 'Escape') cancelEditing();
                                                        }}
                                                        onBlur={() => saveEditing(col.id)}
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className="flex items-center gap-2 flex-1 min-w-0"
                                                    onDoubleClick={() => startEditing(col)}
                                                    title="Double click để sửa tên"
                                                >
                                                    <h3 className="font-semibold text-slate-700 text-sm uppercase truncate">{col.label}</h3>
                                                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                                        {totalCounts[col.id] || 0}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover/col:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditing(col)}
                                                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-blue-600"
                                                title="Sửa tên"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => deleteColumnHandler(col.id, col.isDefault)}
                                                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-600"
                                                title="Xóa cột"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => openCreateModal('inbox' as TaskStatus, col.id)}
                                                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded ml-1"
                                                title="Thêm việc"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tasks Container */}
                                    <div className="p-2 flex-1 overflow-y-auto space-y-1 relative min-h-[100px]">
                                        {tasks.length === 0 && !isLoadingCol && !showAppendPlaceholder ? (
                                            <div className="text-center py-12 text-slate-400">
                                                <div className="text-4xl mb-2">📝</div>
                                                <p className="text-sm font-medium text-slate-500">Chưa có việc nào</p>
                                                <p className="text-xs mt-1">Kéo thả hoặc click + để thêm</p>
                                            </div>
                                        ) : (
                                            <>
                                                {tasks.map(task => {
                                                    const isOverdueTask = task.due_date ? new Date(task.due_date).getTime() < msToday && task.status !== 'done' : false;
                                                    return (
                                                        <MemoizedTaskCard
                                                            key={task.id}
                                                            task={task}
                                                            isDragging={draggedTaskId === task.id}
                                                            onDragStart={handleTaskDragStart}
                                                            onDragOver={handleTaskDragOver}
                                                            dropIndicator={dropIndicator}
                                                            onLogCall={handleLogCall}
                                                            onEdit={handleEditTask}
                                                            onToggleStatus={handleToggleTaskStatus}
                                                            onRefresh={refreshData}
                                                            isOverdue={isOverdueTask}
                                                            isHighlighted={highlightedTaskId === task.id}
                                                            profiles={profiles}
                                                            onHandledToday={handleHandledToday}
                                                        />
                                                    )
                                                })}

                                                {/* Load More Button */}
                                                {hasMore && (
                                                    <button
                                                        onClick={() => loadTasksForColumn(col.id, (columnPages[col.id] || 1) + 1, true)}
                                                        disabled={isLoadingCol}
                                                        className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {isLoadingCol ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            'Tải thêm...'
                                                        )}
                                                    </button>
                                                )}

                                                {isLoadingCol && tasks.length === 0 && (
                                                    <div className="flex justify-center py-8">
                                                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Append Placeholder */}
                                        {showAppendPlaceholder && (
                                            <div className="h-24 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/50 animate-pulse mt-1 pointer-events-none" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="min-w-[50px] flex items-start justify-center pt-2">
                            <button onClick={() => handleAddColumn()} className="p-2 rounded-full hover:bg-slate-200 text-slate-400" title="Thêm cột mới">
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    {/* Simple List View implementation if needed, or just placeholder for now since Kanban is main */}
                    <p className="text-slate-500">Chế độ xem danh sách chưa được cập nhật đầy đủ (Sử dụng Kanban để có trải nghiệm tốt nhất).</p>
                    {/* Iterate tasks if we want list view */}
                    <div className="mt-4 space-y-2">
                        {filteredTasks.map(task => (
                            <div key={task.id} className="flex justify-between p-3 border rounded hover:bg-slate-50 cursor-pointer" onClick={() => handleEditTask(task)}>
                                <div>
                                    <div className="font-semibold">{task.title}</div>
                                    <div className="text-sm text-slate-500">{task.customer_name} - {task.phone}</div>
                                </div>
                                <div className="text-right">
                                    <PriorityBadge priority={task.priority} />
                                    <div className="text-xs text-slate-400 mt-1">{task.status}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create/Edit Task Modal */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                initialStatus={createModalInitialStatus}
                initialData={editingTask || undefined}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleSaveTask}
                onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : undefined}
                columns={columns}
            />

            {/* Log Call Modal */}
            <LogCallModal
                isOpen={isLogModalOpen}
                taskTitle={taskToLog?.title || ""}
                customerName={taskToLog?.customer_name || ""}
                onClose={() => setIsLogModalOpen(false)}
                onSave={handleSaveLog}
            />
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 z-[100] flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                </div>
            )}

            {/* NEW Modals */}
            <TaskSimpleModal
                isOpen={isSimpleModalOpen}
                onClose={() => setIsSimpleModalOpen(false)}
                onSave={handleSaveTask}
                currentUser={user} // Pass user from useAuth
            />
        </div>
    );
}
