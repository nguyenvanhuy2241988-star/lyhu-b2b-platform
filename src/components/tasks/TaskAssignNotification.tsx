"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, ArrowRight, X, Calendar, User, CheckSquare } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { playNotificationSound } from "@/lib/soundNotification";
import { parseAssigneeIds, extractTaskMetadata, resolveDepartmentConfig } from "@/lib/telesalesTasksStore";

interface IncomingTaskNotice {
    id: string;
    title: string;
    creatorName: string;
    dueDate?: string | null;
    department?: string;
    timestamp: number;
    subtaskTitle?: string | null;
}

export const TaskAssignNotification = () => {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [activeNotices, setActiveNotices] = useState<IncomingTaskNotice[]>([]);
    const profilesCacheRef = useRef<Record<string, string>>({});
    const handledTaskIdsRef = useRef<Set<string>>(new Set());

    // Pre-cache profiles for fast name resolution
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const { data } = await supabase.from('profiles').select('id, full_name, email');
                if (data) {
                    const cache: Record<string, string> = {};
                    data.forEach((p: any) => {
                        cache[p.id] = p.full_name || p.email?.split('@')[0] || 'Đồng nghiệp';
                    });
                    profilesCacheRef.current = cache;
                }
            } catch (err) {
                console.warn('[TaskAssignNotification] Failed to load profiles cache:', err);
            }
        };
        fetchProfiles();
    }, []);

    const dismissNotice = useCallback((id: string) => {
        setActiveNotices(prev => prev.filter(n => n.id !== id));
    }, []);

    const handleOpenTask = useCallback((taskId: string) => {
        dismissNotice(taskId);

        // If already on tasks page, trigger locate or highlight
        if (pathname?.includes('/tasks')) {
            const taskEl = document.getElementById(`task-${taskId}`);
            if (taskEl) {
                taskEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                taskEl.classList.add('ring-4', 'ring-[#00AFA9]', 'scale-[1.02]');
                setTimeout(() => {
                    taskEl.classList.remove('ring-4', 'ring-[#00AFA9]', 'scale-[1.02]');
                }, 3000);
            } else {
                window.location.href = `/telesales/tasks?taskId=${taskId}`;
            }
        } else {
            router.push(`/telesales/tasks?taskId=${taskId}`);
        }
    }, [pathname, router, dismissNotice]);

    // Realtime listener for newly assigned tasks
    useEffect(() => {
        if (!user?.id) return;

        console.log('[TaskAssignNotification] Subscribing to assignment events for user:', user.id);

        const channel = supabase
            .channel(`task_assign_notify_${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'telesales_tasks' },
                async (payload: any) => {
                    const task = payload.new as any;
                    if (!task || !task.id) return;

                    // If user is the creator/owner and nobody else was assigned, ignore self-created actions
                    const isSelfCreator = (task.owner_id === user.id || task.user_id === user.id);

                    // Check if current user is an assignee
                    const aIds = parseAssigneeIds(task.assignee_ids);
                    const meta = extractTaskMetadata(task);
                    const hasSubtaskAssigned = meta.subtasks?.some(
                        (st: any) => st.assigned_to === user.id && !st.completed
                    );
                    const isAssignedToUser = (
                        task.assigned_to === user.id ||
                        aIds.includes(user.id) ||
                        hasSubtaskAssigned
                    );

                    // Only notify if:
                    // 1. Task is assigned to current user
                    // 2. Not created by self, OR if updated by someone else
                    // 3. Not already notified within last 15 seconds
                    if (isAssignedToUser && !isSelfCreator) {
                        const noticeKey = `${task.id}_${payload.eventType}_${Math.floor(Date.now() / 15000)}`;
                        if (handledTaskIdsRef.current.has(noticeKey)) return;
                        handledTaskIdsRef.current.add(noticeKey);

                        // Resolve creator/assigner name
                        const creatorId = task.owner_id || task.user_id;
                        let creatorName = profilesCacheRef.current[creatorId] || 'Đồng nghiệp';
                        if (!profilesCacheRef.current[creatorId] && creatorId) {
                            try {
                                const { data: p } = await supabase.from('profiles').select('full_name, email').eq('id', creatorId).maybeSingle();
                                if (p) {
                                    creatorName = p.full_name || p.email?.split('@')[0] || 'Đồng nghiệp';
                                    profilesCacheRef.current[creatorId] = creatorName;
                                }
                            } catch (e) { }
                        }

                        // Check subtask title if assigned to a specific step
                        const myStep = meta.subtasks?.find((s: any) => s.assigned_to === user.id && !s.completed);

                        // 1. Play signature LYHU notification sound
                        playNotificationSound();

                        // 2. Add to active banner notices
                        const newNotice: IncomingTaskNotice = {
                            id: task.id,
                            title: task.title || 'Công việc mới',
                            creatorName,
                            dueDate: task.due_date,
                            department: task.department || meta.department,
                            timestamp: Date.now(),
                            subtaskTitle: myStep ? myStep.title : null
                        };

                        setActiveNotices(prev => {
                            const filtered = prev.filter(n => n.id !== task.id);
                            return [newNotice, ...filtered].slice(0, 3); // Max 3 banners stacked
                        });

                        // Auto-dismiss after 10 seconds
                        setTimeout(() => {
                            dismissNotice(task.id);
                        }, 10000);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, dismissNotice]);

    if (activeNotices.length === 0) return null;

    return (
        <aside
            aria-label="Thông báo công việc mới"
            className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm w-full"
        >
            {activeNotices.map((notice) => {
                const deptConf = notice.department ? resolveDepartmentConfig(notice.department) : null;
                const formattedDate = notice.dueDate
                    ? new Date(notice.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : null;

                return (
                    <div
                        key={notice.id}
                        role="alert"
                        className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl shadow-teal-950/15 rounded-2xl p-4 transition-all duration-300 animate-in slide-in-from-top-4 fade-in hover:shadow-teal-950/20 group"
                        style={{ borderLeft: '4px solid #00AFA9' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-teal-50 text-[#00AFA9] ring-1 ring-teal-500/20 shadow-xs">
                                    <Bell className="w-3.5 h-3.5 animate-bounce" />
                                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00AFA9] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00AFA9]"></span>
                                    </span>
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00AFA9]">
                                    Việc mới được giao
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => dismissNotice(notice.id)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                                title="Đóng thông báo"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Task Title */}
                        <h4
                            onClick={() => handleOpenTask(notice.id)}
                            className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 cursor-pointer hover:text-[#00AFA9] transition-colors mb-2"
                        >
                            {notice.title}
                        </h4>

                        {/* Assigned Step (if subtask) */}
                        {notice.subtaskTitle && (
                            <div className="mb-2 p-1.5 bg-teal-50/70 border border-teal-100 rounded-lg text-xs text-teal-800 flex items-center gap-1.5 font-medium">
                                <CheckSquare className="w-3 h-3 text-[#00AFA9] flex-shrink-0" />
                                <span className="truncate">Bước: {notice.subtaskTitle}</span>
                            </div>
                        )}

                        {/* Metadata row */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 mb-3">
                            <span className="inline-flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>Giao bởi: <strong className="text-slate-700 font-medium">{notice.creatorName}</strong></span>
                            </span>
                            {formattedDate && (
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>Hạn: <strong className="text-slate-700 font-medium">{formattedDate}</strong></span>
                                </span>
                            )}
                            {deptConf && (
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium border ${deptConf.badgeBg} ${deptConf.badgeText} ${deptConf.badgeBorder}`}>
                                    <span>{deptConf.icon}</span>
                                    <span>{deptConf.label}</span>
                                </span>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => dismissNotice(notice.id)}
                                className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                                Bỏ qua
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOpenTask(notice.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00AFA9] hover:bg-[#009a95] text-white text-xs font-medium rounded-lg shadow-sm shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span>Xem & làm ngay</span>
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </aside>
    );
};
