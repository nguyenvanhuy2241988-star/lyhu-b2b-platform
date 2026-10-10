"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
    isPlacementColumn,
    extractTaskMetadata,
    SubtaskItem,
    TASK_DEPARTMENTS,
    resolveDepartmentConfig,
    getDefaultDepartmentForContext
} from "@/lib/telesalesTasksStore";

// --- Standard Fixed 6 Columns Specification ---
const STANDARD_COLUMN_SPECS = [
    { type: 'system_inbox', label: 'Hộp thư đến', position: 0, defaultId: 'inbox' },
    { type: 'date_today', label: 'Hôm nay', position: 10, defaultId: 'today' },
    { type: 'date_this_week', label: 'Tuần này', position: 20, defaultId: 'this_week' },
    { type: 'date_this_month', label: 'Tháng này', position: 30, defaultId: 'this_month' },
    { type: 'date_overdue', label: 'Quá hạn', position: 40, defaultId: 'overdue' },
    { type: 'system_done', label: 'Hoàn thành', position: 50, defaultId: 'done' },
] as const;

function standardizeColumns(fetchedDbCols: DbColumn[] = [], userId?: string): { standardizedDbCols: DbColumn[]; standardizedUiCols: (TelesalesColumn & { column_type?: string })[] } {
    const standardizedDbCols: DbColumn[] = [];
    const standardizedUiCols: (TelesalesColumn & { column_type?: string })[] = [];

    for (const spec of STANDARD_COLUMN_SPECS) {
        let match = (fetchedDbCols || []).find(c => c.column_type === spec.type);
        if (!match) {
            if (spec.type === 'system_inbox') {
                match = (fetchedDbCols || []).find(c => c.column_type === 'system_inbox' || c.label.toLowerCase().includes('hộp thư'));
            } else if (spec.type === 'system_done') {
                match = (fetchedDbCols || []).find(c => c.column_type === 'system_done' || c.label.toLowerCase().includes('hoàn') || c.label.toLowerCase().includes('xong'));
            } else if (spec.type === 'date_today') {
                match = (fetchedDbCols || []).find(c => c.column_type === 'date_today' || c.label.toLowerCase().includes('hôm nay'));
            } else if (spec.type === 'date_this_week') {
                match = (fetchedDbCols || []).find(c => c.column_type === 'date_this_week' || c.label.toLowerCase().includes('tuần'));
            } else if (spec.type === 'date_this_month') {
                match = (fetchedDbCols || []).find(c => c.column_type === 'date_this_month' || c.label.toLowerCase().includes('tháng'));
            } else if (spec.type === 'date_overdue') {
                match = (fetchedDbCols || []).find(c => c.column_type === 'date_overdue' || c.label.toLowerCase().includes('quá hạn'));
            }
        }

        const colId = match ? match.id : (userId ? `${userId}_${spec.type}` : spec.defaultId);

        const dbCol: DbColumn = {
            id: colId,
            user_id: match?.user_id || userId || '',
            label: spec.label,
            column_type: spec.type,
            position: spec.position,
            color: match?.color || null,
            is_visible: true,
            created_at: match?.created_at || new Date().toISOString()
        };

        const uiCol: TelesalesColumn & { column_type?: string } = {
            id: colId,
            label: spec.label,
            status: spec.type === 'system_inbox' ? 'inbox' as TaskStatus
                : spec.type === 'system_done' ? 'done' as TaskStatus
                    : spec.defaultId as any,
            order: spec.position,
            isDefault: true,
            isVisible: true,
            column_type: spec.type
        };

        standardizedDbCols.push(dbCol);
        standardizedUiCols.push(uiCol);
    }

    return { standardizedDbCols, standardizedUiCols };
}

