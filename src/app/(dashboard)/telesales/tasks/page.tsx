"use client";

import React, { useState, useEffect, useRef } from "react";
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
    EyeOff
} from "lucide-react";
import {
    TelesalesTask,
    TaskStatus,
    TaskPriority,
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
    updateTasksOrder
} from "@/lib/telesalesTasksStore";
import { CreateTaskModal } from "@/components/telesales/CreateTaskModal";

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
    onDragStart: (e: React.DragEvent, id: string, colId: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDragLeave: () => void;
    dropIndicator: { taskId: string; position: 'top' | 'bottom' } | null;
    onDrop: (e: React.DragEvent, targetTaskId: string) => void;
}

const TaskCard = ({ task, onDragStart, onDragOver, onDragLeave, dropIndicator, onDrop }: TaskCardProps) => {
    return (
        <div
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
            onDragLeave={onDragLeave}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDrop(e, task.id);
            }}
            className="relative bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-move hover:shadow-md transition-shadow mb-3 active:cursor-grabbing group/card"
        >
            {/* Drop Indicators */}
            {dropIndicator?.taskId === task.id && dropIndicator.position === 'top' && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full z-10 -mt-1.5" />
            )}
            {dropIndicator?.taskId === task.id && dropIndicator.position === 'bottom' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full z-10 -mb-1.5" />
            )}

            <div className="flex justify-between items-start mb-2 pointer-events-none">
                <h4 className="font-medium text-slate-900 text-sm line-clamp-2">{task.title}</h4>
                <PriorityBadge priority={task.priority} />
            </div>

            {(task.customerName || task.phone) && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 pointer-events-none">
                    <User className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{task.customerName || "Khách lẻ"}</span>
                    {task.phone && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <Phone className="w-3 h-3" />
                            <span>{task.phone}</span>
                        </>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400 pointer-events-none">
                <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không thời hạn'}</span>
                </div>
                {task.type === 'confirm_order' && <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">Đơn hàng</span>}
                {task.type === 'call_new_lead' && <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Lead mới</span>}
            </div>
        </div>
    );
};

// --- Main Page ---

export default function TelesalesTasksPage() {
    const [tasks, setTasks] = useState<TelesalesTask[]>([]);
    const [columns, setColumns] = useState<TelesalesColumn[]>([]);
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalInitialStatus, setCreateModalInitialStatus] = useState<TaskStatus>("today");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Inline editing states
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const editInputRef = useRef<HTMLInputElement>(null);

    // DnD States
    const [dropIndicator, setDropIndicator] = useState<{ taskId: string; position: 'top' | 'bottom' } | null>(null);

    // Initial Load & Listeners
    const refreshData = () => {
        setTasks(getMyTasks().sort((a, b) => (a.order || 0) - (b.order || 0)));
        setColumns(loadColumns().sort((a, b) => a.order - b.order));
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

    const handleTaskDragStart = (e: React.DragEvent, id: string, colId: string) => {
        e.dataTransfer.setData("telesales/task", id);
        e.dataTransfer.setData("telesales/sourceColumn", colId);
        e.dataTransfer.effectAllowed = "move";
        if (e.target instanceof HTMLElement) {
            e.target.style.opacity = '0.5';
        }
    };

    const handleColumnDragStart = (e: React.DragEvent, colId: string) => {
        if (editingColumnId) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("telesales/column", colId);
        e.dataTransfer.effectAllowed = "move";
        if (e.target instanceof HTMLElement) {
            e.target.style.opacity = '0.5';
        }
    };

    const handleColumnDragEnd = (e: React.DragEvent) => {
        if (e.target instanceof HTMLElement) {
            e.target.style.opacity = '1';
        }
        setDropIndicator(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleTaskDragOver = (e: React.DragEvent, targetTaskId: string) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const position = y < rect.height / 2 ? 'top' : 'bottom';
        setDropIndicator({ taskId: targetTaskId, position });
    };

    const handleTaskDragLeave = () => {
        setDropIndicator(null);
    };

    const handleDrop = (e: React.DragEvent, targetColId: string, targetTaskId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDropIndicator(null);

        const draggedTaskId = e.dataTransfer.getData("telesales/task");
        const draggedColId = e.dataTransfer.getData("telesales/column");

        // 1. Handle Task Drop
        if (draggedTaskId) {
            const currentTasks = [...tasks];
            const draggedTaskIndex = currentTasks.findIndex(t => t.id === draggedTaskId);

            if (draggedTaskIndex > -1) {
                const draggedTask = currentTasks[draggedTaskIndex];
                const updatedTask = { ...draggedTask, status: targetColId };

                // Remove from old position
                currentTasks.splice(draggedTaskIndex, 1);

                const targetColumnTasks = currentTasks.filter(t => t.status === targetColId).sort((a, b) => (a.order || 0) - (b.order || 0));

                if (targetTaskId) {
                    const targetTaskIndex = targetColumnTasks.findIndex(t => t.id === targetTaskId);
                    if (targetTaskIndex > -1) {
                        // Based on dropIndicator position
                        // If we don't have indicator state here in drop (react state), we rely on same logic or simple assumption.
                        // Actually React state `dropIndicator` might be null here if dragLeave fired? 
                        // But usually Drop happens, then DragEnd.
                        // Ideally we pass position param from TaskBoard but simpler is to re-calculate or assume 'top' if not strict.
                        // However, we added logic in TaskDragOver to set indicator. 
                        // We can't easily access that specific instance state inside this global handler unless we store `dropIndicator` in global state. 
                        // Which we do: `dropIndicator` state is at Page level!

                        const pos = dropIndicator?.position || 'top';

                        if (pos === 'top') {
                            targetColumnTasks.splice(targetTaskIndex, 0, updatedTask);
                        } else {
                            targetColumnTasks.splice(targetTaskIndex + 1, 0, updatedTask);
                        }
                    } else {
                        targetColumnTasks.push(updatedTask);
                    }
                } else {
                    // Dropped on empty space
                    targetColumnTasks.push(updatedTask);
                }

                // Recalculate orders
                targetColumnTasks.forEach((t, idx) => t.order = idx);

                const otherTasks = currentTasks.filter(t => t.status !== targetColId);
                const newTaskList = [...otherTasks, ...targetColumnTasks];

                setTasks(newTaskList);
                updateTasksOrder(newTaskList);
            }
            return;
        }

        // 2. Handle Column Drop
        if (draggedColId && draggedColId !== targetColId && !targetTaskId) {
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
        // Check if has tasks
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

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone?.includes(searchQuery)
    );

    const openCreateModal = (status: TaskStatus = "today") => {
        setCreateModalInitialStatus(status);
        setIsCreateModalOpen(true);
    };

    const getColumnLabel = (status: string) => {
        const col = columns.find(c => c.id === status);
        return col ? col.label : status;
    };

    const visibleColumns = columns.filter(c => c.isVisible !== false);

    return (
        <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Việc cần làm Telesales</h1>
                    <p className="text-sm text-slate-500">Quản lý các đầu việc và cuộc gọi hằng ngày</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openCreateModal("today")}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Việc mới</span>
                    </button>

                    {/* Settings Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="bg-white border p-2 rounded-lg hover:bg-slate-50 text-slate-600"
                            title="Cài đặt cột"
                        >
                            <Settings className="w-4 h-4" />
                        </button>

                        {isSettingsOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsSettingsOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-20">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase px-2 py-1 mb-1">Hiển thị cột</h4>
                                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                                        {columns.map(col => (
                                            <div key={col.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded text-sm text-slate-700">
                                                <span>{col.label}</span>
                                                <button
                                                    onClick={() => toggleColumnVisibility(col.id, col.isVisible !== false)}
                                                    className="text-slate-400 hover:text-primary-600"
                                                >
                                                    {col.isVisible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-slate-100 my-2 pt-2">
                                        <button
                                            onClick={() => { handleAddColumn(); setIsSettingsOpen(false); }}
                                            className="w-full flex items-center justify-center gap-2 text-sm text-primary-600 hover:bg-primary-50 py-1.5 rounded"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Thêm cột mới
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="bg-white border p-1 rounded-lg flex">
                        <button
                            onClick={() => setViewMode("kanban")}
                            className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên việc, khách hàng, SĐT..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {viewMode === "kanban" ? (
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-[100%] h-full items-start">
                        {visibleColumns.length > 0 && visibleColumns.map(col => {
                            const columnTasks = filteredTasks.filter(t => t.status === col.id).sort((a, b) => (a.order || 0) - (b.order || 0));
                            return (
                                <div
                                    key={col.id}
                                    draggable={!editingColumnId}
                                    onDragStart={(e) => handleColumnDragStart(e, col.id)}
                                    onDragEnd={handleColumnDragEnd}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                    className="flex-1 min-w-[280px] bg-slate-50 rounded-xl flex flex-col max-h-[calc(100vh-250px)] group/col border border-transparent hover:border-slate-200/50 transition-colors"
                                >
                                    {/* Column Header */}
                                    <div className="p-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-slate-50 rounded-t-xl z-20 cursor-grab active:cursor-grabbing">
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
                                    <div className="p-2 flex-1 overflow-y-auto space-y-2">
                                        {columnTasks.map(task => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                onDragStart={handleTaskDragStart}
                                                onDragOver={handleTaskDragOver}
                                                onDragLeave={handleTaskDragLeave}
                                                dropIndicator={dropIndicator}
                                                onDrop={(e, targetTaskId) => handleDrop(e, col.id, targetTaskId)}
                                            />
                                        ))}
                                        {columnTasks.length === 0 && (
                                            <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs select-none">
                                                Kéo thả hoặc tạo mới
                                            </div>
                                        )}
                                        {/* Spacer for dropping at bottom */}
                                        <div
                                            className="h-8 -mt-2 opacity-0 hover:opacity-100 transition-opacity border-b-2 border-transparent hover:border-blue-400"
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, col.id)}
                                        />
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
        </div>
    );
}
