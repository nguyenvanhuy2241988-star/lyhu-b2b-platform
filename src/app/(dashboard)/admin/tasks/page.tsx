"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient, supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";

import Link from "next/link";
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
    ListTodo
} from "lucide-react";
import {
    TelesalesTask,
    TaskStatus,
    TaskPriority,
    TaskType,
    TASK_PRIORITY_LABELS,
    fetchTasks,
    updateTaskSupabase,
    createTaskSupabase,
    moveTaskSupabase,
    deleteTaskSupabase,
    loadColumns,
    saveColumns,
    TelesalesColumn,
    DEFAULT_COLUMNS
} from "@/lib/telesalesTasksStore";

// --- Local Implementations for Column Management (Missing in Store) ---
const addColumn = () => {
    const cols = loadColumns();
    const newId = `col_${Date.now()}`;
    const newCol: TelesalesColumn = { id: newId as any, label: "Cột mới", status: 'inbox', order: cols.length, isDefault: false, isVisible: true };
    const newCols = [...cols, newCol];
    saveColumns(newCols);
    return newCols;
};

const deleteColumn = (id: string) => {
    const cols = loadColumns().filter(c => c.id !== id);
    saveColumns(cols);
    return cols;
};

const updateColumn = (id: string, patch: Partial<TelesalesColumn>) => {
    const cols = loadColumns().map(c => c.id === id ? { ...c, ...patch } : c);
    saveColumns(cols);
    return cols;
};

const reorderColumns = (newCols: TelesalesColumn[]) => {
    const ordered = newCols.map((c, i) => ({ ...c, order: i }));
    saveColumns(ordered);
    return ordered;
};

const resetColumns = () => {
    saveColumns(DEFAULT_COLUMNS);
    return DEFAULT_COLUMNS;
};

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
import { FileText, Link as LinkIcon, Image as ImageIcon, CheckCircle, ChevronDown, MoreHorizontal, UserPlus, Paperclip } from "lucide-react";

// --- Components ---

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
    const colors = {
        low: "bg-slate-100 text-slate-700",
        normal: "bg-blue-100 text-blue-700",
        high: "bg-orange-100 text-orange-700",
        urgent: "bg-red-100 text-red-700",
    };
    return (
        <span className={`px-2 py-0.5 rounded textxs font-medium ${colors[priority] || colors.normal}`}>
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
}

const TaskCard = ({ task, isDragging, onDragStart, onDragOver, dropIndicator, onLogCall, onEdit, onToggleStatus, onRefresh, isOverdue, isHighlighted, profiles = [] }: TaskCardProps) => {
    const handleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleStatus(task);
    };

    return (
        <>
            {dropIndicator?.taskId === task.id && dropIndicator.position === 'top' && (
                <div className="mb-3 h-24 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/50 animate-pulse pointer-events-none" />
            )}

            <div
                id={`task-${task.id}`}
                draggable
                onClick={() => onEdit(task)}
                onDragStart={(e) => {
                    e.stopPropagation();
                    onDragStart(e, task.id, task.status);
                }}
                onDragEnd={() => { }}
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
                <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200">
                        Công việc
                    </span>
                </div>

                <div className="flex justify-between items-start mb-2 pointer-events-none">
                    <h4 className="font-medium text-slate-900 text-sm line-clamp-2 leading-snug">{task.title}</h4>
                    <PriorityBadge priority={task.priority} />
                </div>

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

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400 pointer-events-auto">
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

            {dropIndicator?.taskId === task.id && dropIndicator.position === 'bottom' && (
                <div className="mb-3 h-24 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/50 animate-pulse pointer-events-none" />
            )}
        </>
    );
};

const MemoizedTaskCard = React.memo(TaskCard);

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