function dbColToUiCol(col: DbColumn): TelesalesColumn {
    return {
        id: col.id,
        label: col.label,
        status: col.column_type === 'system_inbox' ? 'inbox' as TaskStatus
            : col.column_type === 'system_done' ? 'done' as TaskStatus
                : col.id as any,
        order: col.position,
        isDefault: true,
        isVisible: true,
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

const StageBadge = ({ stage }: { stage?: string }) => {
    if (!stage) return null;
    const styles: Record<string, string> = {
        not_started: "bg-slate-100 text-slate-600 border-slate-200",
        in_progress: "bg-blue-50 text-blue-700 border-blue-200",
        waiting: "bg-amber-50 text-amber-700 border-amber-200",
        completed: "bg-teal-50 text-teal-700 border-teal-200",
    };
    const labels: Record<string, string> = {
        not_started: "Chưa bắt đầu",
        in_progress: "Đang làm",
        waiting: "Chờ duyệt",
        completed: "Đã xong",
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${styles[stage] || styles.in_progress}`}>
            {labels[stage] || stage}
        </span>
    );
};

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
    role?: string;
}

const DepartmentBadge = ({
    task,
    department,
    profiles = []
}: {
    task: TelesalesTask;
    department?: string;
    profiles?: Profile[];
}) => {
    // 1. If explicit department exists
    const explicitDept = department || (task as any).department;
    if (explicitDept) {
        let finalDept = explicitDept;
        // Correct legacy tasks where department was defaulted to 'telesales' for admin owners
        if (explicitDept === 'telesales' && task.type !== 'deal' && !task.phone) {
            const allInvolvedIds = [task.user_id, task.owner_id, task.assigned_to, ...(task.assignee_ids || [])].filter(Boolean);
            const isAdmin = allInvolvedIds.some(aid => {
                const p = profiles.find((prof: any) => prof.id === aid);
                const r = (p?.role || '').toLowerCase();
                const n = (p?.full_name || '').toLowerCase();
                return r === 'admin' || r === 'super_admin' || n.includes('admin');
            });
            const text = (task.title || '').toLowerCase();
            if (isAdmin && !text.includes('tele') && !text.includes('gọi điện') && !text.includes('cuộc gọi')) {
                finalDept = 'admin';
            }
        }
        const conf = resolveDepartmentConfig(finalDept);
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                <span>{conf.icon}</span>
                <span>{conf.label}</span>
            </span>
        );
    }

    // 2. Special task prefixes
    if (task.title.startsWith('📋 PV:') || task.title.startsWith('PV:') || (task as any).related_type === 'recruitment') {
        const conf = resolveDepartmentConfig('hr');
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                <span>{conf.icon}</span>
                <span>{conf.label}</span>
            </span>
        );
    }

    // 3. CRM Deals
    if (task.type === 'deal' || (task as any).source_type === 'deal') {
        const conf = resolveDepartmentConfig('telesales');
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                <span>{conf.icon}</span>
                <span>{conf.label}</span>
            </span>
        );
    }

    // 4. Assignee / Owner resolution
    const assigneeIds = [task.assigned_to, ...(task.assignee_ids || []), task.owner_id].filter(Boolean);
    for (const aid of assigneeIds) {
        const p = profiles.find((prof: any) => prof.id === aid);
        if (p) {
            const r = (p.role || '').toLowerCase();
            const name = (p.full_name || '').toLowerCase();
            const email = (p.email || '').toLowerCase();

            if (r === 'admin' || r === 'super_admin' || name.includes('admin') || email.includes('admin')) {
                const conf = resolveDepartmentConfig('admin');
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                    </span>
                );
            }

            if (r === 'accountant' || name.includes('toán') || email.includes('toan')) {
                const conf = resolveDepartmentConfig('accountant');
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                    </span>
                );
            }
            if (r === 'recruiter' || r === 'hr' || name.includes('tuyển dụng') || email.includes('tuyendung')) {
                const conf = resolveDepartmentConfig('hr');
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                    </span>
                );
            }
            if (r === 'telesales' || name.includes('telesale')) {
                const conf = resolveDepartmentConfig('telesales');
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                    </span>
                );
            }
            if (r === 'sales_gt' || r === 'sales' || r === 'sale_admin' || name.includes('sales')) {
                const conf = resolveDepartmentConfig('sales');
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                    </span>
                );
            }
            if (r === 'marketing' || r === 'media_creator' || name.includes('marketing')) {
                const conf = resolveDepartmentConfig('marketing');
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                    </span>
                );
            }
            if (r === 'warehouse' || r === 'shipper' || name.includes('kho')) {
                const conf = resolveDepartmentConfig('warehouse');
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                    </span>
                );
            }
            if (r === 'rnd') {
                const conf = resolveDepartmentConfig('rnd');
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                    </span>
                );
            }
        }
    }

    // 5. Keyword Heuristics
    const lowerTitle = (task.title || '').toLowerCase();
    if (lowerTitle.includes('ngân hàng') || lowerTitle.includes('techcombank') || lowerTitle.includes('tp bank') || lowerTitle.includes('tpbank') || lowerTitle.includes('chứng từ') || lowerTitle.includes('sổ') || lowerTitle.includes('hóa đơn') || lowerTitle.includes('thuế')) {
        const conf = resolveDepartmentConfig('accountant');
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                <span>{conf.icon}</span>
                <span>{conf.label}</span>
            </span>
        );
    }
    if (lowerTitle.includes('phỏng vấn') || lowerTitle.includes('ứng viên') || lowerTitle.includes('tuyển dụng')) {
        const conf = resolveDepartmentConfig('hr');
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                <span>{conf.icon}</span>
                <span>{conf.label}</span>
            </span>
        );
    }
    if (lowerTitle.includes('hợp đồng') || lowerTitle.includes('báo giá') || lowerTitle.includes('chốt đơn') || lowerTitle.includes('đại lý') || lowerTitle.includes('npp')) {
        const conf = resolveDepartmentConfig('sales');
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                <span>{conf.icon}</span>
                <span>{conf.label}</span>
            </span>
        );
    }
    if (lowerTitle.includes('video') || lowerTitle.includes('poster') || lowerTitle.includes('chạy ads') || lowerTitle.includes('fanpage')) {
        const conf = resolveDepartmentConfig('marketing');
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                <span>{conf.icon}</span>
                <span>{conf.label}</span>
            </span>
        );
    }
    if (lowerTitle.includes('tồn kho') || lowerTitle.includes('nhập kho') || lowerTitle.includes('xuất kho') || lowerTitle.includes('vận đơn')) {
        const conf = resolveDepartmentConfig('warehouse');
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${conf.badgeBg} ${conf.badgeText} ${conf.badgeBorder}`}>
                <span>{conf.icon}</span>
                <span>{conf.label}</span>
            </span>
        );
    }

    // 6. Default
    const defaultConf = resolveDepartmentConfig('general');
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${defaultConf.badgeBg} ${defaultConf.badgeText} ${defaultConf.badgeBorder}`}>
            <span>{defaultConf.icon}</span>
            <span>{defaultConf.label}</span>
        </span>
    );
};

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

    const meta = extractTaskMetadata(task);
    const completedSubtasks = meta.subtasks.filter(s => s.completed).length;
    const totalSubtasks = meta.subtasks.length;

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
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <DepartmentBadge task={task} department={meta.department} profiles={profiles} />
                        <StageBadge stage={meta.stage} />
                    </div>
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

                {/* Subtasks Progress on Card */}
                {totalSubtasks > 0 && (
                    <div className="mb-2 p-1.5 bg-slate-50 border border-slate-200/80 rounded-md">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-medium text-slate-700 flex items-center gap-1">
                                <CheckSquare className={`w-3 h-3 ${completedSubtasks === totalSubtasks ? 'text-teal-600' : 'text-slate-400'}`} />
                                Tiến độ: {completedSubtasks}/{totalSubtasks} bước
                            </span>
                            <span className={`text-[10px] font-bold ${completedSubtasks === totalSubtasks ? 'text-teal-700' : 'text-slate-500'}`}>
                                {Math.round((completedSubtasks / totalSubtasks) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="bg-[#00AFA9] h-full transition-all duration-300"
                                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                            />
                        </div>
                        {/* Next Pending Step with Step Assignee */}
                        {(() => {
                            const nextPending = meta.subtasks.find(s => !s.completed);
                            if (!nextPending) return null;
                            const stepAssignee = nextPending.assigned_to
                                ? profiles.find(p => p.id === nextPending.assigned_to)
                                : null;
                            const assigneeName = stepAssignee
                                ? (stepAssignee.full_name?.split(' ').pop() || stepAssignee.email?.split('@')[0])
                                : null;
                            return (
                                <div className="mt-1.5 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600 gap-1">
                                    <span className="truncate max-w-[150px] font-medium text-slate-700" title={nextPending.title}>
                                        👉 {nextPending.title}
                                    </span>
                                    {assigneeName ? (
                                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-teal-50 text-teal-700 border border-teal-200 rounded text-[9px] font-medium flex-shrink-0" title={`Phụ trách bước: ${stepAssignee?.full_name || stepAssignee?.email}`}>
                                            <User className="w-2.5 h-2.5" />
                                            {assigneeName}
                                        </span>
                                    ) : (
                                        <span className="text-[9px] text-slate-400 italic flex-shrink-0">Chưa giao</span>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Adaptive Content - Phase B: Show phone if exists, else note snippet */}
                {task.phone ? (
                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-2 pointer-events-auto">
                        <Phone className="w-3 h-3 flex-shrink-0 text-slate-400" />
                        <span className="font-medium">{task.phone}</span>
                        {task.customer_name && (
                            <span className="text-slate-400">• {task.customer_name}</span>
                        )}
                    </div>
                ) : meta.cleanNote ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 italic">
                        <FileText className="w-3 h-3 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{meta.cleanNote}</span>
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

                {/* Attachments Indicator */}
                {task.attachments && task.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {task.attachments.slice(0, 2).map((att: any, i: number) => (
                            <div key={i} className="text-[10px] bg-slate-50 hover:bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1 text-slate-600 truncate max-w-[130px] border border-slate-200">
                                {att.type === 'link' ? <LinkIcon className="w-2.5 h-2.5 flex-shrink-0 text-blue-500" /> : <Paperclip className="w-2.5 h-2.5 flex-shrink-0 text-[#00AFA9]" />}
                                <span className="truncate">{att.name}</span>
                            </div>
                        ))}
                        {task.attachments.length > 2 && (
                            <span className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                +{task.attachments.length - 2}
                            </span>
                        )}
                    </div>
                )}

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

// --- Helper Functions ---
function parseAssigneeIds(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
    if (typeof raw === 'string') {
        let cleaned = raw.trim();
        if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
            cleaned = cleaned.slice(1, -1);
        }
        if (!cleaned) return [];
        return cleaned.split(',').map((id: string) => id.trim().replace(/['"]/g, '')).filter(Boolean);
    }
    return [];
}

function isTaskRelevantToUser(task: any, currentUserId?: string | null): boolean {
    if (!currentUserId || !task) return false;
    if (task.user_id === currentUserId) return true;
    if (task.owner_id === currentUserId) return true;
    if (task.assigned_to === currentUserId) return true;
    if (task.leader_id === currentUserId) return true;
    const aIds = parseAssigneeIds(task.assignee_ids);
    if (aIds.includes(currentUserId)) return true;
    if (task.subtasks && Array.isArray(task.subtasks)) {
        if (task.subtasks.some((st: any) => st.assigned_to === currentUserId)) return true;
    }
    if (task.note && typeof task.note === 'string' && task.note.includes('<!-- TASK_META:')) {
        const meta = extractTaskMetadata(task);
        if (meta.subtasks?.some((st: any) => st.assigned_to === currentUserId)) return true;
    }
    return false;
}

function isColumnDone(col?: { column_type?: string; id?: string; label?: string } | null, colId?: string): boolean {
    if (!col && !colId) return false;
    if (col?.column_type === 'system_done') return true;
    if (col?.id === 'done' || colId === 'done') return true;
    const label = col?.label?.toLowerCase() || '';
    return label.includes('hoàn') || label.includes('xong');
}

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
    const currentUserProfile = profiles.find(p => p.id === user?.id);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const userRole = currentUserProfile?.role || (currentPath.includes('/admin') ? 'admin' : undefined);
    const defaultDepartment = useMemo(() => {
        return getDefaultDepartmentForContext(userRole, currentPath);
    }, [userRole, currentPath]);

    const [columns, setColumns] = useState<(TelesalesColumn & { column_type?: string })[]>(() => {
        const { standardizedUiCols } = standardizeColumns([], undefined);
        return standardizedUiCols;
    });
    const columnsRef = useRef<(TelesalesColumn & { column_type?: string })[]>([]);
    useEffect(() => {
        columnsRef.current = columns;
    }, [columns]);

    const [dbColumns, setDbColumns] = useState<DbColumn[]>(() => {
        const { standardizedDbCols } = standardizeColumns([], undefined);
        return standardizedDbCols;
    });
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [isLoading, setIsLoading] = useState(false);
    const isInitialLoadDone = useRef(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 150); // Optimization #2: Reduced from 300ms
    const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
    const [filterDueDate, setFilterDueDate] = useState<"all" | "overdue" | "today" | "week">("all"); // Phase B
    const [filterCustomerType, setFilterCustomerType] = useState<"all" | "customer" | "personal">("all"); // Phase B
    const [filterType, setFilterType] = useState<TaskType | "all">("all");

    // Month filter for Done column (hide older completed tasks)
    const nowForFilter = new Date();
    const currentYearMonth = `${nowForFilter.getFullYear()}-${String(nowForFilter.getMonth() + 1).padStart(2, '0')}`;
    const [doneMonthFilter, setDoneMonthFilter] = useState<string>(currentYearMonth);

    const getTaskCompletedMonth = useCallback((task: TelesalesTask): string => {
        // Priority: completed_at -> handled_date -> due_date -> created_at
        // Do NOT use updated_at, because touching an old task updates updated_at to the current month!
        const rawDate = task.completed_at || task.handled_date || task.due_date || task.created_at;
        if (!rawDate) return '';
        try {
            const d = new Date(rawDate);
            if (isNaN(d.getTime())) return '';
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            return `${y}-${m}`;
        } catch {
            return '';
        }
    }, []);

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
        const newStatus: TaskStatus = isDone ? (task.due_date ? 'today' : 'inbox') : 'done';
        const completedAt = newStatus === 'done' ? new Date().toISOString() : null;

        // 🚀 Optimistic update: move task to done column or restore to active
        setColumnTasks(prev => {
            const newColumnTasks = { ...prev };
            for (const colId in newColumnTasks) {
                const colDef = dbColumns.find(c => c.id === colId);
                const isDoneCol = isColumnDone(colDef, colId);
                if (newStatus === 'done') {
                    if (isDoneCol) {
                        const exists = newColumnTasks[colId]?.some(t => t.id === taskId);
                        if (!exists) {
                            newColumnTasks[colId] = [{ ...task, status: 'done', completed_at: completedAt }, ...(newColumnTasks[colId] || [])];
                        } else {
                            newColumnTasks[colId] = newColumnTasks[colId].map(t => t.id === taskId ? { ...t, status: 'done', completed_at: completedAt } : t);
                        }
                    } else {
                        // Remove from active columns
                        newColumnTasks[colId] = newColumnTasks[colId].filter(t => t.id !== taskId);
                    }
                } else {
                    if (isDoneCol) {
                        // Remove from done column when uncompleted
                        newColumnTasks[colId] = newColumnTasks[colId].filter(t => t.id !== taskId);
                    } else {
                        newColumnTasks[colId] = newColumnTasks[colId].map(t =>
                            t.id === taskId ? { ...t, status: newStatus as TaskStatus, completed_at: completedAt } : t
                        );
                    }
                }
            }
            return newColumnTasks;
        });

        // Handle legacy mock candidate task id if present
        if (taskId.startsWith('interview_')) {
            const candidateId = taskId.replace('interview_', '');
            try {
                await supabase
                    .from('recruitment_interviews')
                    .update({ status: 'completed' })
                    .eq('candidate_id', candidateId)
                    .eq('status', 'scheduled');
            } catch (e) { }
            await refreshData(true);
            return;
        }

        const success = await updateTaskSupabase(taskId, {
            status: newStatus as TaskStatus,
            completed_at: completedAt
        }, session?.access_token);

        // Also sync recruitment interview status if this task is linked to a candidate
        const candMatch = task.note?.match(/<!-- CANDIDATE_ID:([^>]+) -->/);
        if (candMatch && candMatch[1]) {
            const candidateId = candMatch[1].trim();
            try {
                await supabase
                    .from('recruitment_interviews')
                    .update({ status: newStatus === 'done' ? 'completed' : 'scheduled' })
                    .eq('candidate_id', candidateId);
            } catch (e) {
                console.warn('[handleToggleTaskStatus] Sync candidate interview error:', e);
            }
        }

        // Also move placement to done/inbox column for manual tasks
        if (task.type !== 'deal') {
            const targetCol = isDone
                ? dbColumns.find(c => c.column_type === 'system_inbox')
                : (dbColumns.find(c => c.column_type === 'system_done') || dbColumns.find(c => isColumnDone(c, c.id)));
            if (targetCol) {
                await moveTaskToColumn(taskId, targetCol.id, session?.access_token);
            }
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
                } else if (columnType === 'date_this_week') {
                    startDate.setDate(today.getDate() + 1);
                    endDate.setDate(today.getDate() + 7);
                    endDate.setHours(23, 59, 59, 999);
                } else if (columnType === 'date_this_month') {
                    startDate.setDate(today.getDate() + 8);
                    const curYear = today.getFullYear();
                    const curMonth = today.getMonth();
                    endDate = new Date(curYear, curMonth + 1, 0, 23, 59, 59, 999);
                } else if (columnType === 'date_overdue') {
                    startDate = new Date('2000-01-01');
                    endDate.setDate(today.getDate() - 1);
                    endDate.setHours(23, 59, 59, 999);
                } else if (columnType === 'date_tomorrow') {
                    startDate.setDate(today.getDate() + 1);
                    endDate.setDate(today.getDate() + 1);
                    endDate.setHours(23, 59, 59, 999);
                }

                let activeData: any[] = [];
                if (startDate.getTime() <= endDate.getTime()) {
                    const { fetchUnifiedTasks } = require("@/lib/telesalesTasksStore");
                    const data = await fetchUnifiedTasks({ userId: user.id, startDate, endDate }, session.access_token);
                    // Exclude completed tasks from date columns (completed tasks belong strictly in 'Đã xong')
                    activeData = (data || []).filter((t: any) => t.status !== 'done');
                }

                setColumnTasks(prev => ({ ...prev, [colId]: activeData }));
                setColumnHasMore(prev => ({ ...prev, [colId]: false }));
                setTotalCounts(prev => ({ ...prev, [colId]: activeData.length }));
            } else if (isPlacementColumn(columnType)) {
                // PLACEMENT COLUMNS: fetch via RPC get_column_tasks
                const data = await fetchColumnTasks(colId, 50, isLoadMore ? (pageNum - 1) * 50 : 0, session.access_token);
                // For non-done columns (e.g. inbox, custom), exclude completed tasks
                const colDef = dbColumns.find(c => c.id === colId);
                const isDone = columnType === 'system_done' || isColumnDone(colDef, colId);
                const nonDoneData = isDone
                    ? (data || [])
                    : (data || []).filter((t: any) => t.status !== 'done');

                // Enforce relevance: only tasks belonging to this user should appear in their columns
                const filteredData = nonDoneData.filter((t: any) => isTaskRelevantToUser(t, user.id));

                setColumnTasks(prev => ({
                    ...prev,
                    [colId]: isLoadMore ? [...(prev[colId] || []), ...filteredData] : filteredData
                }));
                setColumnHasMore(prev => ({ ...prev, [colId]: filteredData.length >= 50 }));
                setColumnPages(prev => ({ ...prev, [colId]: pageNum }));
                setTotalCounts(prev => ({ ...prev, [colId]: isLoadMore ? (prev[colId] || 0) : filteredData.length }));
            }
        } catch (error) {
            console.error(`[loadTasksForColumn] Error for ${colId}:`, error);
        } finally {
            setLoadingColumns(prev => ({ ...prev, [colId]: false }));
        }
    }, [user, session?.access_token, dbColumns, debouncedSearchQuery, filterPriority, filterDueDate, filterCustomerType]);

    const refreshData = useCallback(async (isSilent = false) => {
        if (!user) return;
        if (!isInitialLoadDone.current && !isSilent) {
            setIsLoading(true);
        }

        // Fetch profiles + columns from DB in parallel
        const [{ data: profileData }, fetchedDbCols] = await Promise.all([
            supabase.from('profiles').select('id, full_name, email, role'),
            fetchUserColumns(session?.access_token)
        ]);
        if (profileData) setProfiles(profileData);

        // Standardize columns strictly to the 6 fixed columns in exact required order
        const { standardizedDbCols, standardizedUiCols } = standardizeColumns(fetchedDbCols, user.id);
        setDbColumns(standardizedDbCols);
        setColumns(standardizedUiCols);
        columnsRef.current = standardizedUiCols;

        // Background: Reconcile DB task_user_columns asynchronously to match standard specs
        (async () => {
            try {
                for (const spec of STANDARD_COLUMN_SPECS) {
                    const match = (fetchedDbCols || []).find(c => c.column_type === spec.type);
                    if (match) {
                        if (match.label !== spec.label || match.position !== spec.position || !match.is_visible) {
                            await updateUserColumn(match.id, { label: spec.label, position: spec.position, is_visible: true }, session?.access_token);
                        }
                    } else if (user?.id) {
                        try {
                            const headers: Record<string, string> = {
                                'Content-Type': 'application/json',
                                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                            };
                            if (session?.access_token) {
                                headers['Authorization'] = `Bearer ${session.access_token}`;
                            }
                            await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/task_user_columns`, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({
                                    user_id: user.id,
                                    label: spec.label,
                                    column_type: spec.type,
                                    position: spec.position,
                                    is_visible: true
                                })
                            });
                        } catch (err) {
                            console.warn('[refreshData] insert missing column error:', err);
                        }
                    }
                }
                // If system_done was named 'Đã xong', rename to 'Hoàn thành'
                const legacyDone = (fetchedDbCols || []).find(c => c.column_type === 'system_done' && c.label !== 'Hoàn thành');
                if (legacyDone) {
                    await updateUserColumn(legacyDone.id, { label: 'Hoàn thành', position: 50 }, session?.access_token);
                }
                // Clean up deprecated columns from DB (date_tomorrow, custom)
                const obsoleteCols = (fetchedDbCols || []).filter(c => c.column_type === 'date_tomorrow' || c.column_type === 'custom');
                for (const obsolete of obsoleteCols) {
                    await deleteUserColumn(obsolete.id, session?.access_token);
                }
            } catch (e) {
                console.warn('[refreshData] sync columns to DB error:', e);
            }
        })();

        // Auto-heal tasks placed in system_inbox that have status === 'done'
        // (e.g. tasks dragged from 'Đã xong' to date columns before, whose placement was moved to inbox but status stayed 'done')
        const inboxCol = standardizedDbCols.find(c => c.column_type === 'system_inbox');
        if (inboxCol && user && session?.access_token) {
            try {
                const { data: inboxPlacements } = await supabase
                    .from('task_column_placements')
                    .select('task_id')
                    .eq('user_id', user.id)
                    .eq('column_id', inboxCol.id);

                if (inboxPlacements && inboxPlacements.length > 0) {
                    const taskIds = inboxPlacements.map((p: any) => p.task_id);
                    const { data: doneTasksInInbox } = await supabase
                        .from('telesales_tasks')
                        .select('id, due_date')
                        .in('id', taskIds)
                        .eq('status', 'done');

                    if (doneTasksInInbox && doneTasksInInbox.length > 0) {
                        for (const dt of doneTasksInInbox) {
                            const restoredStatus: TaskStatus = dt.due_date ? 'today' : 'inbox';
                            await updateTaskSupabase(dt.id, { status: restoredStatus, completed_at: null }, session.access_token);
                        }
                    }
                }
            } catch (err) {
                console.warn('[Tasks] healOrphanedTasks error:', err);
            }

            // Auto-heal tasks mistakenly placed in date columns:
            // Date columns query by date range and do NOT read task_column_placements.
            // Active tasks placed in date columns become invisible when their due_date is > 7 days or empty.
            // Move any placements targeting date columns back to system_inbox.
            const dateColIds = fetchedDbCols.filter(c => isDateColumn(c.column_type)).map(c => c.id);
            if (dateColIds.length > 0) {
                try {
                    const { data: misplacedPlacements } = await supabase
                        .from('task_column_placements')
                        .select('id, task_id')
                        .eq('user_id', user.id)
                        .in('column_id', dateColIds);

                    if (misplacedPlacements && misplacedPlacements.length > 0) {
                        const misplacedIds = misplacedPlacements.map((p: any) => p.id);
                        await supabase
                            .from('task_column_placements')
                            .update({ column_id: inboxCol.id })
                            .in('id', misplacedIds);
                    }
                } catch (err) {
                    console.warn('[Tasks] healMisplacedDatePlacements error:', err);
                }
            }

            // Auto-heal: Remove placements for current user where user is neither owner, creator, nor assignee
            try {
                const { data: myPlacements } = await supabase
                    .from('task_column_placements')
                    .select('task_id')
                    .eq('user_id', user.id);

                if (myPlacements && myPlacements.length > 0) {
                    const myTaskIds = myPlacements.map((p: any) => p.task_id);
                    const { data: myTasks } = await supabase
                        .from('telesales_tasks')
                        .select('id, user_id, owner_id, assigned_to, leader_id, assignee_ids')
                        .in('id', myTaskIds);

                    if (myTasks) {
                        const unassignedIds = myTasks
                            .filter((t: any) => !isTaskRelevantToUser(t, user.id))
                            .map((t: any) => t.id);

                        if (unassignedIds.length > 0) {
                            await supabase
                                .from('task_column_placements')
                                .delete()
                                .eq('user_id', user.id)
                                .in('task_id', unassignedIds);
                        }
                    }
                }
            } catch (err) {
                console.warn('[Tasks] healUnassignedPlacements error:', err);
            }
        }

        // Admin-only: Ensure interview candidates are synced as real database tasks before loading
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (currentPath.includes('/admin/tasks')) {
            try {
                await fetch('/api/recruitment/sync-interview-tasks');
            } catch (e) {
                console.warn('[Interview Sync] Background sync failed:', e);
            }
        }

        // Load each visible column independently
        const visibleCols = standardizedDbCols.filter(c => c.is_visible !== false);
        await Promise.all(visibleCols.map(col => loadTasksForColumn(col.id, 1, false, col.column_type)));

        isInitialLoadDone.current = true;
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

                        const checkTaskBelongsToColumn = (task: any, colId: string, currentList: any[]): boolean => {
                            const colDef = columnsRef.current.find(c => c.id === colId);
                            const cType = colDef?.column_type || colId;

                            if (task.status === 'done' && (cType === 'system_done' || colId === 'done' || isColumnDone(colDef, colId))) return true;
                            if (task.status === 'done') return false; // Done tasks only in Done column usually

                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const taskDate = task.due_date ? new Date(task.due_date) : null;
                            if (taskDate) taskDate.setHours(0, 0, 0, 0);

                            if (cType === 'date_today' || colId === 'today') {
                                return taskDate ? taskDate.getTime() === today.getTime() : false;
                            }
                            if (cType === 'date_this_week' || colId === 'this_week') {
                                if (!taskDate) return false;
                                const startWeek = new Date(today);
                                startWeek.setDate(today.getDate() + 1);
                                const endWeek = new Date(today);
                                endWeek.setDate(today.getDate() + 7);
                                endWeek.setHours(23, 59, 59, 999);
                                return taskDate.getTime() >= startWeek.getTime() && taskDate.getTime() <= endWeek.getTime();
                            }
                            if (cType === 'date_this_month' || colId === 'this_month') {
                                if (!taskDate) return false;
                                const startMonth = new Date(today);
                                startMonth.setDate(today.getDate() + 8);
                                const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                                if (startMonth.getTime() > endMonth.getTime()) return false;
                                return taskDate.getTime() >= startMonth.getTime() && taskDate.getTime() <= endMonth.getTime();
                            }
                            if (cType === 'date_overdue' || colId === 'overdue') {
                                return taskDate ? taskDate.getTime() < today.getTime() : false;
                            }
                            if (cType === 'date_tomorrow' || colId === 'tomorrow') {
                                const tmr = new Date(today);
                                tmr.setDate(tmr.getDate() + 1);
                                return taskDate ? taskDate.getTime() === tmr.getTime() : false;
                            }
                            if (cType === 'system_inbox' || colId === 'inbox') {
                                if (currentList.some(t => t.id === task.id) && task.status !== 'done') return true;
                                if (taskDate) {
                                    const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                                    const inSevenDays = new Date(today);
                                    inSevenDays.setDate(inSevenDays.getDate() + 7);
                                    inSevenDays.setHours(23, 59, 59, 999);
                                    const maxBound = endMonth.getTime() > inSevenDays.getTime() ? endMonth : inSevenDays;
                                    return taskDate.getTime() > maxBound.getTime();
                                }
                                return task.status === 'inbox' || !task.due_date;
                            }
                            if (cType === 'custom') {
                                return currentList.some(t => t.id === task.id) && task.status !== 'done';
                            }

                            // Default/Legacy columns: match status
                            return task.status === colId;
                        };

                        // Handle INSERT
                        if (payload.eventType === 'INSERT') {
                            if (savingRef.current) {
                                console.log('[Realtime] Skipping INSERT (save in progress)');
                                return;
                            }
                            const newTask = payload.new as any;
                            const isRelevant = isTaskRelevantToUser(newTask, user.id);

                            if (isRelevant) {
                                const normalizedAssignees = parseAssigneeIds(newTask.assignee_ids);
                                const meta = extractTaskMetadata(newTask);
                                const normalizedTask = {
                                    ...newTask,
                                    assignee_ids: normalizedAssignees,
                                    subtasks: meta.subtasks,
                                    stage: meta.stage,
                                    department: (newTask as any).department || meta.department
                                };

                                setColumnTasks(prev => {
                                    for (const col in prev) {
                                        if (prev[col]?.some(t => t.id === newTask.id)) return prev;
                                    }
                                    const newCols = { ...prev };
                                    let placed = false;
                                    for (const col of columnsRef.current) {
                                        if (checkTaskBelongsToColumn(normalizedTask, col.id, newCols[col.id] || [])) {
                                            newCols[col.id] = [normalizedTask, ...(newCols[col.id] || [])];
                                            placed = true;
                                            break;
                                        }
                                    }
                                    if (!placed) {
                                        const inboxCol = columnsRef.current.find((c: any) => c.column_type === 'system_inbox');
                                        if (inboxCol) {
                                            newCols[inboxCol.id] = [normalizedTask, ...(newCols[inboxCol.id] || [])];
                                        }
                                    }
                                    return newCols;
                                });
                            }
                        }

                        // Handle UPDATE
                        if (payload.eventType === 'UPDATE') {
                            const updatedTask = payload.new as any;
                            const isRelevant = isTaskRelevantToUser(updatedTask, user.id);

                            // CRITICAL: If task is NOT relevant to current user, ensure it is completely removed from all columns
                            if (!isRelevant) {
                                setColumnTasks(prev => {
                                    const newCols = { ...prev };
                                    let changed = false;
                                    for (const colId in newCols) {
                                        if (newCols[colId]?.some(t => t.id === updatedTask.id)) {
                                            newCols[colId] = newCols[colId].filter(t => t.id !== updatedTask.id);
                                            changed = true;
                                        }
                                    }
                                    return changed ? newCols : prev;
                                });
                                setEditingTask(current => (current?.id === updatedTask.id ? null : current));
                                return;
                            }

                            // Update Modal State if Open
                            setEditingTask(current => {
                                if (current && current.id === updatedTask.id) {
                                    const nextNote = updatedTask.note !== undefined ? updatedTask.note : current.note;
                                    const rtAttachments = updatedTask.attachments;
                                    const currentAttachments = current.attachments || [];
                                    let nextAttachments;
                                    if (rtAttachments === undefined) {
                                        nextAttachments = currentAttachments;
                                    } else if (Array.isArray(rtAttachments) && rtAttachments.length === 0 && currentAttachments.length > 0) {
                                        nextAttachments = currentAttachments;
                                    } else {
                                        nextAttachments = rtAttachments;
                                    }

                                    const normalizedAssignees = parseAssigneeIds(updatedTask.assignee_ids);
                                    const nextAssignees = normalizedAssignees.length > 0 ? normalizedAssignees : current.assignee_ids;

                                    const meta = extractTaskMetadata({ ...current, ...updatedTask, note: nextNote });
                                    const nextSubtasks = (meta.subtasks && meta.subtasks.length > 0) ? meta.subtasks : (current.subtasks || []);
                                    return {
                                        ...current,
                                        ...updatedTask,
                                        assignee_ids: nextAssignees,
                                        note: nextNote,
                                        attachments: nextAttachments,
                                        customer_name: updatedTask.customer_name !== undefined ? updatedTask.customer_name : current.customer_name,
                                        due_date: updatedTask.due_date !== undefined ? updatedTask.due_date : current.due_date,
                                        subtasks: nextSubtasks,
                                        stage: meta.stage || current.stage || 'in_progress',
                                        department: (updatedTask as any).department || meta.department || current.department
                                    };
                                }
                                return current;
                            });

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
                                                    const rawNote = updatedTask.note !== undefined ? updatedTask.note : t.note;
                                                    const meta = extractTaskMetadata({ ...t, ...updatedTask, note: rawNote });
                                                    const nextSubtasks = (meta.subtasks && meta.subtasks.length > 0) ? meta.subtasks : (t.subtasks || []);
                                                    return {
                                                        ...t,
                                                        ...updatedTask,
                                                        assignee_ids: normalizedAssignees !== undefined ? normalizedAssignees : t.assignee_ids,
                                                        note: rawNote,
                                                        attachments: updatedTask.attachments !== undefined ? updatedTask.attachments : t.attachments,
                                                        customer_name: updatedTask.customer_name !== undefined ? updatedTask.customer_name : t.customer_name,
                                                        subtasks: nextSubtasks,
                                                        stage: meta.stage || t.stage || 'in_progress',
                                                        department: (updatedTask as any).department || meta.department || t.department
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
                                                    normalizedAssignees = cleaned.split(',').map((id: string) => id.trim().replace(/['"]/g, ''));
                                                } else {
                                                    normalizedAssignees = [];
                                                }
                                            }
                                            const meta = extractTaskMetadata(updatedTask);
                                            const normalizedTask = {
                                                ...updatedTask,
                                                assignee_ids: normalizedAssignees !== undefined ? normalizedAssignees : [],
                                                subtasks: meta.subtasks,
                                                stage: meta.stage,
                                                department: (updatedTask as any).department || meta.department
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
    }, [user?.id, authIsLoading]); // Depend on user?.id instead of whole user/session to prevent re-running on window focus token refresh

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
    const handleSaveTask = async (taskData: any) => {
        setIsLoading(true);
        savingRef.current = true;
        try {
            if (!taskData.department) {
                taskData.department = defaultDepartment;
            }

            // Consolidate subtask step assignees into taskData.assignee_ids
            if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
                const stepAssignees = taskData.subtasks.map((s: any) => s.assigned_to).filter(Boolean);
                if (stepAssignees.length > 0) {
                    const mergedAssignees = Array.from(new Set([...(taskData.assignee_ids || []), ...stepAssignees]));
                    taskData.assignee_ids = mergedAssignees;
                    if (!taskData.assigned_to && mergedAssignees.length > 0) {
                        taskData.assigned_to = mergedAssignees[0];
                    }
                }
            }

            // Find target column matching status / column ID
            const targetCol = dbColumns.find(c => c.id === taskData.status || c.column_type === taskData.status || c.label.toLowerCase() === taskData.status?.toLowerCase());
            let targetColType = targetCol?.column_type || taskData.status;

            // Guarantee due date if selected column is today/tomorrow/this_week
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];

            if (targetColType === 'date_today' || taskData.status === 'today' || targetCol?.label?.toLowerCase().includes('hôm nay')) {
                if (!taskData.due_date) taskData.due_date = todayStr;
            } else if (targetColType === 'date_this_week' || taskData.status === 'this_week' || targetCol?.label?.toLowerCase().includes('tuần này')) {
                if (!taskData.due_date) {
                    const thisWeek = new Date(today);
                    thisWeek.setDate(today.getDate() + 3);
                    taskData.due_date = thisWeek.toISOString().split('T')[0];
                }
            } else if (targetColType === 'date_this_month' || taskData.status === 'this_month' || targetCol?.label?.toLowerCase().includes('tháng này')) {
                if (!taskData.due_date) {
                    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    const target = new Date(today);
                    target.setDate(today.getDate() + 10);
                    taskData.due_date = (target <= endOfMonth ? target : endOfMonth).toISOString().split('T')[0];
                }
            } else if (targetColType === 'date_tomorrow' || taskData.status === 'tomorrow' || targetCol?.label?.toLowerCase().includes('ngày mai')) {
                if (!taskData.due_date) {
                    const tmr = new Date(today);
                    tmr.setDate(tmr.getDate() + 1);
                    taskData.due_date = tmr.toISOString().split('T')[0];
                }
            }

            // Calculate diffDays if due_date is present
            let diffDays: number | null = null;
            if (taskData.due_date) {
                const targetDate = new Date(taskData.due_date);
                targetDate.setHours(0, 0, 0, 0);
                diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            }

            const inboxCol = dbColumns.find(c => c.column_type === 'system_inbox' || c.id === 'inbox');
            const doneCol = dbColumns.find(c => c.column_type === 'system_done' || c.id === 'done');

            if (targetColType === 'system_done' || taskData.status === 'done') {
                taskData.status = 'done';
                if (!taskData.completed_at) taskData.completed_at = new Date().toISOString();
            } else if (diffDays !== null && targetColType !== 'custom') {
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                const targetDate = new Date(taskData.due_date!);
                targetDate.setHours(0, 0, 0, 0);
                if (diffDays < 0) {
                    targetColType = 'date_overdue';
                } else if (diffDays === 0) {
                    targetColType = 'date_today';
                } else if (diffDays <= 7) {
                    targetColType = 'date_this_week';
                } else if (targetDate.getTime() <= endOfMonth.getTime()) {
                    targetColType = 'date_this_month';
                } else {
                    taskData.status = 'inbox';
                    targetColType = 'system_inbox';
                }
            } else if (targetColType === 'system_inbox' || taskData.status === 'inbox') {
                taskData.status = 'inbox';
            }

            // CRITICAL: Determine targetPlacementColId for task_column_placements
            // Only 'system_inbox', 'system_done', and 'custom' columns use placements!
            // Date columns (date_today, date_tomorrow, date_this_week, date_overdue) do NOT use placements;
            // active tasks must have their placement set to system_inbox so get_column_tasks and date queries work harmoniously.
            let targetPlacementColId: string | null = null;
            if (taskData.status === 'done' || targetColType === 'system_done') {
                targetPlacementColId = doneCol?.id || null;
            } else if (targetColType === 'custom') {
                targetPlacementColId = targetCol?.id || null;
            } else {
                targetPlacementColId = inboxCol?.id || null;
            }

            if (taskData.id) {
                // 🚀 Optimistic update on columnTasks so UI and subtasks reflect immediately
                setColumnTasks(prev => {
                    const newCols = { ...prev };
                    const isDone = taskData.status === 'done';
                    for (const cId in newCols) {
                        const colDef = dbColumns.find(c => c.id === cId);
                        const isDoneCol = isColumnDone(colDef, cId);
                        if (isDone) {
                            if (isDoneCol) {
                                const exists = newCols[cId]?.some(t => t.id === taskData.id);
                                if (!exists) {
                                    newCols[cId] = [{ ...taskData, note: taskData.note, subtasks: taskData.subtasks, stage: taskData.stage }, ...(newCols[cId] || [])];
                                } else {
                                    newCols[cId] = newCols[cId].map(t => t.id === taskData.id ? { ...t, ...taskData, note: taskData.note, subtasks: taskData.subtasks, stage: taskData.stage } : t);
                                }
                            } else {
                                newCols[cId] = newCols[cId].filter(t => t.id !== taskData.id);
                            }
                        } else {
                            newCols[cId] = newCols[cId].map(t => {
                                if (t.id === taskData.id) {
                                    return {
                                        ...t,
                                        ...taskData,
                                        note: taskData.note,
                                        subtasks: taskData.subtasks,
                                        stage: taskData.stage
                                    };
                                }
                                return t;
                            });
                        }
                    }
                    return newCols;
                });

                await updateTaskSupabase(taskData.id, taskData, session?.access_token);
                // Placements only belong to manual tasks in telesales_tasks. Deals do not use task_column_placements.
                if (taskData.type !== 'deal') {
                    const allUserIds = new Set<string>();
                    if (user?.id) allUserIds.add(user.id);
                    if (taskData.user_id) allUserIds.add(taskData.user_id);
                    if (taskData.owner_id) allUserIds.add(taskData.owner_id);
                    if (taskData.assignee_ids) taskData.assignee_ids.forEach((id: string) => { if (id) allUserIds.add(id); });
                    if (taskData.assigned_to) allUserIds.add(taskData.assigned_to);
                    if (taskData.leader_id) allUserIds.add(taskData.leader_id);
                    if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
                        taskData.subtasks.forEach((st: any) => { if (st.assigned_to) allUserIds.add(st.assigned_to); });
                    }

                    const validIds = Array.from(allUserIds);

                    // Clean up stale placements for users who are no longer associated with this task
                    if (validIds.length > 0) {
                        try {
                            await supabase
                                .from('task_column_placements')
                                .delete()
                                .eq('task_id', taskData.id)
                                .not('user_id', 'in', `(${validIds.join(',')})`);
                        } catch (cleanErr) {
                            console.warn('[handleSaveTask] Error cleaning stale placements:', cleanErr);
                        }
                    }

                    await createTaskPlacements(taskData.id, validIds, session?.access_token);
                    if (taskData.status === 'done') {
                        const doneCol = dbColumns.find(c => c.column_type === 'system_done' || isColumnDone(c, c.id));
                        if (doneCol) await moveTaskToColumn(taskData.id, doneCol.id, session?.access_token);
                    } else if (targetPlacementColId && user?.id) {
                        const targetCol = dbColumns.find(c => c.id === targetPlacementColId);
                        if (targetCol?.column_type === 'system_done' || isColumnDone(targetCol, targetCol?.id)) {
                            const inboxCol = dbColumns.find(c => c.column_type === 'system_inbox');
                            if (inboxCol) await moveTaskToColumn(taskData.id, inboxCol.id, session?.access_token);
                        } else {
                            await moveTaskToColumn(taskData.id, targetPlacementColId, session?.access_token);
                        }
                    }
                }
            } else {
                // Create mode - then create placements for all assignees
                const created = await createTaskSupabase(taskData, session?.access_token);
                if (created && (Array.isArray(created) ? created[0]?.id : created?.id)) {
                    const taskId = Array.isArray(created) ? created[0].id : created.id;
                    // Collect all user IDs: owner + assignees
                    const allUserIds = new Set<string>();
                    if (user?.id) allUserIds.add(user.id);
                    if (taskData.user_id) allUserIds.add(taskData.user_id);
                    if (taskData.owner_id) allUserIds.add(taskData.owner_id);
                    if (taskData.assignee_ids) taskData.assignee_ids.forEach((id: string) => { if (id) allUserIds.add(id); });
                    if (taskData.assigned_to) allUserIds.add(taskData.assigned_to);
                    if (taskData.leader_id) allUserIds.add(taskData.leader_id);
                    if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
                        taskData.subtasks.forEach((st: any) => { if (st.assigned_to) allUserIds.add(st.assigned_to); });
                    }
                    await createTaskPlacements(taskId, Array.from(allUserIds), session?.access_token);
                    // Move placement to target column
                    if (targetPlacementColId && user?.id) {
                        await moveTaskToColumn(taskId, targetPlacementColId, session?.access_token);
                    }
                }
            }
            await refreshData(true);
            setEditingTask(null);
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

            const today = new Date();
            const msOneDay = 24 * 60 * 60 * 1000;
            let newDueDate: string | null = draggedTask.due_date || null;
            let newStatus: TaskStatus = 'inbox';
            let newCompletedAt: string | null = null;

            if (isDateColumn(targetColType)) {
                if (targetColType === 'date_today') {
                    newDueDate = new Date().toISOString();
                    newStatus = 'today';
                } else if (targetColType === 'date_this_week') {
                    newDueDate = new Date(today.getTime() + 2 * msOneDay).toISOString();
                    newStatus = 'this_week';
                } else if (targetColType === 'date_this_month') {
                    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 18, 0, 0, 0);
                    const targetDay = new Date(today.getTime() + 10 * msOneDay);
                    targetDay.setHours(18, 0, 0, 0);
                    newDueDate = (targetDay <= endOfMonth ? targetDay : endOfMonth).toISOString();
                    newStatus = 'this_month';
                } else if (targetColType === 'date_overdue') {
                    newDueDate = draggedTask.due_date || new Date(today.getTime() - msOneDay).toISOString();
                    newStatus = 'inbox';
                } else if (targetColType === 'date_tomorrow') {
                    newDueDate = new Date(today.getTime() + msOneDay).toISOString();
                    newStatus = 'tomorrow';
                }
                newCompletedAt = null;
            } else if (targetColType === 'system_done' || isColumnDone(targetCol, targetColId)) {
                newStatus = 'done';
                newCompletedAt = new Date().toISOString();
            } else if (targetColType === 'system_inbox') {
                newDueDate = null;
                newStatus = 'inbox';
                newCompletedAt = null;
            } else {
                // Custom column
                newStatus = 'inbox';
                newCompletedAt = null;
            }

            const updatedTask: TelesalesTask = {
                ...draggedTask,
                due_date: newDueDate,
                status: newStatus,
                completed_at: newCompletedAt
            };

            // Optimistic: move task between columns in UI
            setColumnTasks(prev => {
                const newColumnTasks = { ...prev };
                for (const colId in newColumnTasks) {
                    if (Array.isArray(newColumnTasks[colId])) {
                        newColumnTasks[colId] = newColumnTasks[colId].filter(t => t.id !== draggedTaskIdData);
                    }
                }
                newColumnTasks[targetColId] = [...(Array.isArray(newColumnTasks[targetColId]) ? newColumnTasks[targetColId] : []), updatedTask];
                return newColumnTasks;
            });

            // Handle DB updates based on target column type
            if (isDateColumn(targetColType)) {
                await updateTaskSupabase(draggedTaskIdData, {
                    due_date: newDueDate,
                    status: newStatus,
                    completed_at: newCompletedAt
                }, session?.access_token);
                // Also move placement to inbox for manual tasks (inbox filters out tasks with due_date, so no duplication)
                if (draggedTask?.type !== 'deal') {
                    const inboxCol = dbColumns.find(c => c.column_type === 'system_inbox');
                    if (inboxCol) {
                        await moveTaskToColumn(draggedTaskIdData, inboxCol.id, session?.access_token);
                    }
                }
            } else if (isPlacementColumn(targetColType)) {
                // Placement column: move task placement for manual tasks
                if (draggedTask?.type !== 'deal') {
                    await moveTaskToColumn(draggedTaskIdData, targetColId, session?.access_token);
                }
                await updateTaskSupabase(draggedTaskIdData, {
                    status: newStatus,
                    completed_at: newCompletedAt,
                    ...(targetColType === 'system_inbox' ? { due_date: null } : {})
                }, session?.access_token);
            }

            // Refresh to sync
            setTimeout(() => refreshData(true), 500);
        }

        // Columns are fixed and locked: column reordering is disabled
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

        // Done month filter
        if (task.status === 'done' && doneMonthFilter !== 'all') {
            if (getTaskCompletedMonth(task) !== doneMonthFilter) {
                return false;
            }
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
                        className="hidden lg:flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
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
                            <div className="fixed top-0 right-0 h-full w-[320px] bg-white border-l border-slate-200 z-[9999] flex flex-col animate-in slide-in-from-right duration-200">
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



                    <div className="hidden lg:flex bg-white border p-1 rounded-lg">
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
            {/* Kanban View (Desktop Only) */}
            <div className={`hidden lg:block flex-1 overflow-x-auto pb-4 ${viewMode !== 'kanban' ? 'lg:hidden' : ''}`}>
                <div className="flex gap-4 min-w-[100%] h-full items-start">
                        {visibleColumns.length > 0 && visibleColumns.map(col => {
                            // FIX: Use columnTasks directly because unified columns rely on RPC 'due_date' logic, NOT the string 'status' field!
                            // We intersect with `filteredTasks` to apply search and priority filters correctly.
                            const isDoneCol = isColumnDone(col, col.id);
                            const colList = columnTasks[col.id] || [];
                            const matchedTasks = colList.filter(t => filteredTasks.some(ft => ft.id === t.id));
                            const tasks = isDoneCol && doneMonthFilter !== 'all'
                                ? matchedTasks.filter(t => getTaskCompletedMonth(t) === doneMonthFilter)
                                : matchedTasks;

                            const isLoadingCol = loadingColumns[col.id];
                            const hasMore = columnHasMore[col.id];

                            const showAppendPlaceholder = draggedTaskId && dragOverColId === col.id && !dropIndicator;

                            return (
                                <div
                                    key={col.id}
                                    draggable={false}
                                    onDragOver={(e) => handleDragOverColumn(e, col.id)}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                    className={`flex-1 min-w-[280px] bg-slate-50/50 rounded-xl flex flex-col max-h-[calc(100vh-280px)] group/col border-2 transition-colors 
                                        ${dragOverColId === col.id ? 'border-primary-300 bg-primary-50/20' : 'border-transparent hover:border-slate-200'}
                                    `}
                                >
                                    {/* Column Header */}
                                    <div className="p-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-slate-50/95 backdrop-blur-sm rounded-t-xl z-20 cursor-default">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <h3 className="font-semibold text-slate-700 text-sm uppercase truncate">{col.label}</h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                                                        isDoneCol 
                                                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                            : 'bg-slate-200 text-slate-600'
                                                    }`} title={isDoneCol && doneMonthFilter !== 'all' ? `Đã hoàn thành ${tasks.length} việc trong tháng đang xem` : `Tổng số việc`}>
                                                        {isDoneCol && doneMonthFilter !== 'all' ? tasks.length : (totalCounts[col.id] || 0)}
                                                    </span>
                                                </div>
                                                {isDoneCol && (
                                                    <div className="mt-1.5" onMouseDown={e => e.stopPropagation()}>
                                                        <div className="relative inline-flex items-center w-full">
                                                            <select
                                                                className="w-full text-xs font-semibold bg-white border border-slate-200 hover:border-emerald-400 rounded-md pl-2 pr-6 py-1 text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none transition-colors"
                                                                value={doneMonthFilter}
                                                                onChange={e => setDoneMonthFilter(e.target.value)}
                                                                title="Lọc việc hoàn thành theo tháng"
                                                            >
                                                                <option value={currentYearMonth}>
                                                                    📅 Tháng này ({currentYearMonth.split('-')[1]}/{currentYearMonth.split('-')[0]})
                                                                </option>
                                                                {Array.from({ length: 11 }).map((_, idx) => {
                                                                    const d = new Date();
                                                                    d.setDate(1);
                                                                    d.setMonth(d.getMonth() - (idx + 1));
                                                                    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                                                    return (
                                                                        <option key={val} value={val}>
                                                                            Tháng {d.getMonth() + 1}/{d.getFullYear()}
                                                                        </option>
                                                                    );
                                                                })}
                                                                <option value="all">📂 Toàn bộ lịch sử (Tất cả)</option>
                                                            </select>
                                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover/col:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openCreateModal('inbox' as TaskStatus, col.id)}
                                                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded ml-1"
                                                title="Thêm việc"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Notice strip when viewing an archived or different month */}
                                    {isDoneCol && doneMonthFilter !== currentYearMonth && (
                                        <div className="mx-2 mt-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800 shadow-xs">
                                            <span className="truncate">
                                                {doneMonthFilter === 'all' ? (
                                                    <>Đang xem <strong>toàn bộ lịch sử</strong></>
                                                ) : (
                                                    <>Đang xem <strong>Tháng {doneMonthFilter.split('-')[1]}/{doneMonthFilter.split('-')[0]}</strong></>
                                                )}
                                            </span>
                                            <button
                                                onClick={() => setDoneMonthFilter(currentYearMonth)}
                                                className="text-[10px] font-bold text-amber-900 hover:text-amber-700 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded transition-colors ml-1 flex-shrink-0"
                                                title="Quay lại tháng hiện tại"
                                            >
                                                Về tháng này
                                            </button>
                                        </div>
                                    )}

                                    {/* Tasks Container */}
                                    <div className="p-2 flex-1 overflow-y-auto space-y-1 relative min-h-[100px]">
                                        {tasks.length === 0 && !isLoadingCol && !showAppendPlaceholder ? (
                                            <div className="text-center py-12 text-slate-400">
                                                <div className="text-4xl mb-2">{isDoneCol ? "🎉" : "📝"}</div>
                                                <p className="text-sm font-medium text-slate-600">
                                                    {isDoneCol
                                                        ? (doneMonthFilter === currentYearMonth
                                                            ? "Chưa có việc hoàn thành trong tháng này"
                                                            : doneMonthFilter === 'all'
                                                            ? "Chưa có việc nào hoàn thành"
                                                            : `Không có việc hoàn thành trong tháng ${doneMonthFilter.split('-')[1]}/${doneMonthFilter.split('-')[0]}`)
                                                        : "Chưa có việc nào"}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {isDoneCol ? "Các việc đã xong sẽ được lưu trữ tại đây" : "Kéo thả hoặc click + để thêm"}
                                                </p>
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

                    </div>
                </div>


            {/* List View (Always on mobile, Toggleable on Desktop) */}
            <div className={`flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 ${viewMode === 'kanban' ? 'block lg:hidden' : ''}`}>
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
            {/* Create/Edit Task Modal */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                initialStatus={createModalInitialStatus}
                initialData={editingTask || undefined}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleSaveTask}
                onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : undefined}
                columns={columns}
                defaultDepartment={defaultDepartment}
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

            {/* Mobile FAB */}
            <button
                onClick={() => { setEditingTask(null); setIsSimpleModalOpen(true); }}
                className="lg:hidden fixed bottom-[150px] right-4 z-[45] flex items-center justify-center w-14 h-14 bg-[#00AFA9] text-white rounded-full border border-slate-200 hover:bg-[#009690] active:scale-95 transition-all duration-200"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* NEW Modals */}
            <TaskSimpleModal
                isOpen={isSimpleModalOpen}
                onClose={() => setIsSimpleModalOpen(false)}
                onSave={handleSaveTask}
                currentUser={user} // Pass user from useAuth
                defaultDepartment={defaultDepartment}
            />
        </div>
    );
}
