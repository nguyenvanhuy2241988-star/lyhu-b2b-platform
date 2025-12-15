"use client";

import React, { useState, useEffect, useRef } from "react";

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
    AlertTriangle
} from "lucide-react";
import {
    TelesalesTask,
    TaskStatus,
    TaskPriority,
    TaskType,
    TASK_PRIORITY_LABELS,
    getMyTasks,
    updateTask,
    addTask,
    loadColumns,
    TelesalesColumn,
    addColumn,
    deleteColumn,
    updateColumn,
    reorderColumns,
    updateTasksOrder,
    resetColumns,
    addLog,
    CallLog
} from "@/lib/telesalesTasksStore";
import { CreateTaskModal } from "@/components/telesales/CreateTaskModal";
import { LogCallModal } from "@/components/telesales/LogCallModal";

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

interface TaskCardProps {
    task: TelesalesTask;
    isDragging: boolean;
    onDragStart: (e: React.DragEvent, id: string, colId: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    dropIndicator: { taskId: string; position: 'top' | 'bottom' } | null;
    onLogCall: (task: TelesalesTask) => void;
    isOverdue?: boolean;
    isHighlighted?: boolean;
}

const TaskCard = ({ task, isDragging, onDragStart, onDragOver, dropIndicator, onLogCall, isOverdue, isHighlighted }: TaskCardProps) => {
    return (
        <>
            {/* Ghost Placeholder Top */}
            {dropIndicator?.taskId === task.id && dropIndicator.position === 'top' && (
                <div className="mb-3 h-24 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/50 animate-pulse pointer-events-none" />
            )}

            <div
                id={`task-${task.id}`}
                draggable
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
                            ? 'border-yellow-400 ring-2 ring-yellow-400 shadow-md scale-[1.02] z-10' // Highlight style
                            : isOverdue
                                ? 'border-red-300 ring-1 ring-red-100 hover:shadow-md hover:border-red-400'
                                : 'border-slate-200 hover:shadow-md hover:border-primary-200'
                    }
                    ${isDragging ? '' : 'active:cursor-grabbing'}
                `}
            >
                <div className="flex justify-between items-start mb-2 pointer-events-none">
                    <h4 className="font-medium text-slate-900 text-sm line-clamp-2">{task.title}</h4>
                    <PriorityBadge priority={task.priority} />
                </div>

                {(task.customerName || task.phone) && (
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2 pointer-events-auto relative z-10">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <User className="w-3 h-3 flex-shrink-0" />
                            {task.leadId ? (
                                <Link
                                    href={`/telesales/leads-queue/${task.leadId}`}
                                    className="truncate hover:text-primary-600 hover:underline font-medium"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {task.customerName || "Khách lẻ"}
                                </Link>
                            ) : (
                                <span className="truncate">{task.customerName || "Khách lẻ"}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {task.phone && (
                                <span className="text-slate-400 mr-1">{task.phone}</span>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLogCall(task);
                                }}
                                className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                                title="Ghi log cuộc gọi"
                            >
                                <Phone className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400 pointer-events-none">
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                        {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không thời hạn'}</span>
                    </div>
                    {task.type === 'confirm_order' && <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">Đơn hàng</span>}
                    {task.type === 'call_new_lead' && <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Lead mới</span>}
                </div>
            </div>

            {/* Ghost Placeholder Bottom */}
            {dropIndicator?.taskId === task.id && dropIndicator.position === 'bottom' && (
                <div className="mb-3 h-24 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/50 animate-pulse pointer-events-none" />
            )}
        </>
    );
};

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
    const [tasks, setTasks] = useState<TelesalesTask[]>([]);
    const [columns, setColumns] = useState<TelesalesColumn[]>([]);
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
    const [filterType, setFilterType] = useState<TaskType | "all">("all");

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalInitialStatus, setCreateModalInitialStatus] = useState<TaskStatus>("today");
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

    // Initial Load & Listeners
    const refreshData = () => {
        setTasks(getMyTasks().sort((a, b) => (a.order || 0) - (b.order || 0)));
        setColumns(loadColumns().sort((a, b) => a.order - b.order));
    };

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
        refreshData();
        const handleTaskUpdate = () => setTasks(getMyTasks().sort((a, b) => (a.order || 0) - (b.order || 0)));
        const handleColumnUpdate = () => setColumns(loadColumns().sort((a, b) => a.order - b.order));

        window.addEventListener("telesales-tasks-updated", handleTaskUpdate);
        window.addEventListener("telesales-columns-updated", handleColumnUpdate);
        return () => {
            window.removeEventListener("telesales-tasks-updated", handleTaskUpdate);
            window.removeEventListener("telesales-columns-updated", handleColumnUpdate);
        };
    }, []);

    const handleLogCall = (task: TelesalesTask) => {
        setTaskToLog(task);
        setIsLogModalOpen(true);
    };

    const handleSaveLog = (logData: any) => {
        if (taskToLog) {
            addLog(taskToLog.id, logData);
            // Optionally move task to "done" or update visible status - for now just log
        }
    };

    // Focus input when editing starts
    useEffect(() => {
        if (editingColumnId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingColumnId]);

    const handleAddTask = (taskData: any) => {
        addTask(taskData);
    };

    // --- Drag & Drop Logic ---
    // (Kept as is, omitted for brevity if no changes needed, but since I am overwriting file I must include it)

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

    const handleDrop = (e: React.DragEvent, targetColId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const draggedTaskIdData = e.dataTransfer.getData("telesales/task");
        const draggedColId = e.dataTransfer.getData("telesales/column");

        setDraggedTaskId(null);
        setDropIndicator(null);
        setDragOverColId(null);

        // 1. Handle Task Drop
        if (draggedTaskIdData) {
            const currentTasks = [...tasks];
            const draggedTaskIndex = currentTasks.findIndex(t => t.id === draggedTaskIdData);

            if (draggedTaskIndex > -1) {
                const draggedTask = currentTasks[draggedTaskIndex];
                const updatedTask = { ...draggedTask, status: targetColId };

                currentTasks.splice(draggedTaskIndex, 1);

                const targetColumnTasks = currentTasks.filter(t => t.status === targetColId).sort((a, b) => (a.order || 0) - (b.order || 0));

                if (dropIndicator) {
                    const targetTaskIndex = targetColumnTasks.findIndex(t => t.id === dropIndicator.taskId);
                    if (targetTaskIndex > -1) {
                        if (dropIndicator.position === 'top') {
                            targetColumnTasks.splice(targetTaskIndex, 0, updatedTask);
                        } else {
                            targetColumnTasks.splice(targetTaskIndex + 1, 0, updatedTask);
                        }
                    } else {
                        targetColumnTasks.push(updatedTask);
                    }
                } else {
                    targetColumnTasks.push(updatedTask);
                }

                targetColumnTasks.forEach((t, idx) => t.order = idx);

                const otherTasks = currentTasks.filter(t => t.status !== targetColId);
                const newTaskList = [...otherTasks, ...targetColumnTasks];

                setTasks(newTaskList);
                updateTasksOrder(newTaskList);
            }
            return;
        }

        // 2. Handle Column Drop
        if (draggedColId && draggedColId !== targetColId) {
            const currentCols = [...columns];
            const sourceIndex = currentCols.findIndex(c => c.id === draggedColId);
            const targetIndex = currentCols.findIndex(c => c.id === targetColId);

            if (sourceIndex >= 0 && targetIndex >= 0) {
                const [movedCol] = currentCols.splice(sourceIndex, 1);
                currentCols.splice(targetIndex, 0, movedCol);

                setColumns(currentCols);
                reorderColumns(currentCols);
            }
        }
    };

    // --- Column Management ---

    const handleAddColumn = () => {
        addColumn();
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
    };

    const toggleColumnVisibility = (colId: string, currentVisible: boolean) => {
        updateColumn(colId, { isVisible: !currentVisible });
    };

    const startEditing = (col: TelesalesColumn) => {
        setEditingColumnId(col.id);
        setEditingTitle(col.label);
    };

    const saveEditing = (id: string) => {
        if (editingTitle.trim()) {
            updateColumn(id, { label: editingTitle.trim() });
        }
        setEditingColumnId(null);
        setEditingTitle("");
    };

    const cancelEditing = () => {
        setEditingColumnId(null);
        setEditingTitle("");
    };

    // --- Render Helpers ---

    const filteredTasks = tasks.filter(t => {
        // 1. Search Query (Debounced)
        const matchSearch =
            t.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            t.customerName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            t.phone?.includes(debouncedSearchQuery);

        // 2. Priority Filter
        const matchPriority = filterPriority === "all" || t.priority === filterPriority;

        // 3. Type Filter
        const matchType = filterType === "all" || t.type === filterType;

        return matchSearch && matchPriority && matchType;
    });

    const openCreateModal = (status: TaskStatus = "today") => {
        setCreateModalInitialStatus(status);
        setIsCreateModalOpen(true);
    };

    const getColumnLabel = (status: string) => {
        const col = columns.find(c => c.id === status);
        return col ? col.label : status;
    };

    const visibleColumns = columns.filter(c => c.isVisible !== false);

    // Calc overdue
    const msToday = new Date().setHours(0, 0, 0, 0);
    const overdueCount = tasks.filter(t => t.dueDate && new Date(t.dueDate).getTime() < msToday && t.status !== 'done').length;

    return (
        <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col relative" onClick={() => setIsSettingsOpen(false)}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-[60] relative">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Việc cần làm Telesales</h1>
                    <p className="text-sm text-slate-500">Quản lý các đầu việc và cuộc gọi hằng ngày</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); openCreateModal("today"); }}
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
                        {(overdueCount + tasks.filter(t => t.dueDate && new Date(t.dueDate).setHours(0, 0, 0, 0) === msToday && t.status !== 'done').length) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                                {overdueCount + tasks.filter(t => t.dueDate && new Date(t.dueDate).setHours(0, 0, 0, 0) === msToday && t.status !== 'done').length}
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
                                        Hôm nay <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{tasks.filter(t => t.dueDate && new Date(t.dueDate).setHours(0, 0, 0, 0) === msToday && t.status !== 'done').length}</span>
                                    </button>
                                </div>
                                {/* List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                                    {(() => {
                                        const list = activeNotifTab === 'overdue'
                                            ? tasks.filter(t => t.dueDate && new Date(t.dueDate).getTime() < msToday && t.status !== 'done')
                                            : tasks.filter(t => t.dueDate && new Date(t.dueDate).setHours(0, 0, 0, 0) === msToday && t.status !== 'done');

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
                                                    <PriorityBadge priority={t.priority} />
                                                </div>
                                                <div className="text-xs text-slate-500 mb-2">{t.customerName || "Khách lẻ"}</div>
                                                <div className={`text-xs font-medium flex items-center gap-1 ${activeNotifTab === 'overdue' ? 'text-red-600' : 'text-blue-600'}`}>
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(t.dueDate!).toLocaleDateString('vi-VN')}
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
                                        onClick={() => {
                                            resetColumns();
                                            setColumns(loadColumns()); // Reload immediately
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

                    <div className="flex items-center gap-2 min-w-[180px]">
                        <select
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as TaskType | "all")}
                        >
                            <option value="all">Tất cả loại việc</option>
                            <option value="call_new_lead">Gọi Lead mới</option>
                            <option value="follow_up_lead">Chăm sóc lại</option>
                            <option value="confirm_order">Xác nhận đơn</option>
                            <option value="care_old_customer">CSKH cũ</option>
                            <option value="other">Việc khác</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            {viewMode === "kanban" ? (
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-[100%] h-full items-start">
                        {visibleColumns.length > 0 && visibleColumns.map(col => {
                            const columnTasks = filteredTasks.filter(t => t.status === col.id).sort((a, b) => (a.order || 0) - (b.order || 0));

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
                                                        {columnTasks.length}
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
                                                onClick={() => openCreateModal(col.id)}
                                                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded ml-1"
                                                title="Thêm việc"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tasks Container */}
                                    <div className="p-2 flex-1 overflow-y-auto space-y-1 relative min-h-[100px]">
                                        {columnTasks.map(task => {
                                            const isOverdue = task.dueDate ? new Date(task.dueDate).getTime() < msToday && task.status !== 'done' : false;
                                            return (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    isDragging={draggedTaskId === task.id}
                                                    onDragStart={handleTaskDragStart}
                                                    onDragOver={handleTaskDragOver}
                                                    dropIndicator={dropIndicator}
                                                    onLogCall={handleLogCall}
                                                    isOverdue={isOverdue}
                                                    isHighlighted={highlightedTaskId === task.id}
                                                />
                                            )
                                        })}

                                        {/* Append Placeholder - shown when dragging column over empty space or bottom */}
                                        {showAppendPlaceholder && (
                                            <div className="h-24 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/50 animate-pulse mt-1 pointer-events-none" />
                                        )}

                                        {columnTasks.length === 0 && !showAppendPlaceholder && (
                                            <div className="h-full min-h-[80px] flex items-center justify-center text-slate-400 text-xs select-none italic">
                                                Thả thẻ vào đây
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add Column Button */}
                        <button
                            onClick={handleAddColumn}
                            className="flex-shrink-0 w-[280px] h-[50px] border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:border-primary-500 hover:text-primary-600 transition-all hover:bg-white"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-medium">Thêm cột</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">Công việc</th>
                                <th className="px-4 py-3">Khách hàng</th>
                                <th className="px-4 py-3">Hạn chót</th>
                                <th className="px-4 py-3">Ưu tiên</th>
                                <th className="px-4 py-3">Trạng thái</th>
                                <th className="px-4 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTasks.map(task => (
                                <tr key={task.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{task.title}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span>{task.customerName || "-"}</span>
                                            <span className="text-xs text-slate-500">{task.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{task.dueDate || "-"}</td>
                                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                            {getColumnLabel(task.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button className="text-primary-600 hover:text-primary-700 font-medium text-xs">Sửa</button>
                                    </td>
                                </tr>
                            ))}
                            {filteredTasks.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                        Không tìm thấy công việc nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleAddTask}
                initialStatus={createModalInitialStatus}
                columns={columns} // Pass dynamic columns
            />

            <LogCallModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                onSave={handleSaveLog}
                taskTitle={taskToLog?.title || ""}
                customerName={taskToLog?.customerName || ""}
            />
        </div>
    );
}