export default function AdminTasksPage() {
    const { user, session, isLoading: authIsLoading } = useAuth();
    const [tasks, setTasks] = useState<TelesalesTask[]>([]);
    const tasksRef = useRef(tasks);
    useEffect(() => { tasksRef.current = tasks; }, [tasks]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [columns, setColumns] = useState<TelesalesColumn[]>([]);
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isTimeout, setIsTimeout] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 150);
    const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
    const [filterDueDate, setFilterDueDate] = useState<"all" | "overdue" | "today" | "week">("all");
    const [filterCustomerType, setFilterCustomerType] = useState<"all" | "customer" | "personal">("all");
    const [filterType, setFilterType] = useState<TaskType | "all">("all");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);

    const [createModalInitialStatus, setCreateModalInitialStatus] = useState<TaskStatus>("today");
    const [editingTask, setEditingTask] = useState<TelesalesTask | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [taskToLog, setTaskToLog] = useState<TelesalesTask | null>(null);

    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const editInputRef = useRef<HTMLInputElement>(null);

    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ taskId: string; position: 'top' | 'bottom' } | null>(null);
    const [dragOverColId, setDragOverColId] = useState<string | null>(null);

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [activeNotifTab, setActiveNotifTab] = useState<'overdue' | 'today'>('overdue');
    const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

    const handleToggleTaskStatus = async (task: TelesalesTask) => {
        const originalTasks = [...tasks];
        const taskId = task.id;
        const newStatus = task.status === 'done' ? 'today' : 'done';

        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: newStatus as TaskStatus } : t
        ));

        const success = await updateTaskSupabase(taskId, { status: newStatus as TaskStatus });

        if (!success) {
            setTasks(originalTasks);
            alert("Lỗi: Không thể cập nhật trạng thái công việc.");
        }
    };

    const refreshData = useCallback(async (isManual = false) => {
        if (!user) return;
        setIsLoading(prev => tasksRef.current.length === 0 || isManual ? true : prev);
        setIsTimeout(false);
        setFetchError(null);

        // ✅ TIMEOUT PROTECTION (10s)
        const timeoutId = setTimeout(() => {
            if (tasksRef.current.length === 0) {
                console.error('[AdminTasks] ⏰ Loading timeout detected!');
                setIsTimeout(true);
                setIsLoading(false);
            }
        }, 10000);

        try {
            const [fetchedTasks, { data: profileData }] = await Promise.all([
                fetchTasks(user.id, session?.access_token),
                supabase.from('profiles').select('id, full_name, email')
            ]);

            clearTimeout(timeoutId);

            if (profileData) setProfiles(profileData);
            setTasks(fetchedTasks);
            setColumns(loadColumns().sort((a, b) => a.order - b.order));
        } catch (err: any) {
            console.error('[AdminTasks] Fetch failed:', err);
            setFetchError(err.message || 'Lỗi kết nối server');
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
        }
    }, [user, session]);

    const handleLocateTask = (taskId: string) => {
        setIsNotificationOpen(false);
        setViewMode("kanban");

        setTimeout(() => {
            const element = document.getElementById(`task-${taskId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedTaskId(taskId);
                setTimeout(() => setHighlightedTaskId(null), 2000);
            }
        }, 100);
    };

    useEffect(() => {
        if (!user || !isMounted) return;

        console.log('[Tasks Realtime] Initializing subscription');
        let refreshTimeout: NodeJS.Timeout;

        const channel = supabase
            .channel(`tasks-realtime-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'telesales_tasks'
                },
                () => {
                    console.log('[Tasks Realtime] Change detected, refreshing...');
                    clearTimeout(refreshTimeout);
                    refreshTimeout = setTimeout(() => {
                        refreshData();
                    }, 1000); // 1s debounce
                }
            )
            .subscribe();

        return () => {
            console.log('[Tasks Realtime] Cleanup');
            clearTimeout(refreshTimeout);
            supabase.removeChannel(channel);
        };
    }, [user, refreshData, isMounted]);

    useEffect(() => {
        if (user) {
            refreshData();
        } else if (!authIsLoading) {
            setIsLoading(false);
        }

        const handleColumnUpdate = () => setColumns(loadColumns().sort((a, b) => a.order - b.order));
        window.addEventListener("telesales-columns-updated", handleColumnUpdate);

        return () => {
            window.removeEventListener("telesales-columns-updated", handleColumnUpdate);
        };
    }, [user, refreshData, authIsLoading]);

    const handleLogCall = (task: TelesalesTask) => {
        setTaskToLog(task);
        setIsLogModalOpen(true);
    };

    const handleSaveLog = async (logData: any) => {
        if (taskToLog) {
            await addLogSupabase(taskToLog.id, logData);
            setIsLogModalOpen(false);
            setTaskToLog(null);
            refreshData();
        }
    };

    useEffect(() => {
        if (editingColumnId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingColumnId]);

    const openCreateModal = (status: TaskStatus = "today") => {
        setCreateModalInitialStatus(status);
        setEditingTask(null);
        setIsCreateModalOpen(true);
    };

    const handleEditTask = (task: TelesalesTask) => {
        setEditingTask(task);
        setCreateModalInitialStatus(task.status);
        setIsCreateModalOpen(true);
    };

    const handleSaveTask = async (taskData: any) => {
        setIsLoading(true);
        try {
            if (taskData.id) {
                await updateTaskSupabase(taskData.id, taskData, session?.access_token);
            } else {
                await createTaskSupabase(taskData, session?.access_token);
            }
            await refreshData();
            setIsCreateModalOpen(false);
            setIsSimpleModalOpen(false);
        } catch (error: any) {
            console.error("Failed to save task", error);
            alert(`Không thể lưu công việc: ${error?.message || JSON.stringify(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm("Bạn chắc chắn muốn xóa việc này?")) {
            await deleteTaskSupabase(taskId);
            setIsCreateModalOpen(false);
            refreshData();
        }
    };

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

    const handleAddColumn = () => {
        addColumn();
        setColumns(loadColumns());
    };

    const deleteColumnHandler = (id: string, isDefault?: boolean) => {
        if (isDefault && (id === 'inbox' || id === 'done')) {
            alert("Không thể xóa cột mặc định này.");
            return;
        }
        const hasTasks = tasks.some(t => t.status === id);
        if (hasTasks) {
            if (!window.confirm("Cột này đang có việc cần làm. Nếu xóa, các việc này sẽ chuyển về Hộp thư đến. Bạn chắc chắn chứ?")) {
                return;
            }
        } else {
            if (!window.confirm("Bạn có chắc chắn muốn xóa cột này?")) return;
        }
        deleteColumn(id);
        setColumns(loadColumns());
    };

    const toggleColumnVisibility = (colId: string, currentVisible: boolean) => {
        updateColumn(colId, { isVisible: !currentVisible });
        setColumns(loadColumns());
    };

    const startEditing = (col: TelesalesColumn) => {
        setEditingColumnId(col.id);
        setEditingTitle(col.label);
    };

    const saveEditing = (id: string) => {
        const safeTitle = (editingTitle ?? "").trim();
        if (safeTitle) {
            updateColumn(id, { label: safeTitle });
        }
        setEditingColumnId(null);
        setEditingTitle("");
        setColumns(loadColumns());
    };

    const cancelEditing = () => {
        setEditingColumnId(null);
        setEditingTitle("");
    };

    const msToday = new Date().setHours(0, 0, 0, 0);

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = !debouncedSearchQuery ||
            task.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            (task.customer_name && task.customer_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
            (task.phone && task.phone.includes(debouncedSearchQuery));

        const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
        const matchesType = filterType === "all" || task.type === filterType;

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

        let matchesCustomerType = true;
        if (filterCustomerType === "customer") {
            matchesCustomerType = !!(task.customer_name || task.phone);
        } else if (filterCustomerType === "personal") {
            matchesCustomerType = !task.customer_name && !task.phone;
        }

        return matchesSearch && matchesPriority && matchesType && matchesDueDate && matchesCustomerType;
    });

    const visibleColumns = columns.filter(c => c.isVisible !== false);
    const overdueCount = tasks.filter(t => t.due_date && new Date(t.due_date).getTime() < msToday && t.status !== 'done').length;

    if (fetchError || isTimeout) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className={`p-4 rounded-full ${isTimeout ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                    {isTimeout ? <Clock className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">
                        {isTimeout ? '⏰ Tải dữ liệu quá lâu' : '❌ Lỗi tải dữ liệu'}
                    </h3>
                    <p className="text-slate-500 max-w-sm">
                        {isTimeout
                            ? 'Có thể do kết nối mạng yếu hoặc máy chủ đang phản hồi chậm. Bạn vui lòng thử lại nhé.'
                            : `Đã có lỗi xảy ra: ${fetchError}. Vui lòng kiểm tra lại kết nối.`}
                    </p>
                </div>
                <button
                    onClick={() => refreshData(true)}
                    className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-all shadow-md active:scale-95"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span>Thử lại ngay</span>
                </button>
            </div>
        );
    }

    if (isLoading && tasks.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ListTodo className="w-6 h-6 text-primary-600 animate-pulse" />
                    </div>
                </div>
                <div className="text-center">
                    <p className="font-medium text-slate-700">Đang chuẩn bị danh sách...</p>
                    <p className="text-xs text-slate-400">Vui lòng đợi trong giây lát</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col relative" onClick={() => setIsSettingsOpen(false)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-[60] relative">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Việc cần làm</h1>
                    <p className="text-sm text-slate-500">Quản lý các đầu việc và cuộc gọi hằng ngày</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsSimpleModalOpen(true); }}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Việc mới</span>
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsNotificationOpen(true); }}
                        className="relative p-2 bg-white border rounded-lg hover:bg-slate-50 text-slate-600"
                    >
                        <Bell className="w-4 h-4" />
                        {(overdueCount + tasks.filter(t => t.due_date && new Date(t.due_date).setHours(0, 0, 0, 0) === msToday && t.status !== 'done').length) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                                {overdueCount + tasks.filter(t => t.due_date && new Date(t.due_date).setHours(0, 0, 0, 0) === msToday && t.status !== 'done').length}
                            </span>
                        )}
                    </button>

                    {isNotificationOpen && (
                        <>
                            <div
                                className="fixed inset-0 bg-black/20 z-[9990]"
                                onClick={() => setIsNotificationOpen(false)}
                            />
                            <div className="fixed top-0 right-0 h-full w-[320px] bg-white shadow-2xl z-[9999] flex flex-col animate-in slide-in-from-right duration-200">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <Bell className="w-4 h-4" /> Thông báo
                                    </h3>
                                    <button onClick={() => setIsNotificationOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                                </div>
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
                                        Hôm nay <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{tasks.filter(t => t.due_date && new Date(t.due_date).setHours(0, 0, 0, 0) === msToday && t.status !== 'done').length}</span>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                                    {(() => {
                                        const list = activeNotifTab === 'overdue'
                                            ? tasks.filter(t => t.due_date && new Date(t.due_date).getTime() < msToday && t.status !== 'done')
                                            : tasks.filter(t => t.due_date && new Date(t.due_date).setHours(0, 0, 0, 0) === msToday && t.status !== 'done');

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
                                        onClick={() => {
                                            resetColumns();
                                            setColumns(loadColumns());
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
                </div>
            </div>

            {viewMode === "kanban" ? (
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-[100%] h-full items-start">
                        {visibleColumns.length > 0 && visibleColumns.map(col => {
                            const columnTasks = filteredTasks.filter(t => t.status === col.id)
                                .sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

                            const showAppendPlaceholder = draggedTaskId && dragOverColId === col.id && !dropIndicator;

                            return (
                                <div
                                    key={col.id}
                                    draggable={!editingColumnId}
                                    onDragStart={(e) => handleColumnDragStart(e, col.id)}
                                    onDragEnd={handleColumnDragEnd}
                                    onDragOver={(e) => handleDragOverColumn(e, col.id)}
                                    onDrop={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        const draggedTaskIdData = e.dataTransfer.getData("telesales/task");
                                        const draggedColId = e.dataTransfer.getData("telesales/column");

                                        setDraggedTaskId(null);
                                        setDropIndicator(null);
                                        setDragOverColId(null);

                                        if (draggedTaskIdData) {
                                            const currentTasks = [...tasks];
                                            const task = currentTasks.find(t => t.id === draggedTaskIdData);
                                            if (!task) return;

                                            let newStatus = col.id;
                                            let newDueDate: string | null = task.due_date || null;
                                            const today = new Date();

                                            if (col.id === 'inbox') {
                                                newDueDate = null;
                                            } else if (col.id === 'today') {
                                                newDueDate = today.toISOString();
                                            } else if (col.id === 'tomorrow') {
                                                const tmr = new Date(today);
                                                tmr.setDate(tmr.getDate() + 1);
                                                newDueDate = tmr.toISOString();
                                            } else if (col.id === 'this_week') {
                                                const next = new Date(today);
                                                next.setDate(next.getDate() + 3);
                                                newDueDate = next.toISOString();
                                            } else if (col.id === 'later') {
                                                const later = new Date(today);
                                                later.setDate(later.getDate() + 7);
                                                newDueDate = later.toISOString();
                                            }

                                            const updatedTask = { ...task, status: newStatus as TaskStatus, due_date: newDueDate as string };
                                            setTasks(currentTasks.map(t => t.id === task.id ? updatedTask : t));

                                            await updateTaskSupabase(task.id, { status: newStatus as TaskStatus, due_date: newDueDate as any });
                                            refreshData();
                                        }

                                        if (draggedColId && draggedColId !== col.id) {
                                            const currentCols = [...columns];
                                            const sourceIndex = currentCols.findIndex(c => c.id === draggedColId);
                                            const targetIndex = currentCols.findIndex(c => c.id === col.id);
                                            if (sourceIndex >= 0 && targetIndex >= 0) {
                                                const [movedCol] = currentCols.splice(sourceIndex, 1);
                                                currentCols.splice(targetIndex, 0, movedCol);
                                                setColumns(currentCols);
                                                reorderColumns(currentCols);
                                            }
                                        }
                                    }}
                                    className={`flex-1 min-w-[280px] bg-slate-50/50 rounded-xl flex flex-col max-h-[calc(100vh-280px)] group/col border-2 transition-colors 
                                        ${dragOverColId === col.id ? 'border-primary-300 bg-primary-50/20' : 'border-transparent hover:border-slate-200'}
                                    `}
                                >
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
                                                        {columnTasks.length}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

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
                                                onClick={() => openCreateModal(col.id as TaskStatus)}
                                                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded ml-1"
                                                title="Thêm việc"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-2 flex-1 overflow-y-auto space-y-1 relative min-h-[100px]">
                                        {columnTasks.length === 0 && !showAppendPlaceholder ? (
                                            <div className="text-center py-12 text-slate-400">
                                                <div className="text-4xl mb-2">📝</div>
                                                <p className="text-sm font-medium text-slate-500">Chưa có việc nào</p>
                                                <p className="text-xs mt-1">Kéo thả hoặc click + để thêm</p>
                                            </div>
                                        ) : (
                                            columnTasks.map(task => {
                                                const isOverdue = task.due_date ? new Date(task.due_date).getTime() < msToday && task.status !== 'done' : false;
                                                return (
                                                    <TaskCard
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
                                                        isOverdue={isOverdue}
                                                        isHighlighted={highlightedTaskId === task.id}
                                                        profiles={profiles}
                                                    />
                                                )
                                            })
                                        )}

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
                    <p className="text-slate-500">Chế độ xem danh sách chưa được cập nhật đầy đủ (Sử dụng Kanban để có trải nghiệm tốt nhất).</p>
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

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                initialStatus={createModalInitialStatus}
                initialData={editingTask || undefined}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleSaveTask}
                onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : undefined}
            />

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

            <TaskSimpleModal
                isOpen={isSimpleModalOpen}
                onClose={() => setIsSimpleModalOpen(false)}
                onSave={handleSaveTask}
                currentUser={user}
            />
        </div>
    );
}
