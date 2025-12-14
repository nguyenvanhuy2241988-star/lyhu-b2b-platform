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
    MoreHorizontal,
    Flag,
    ClipboardList,
    Filter,
    X,
    MessageSquare,
    CheckCircle2,
    Clock
} from "lucide-react";
import {
    TelesalesTask,
    TaskStatus,
    TaskPriority,
    TaskType,
    TASK_STATUS_LABELS,
    TASK_PRIORITY_LABELS,
    getMyTasks,
    updateTask,
    addTask,
    deleteTask,
    loadTasks // Initial load only
} from "@/lib/telesalesTasksStore";
import { getCurrentUser } from "@/lib/auth";

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

const TaskCard = ({ task, onDragStart }: { task: TelesalesTask; onDragStart: (e: React.DragEvent, id: string) => void }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-move hover:shadow-md transition-shadow mb-3"
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-slate-900 text-sm line-clamp-2">{task.title}</h4>
                <PriorityBadge priority={task.priority} />
            </div>

            {(task.customerName || task.phone) && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
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

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
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

// --- Modals ---


// --- Main Page ---

import { CreateTaskModal } from "@/components/telesales/CreateTaskModal";

export default function TelesalesTasksPage() {
    const [tasks, setTasks] = useState<TelesalesTask[]>([]);
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalInitialStatus, setCreateModalInitialStatus] = useState<TaskStatus>("today");

    // Load initial data
    useEffect(() => {
        const loadedTasks = getMyTasks();
        setTasks(loadedTasks);

        // Listen for updates from other tabs/leads page
        const handleUpdate = () => {
            setTasks(getMyTasks());
        }
        window.addEventListener("telesales-tasks-updated", handleUpdate);
        return () => window.removeEventListener("telesales-tasks-updated", handleUpdate);
    }, []);

    const handleAddTask = (taskData: any) => {
        addTask(taskData);
        setTasks(getMyTasks()); // Refresh
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("taskId", id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Allow drop
    };

    const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) {
            updateTask(taskId, { status: newStatus });
            setTasks(getMyTasks()); // Refresh UI immediately
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone?.includes(searchQuery)
    );

    const openCreateModal = (status: TaskStatus = "today") => {
        setCreateModalInitialStatus(status);
        setIsCreateModalOpen(true);
    };

    const columns: TaskStatus[] = ["inbox", "today", "tomorrow", "this_week", "later", "done"];

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
                {/* Add filters if needed later */}
            </div>

            {/* Content */}
            {viewMode === "kanban" ? (
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-[1200px] h-full">
                        {columns.map(status => {
                            const columnTasks = filteredTasks.filter(t => t.status === status);
                            return (
                                <div
                                    key={status}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, status)}
                                    className="flex-1 min-w-[280px] bg-slate-50 rounded-xl flex flex-col h-full max-h-[calc(100vh-250px)]"
                                >
                                    {/* Column Header */}
                                    <div className="p-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-slate-50 rounded-t-xl z-10">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-slate-700 text-sm uppercase">{TASK_STATUS_LABELS[status]}</h3>
                                            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                                {columnTasks.length}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => openCreateModal(status)}
                                            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Tasks Container */}
                                    <div className="p-2 flex-1 overflow-y-auto space-y-2">
                                        {columnTasks.map(task => (
                                            <TaskCard key={task.id} task={task} onDragStart={handleDragStart} />
                                        ))}
                                        {columnTasks.length === 0 && (
                                            <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                                                Kéo thả hoặc tạo mới
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
                                            {TASK_STATUS_LABELS[task.status]}
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
            />
        </div>
    );
}
