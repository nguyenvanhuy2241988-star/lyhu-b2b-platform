"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle, Package, Calendar, CheckSquare, User, Tag } from "lucide-react";
import { useNotificationsStore, Notification } from "@/lib/notificationsStore";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { isTaskAssignedToUser, extractTaskMetadata, resolveDepartmentConfig } from "@/lib/telesalesTasksStore";

interface AssignedTaskItem {
    id: string;
    title: string;
    creator_id?: string;
    creator_name?: string;
    due_date?: string | null;
    status: string;
    priority?: string;
    department?: string;
    created_at: string;
    subtask_title?: string | null;
}

export default function NotificationBell() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const {
        notifications,
        unreadCount: storeUnreadCount,
        fetchNotifications,
        addNotification,
        markAsRead,
        markAllAsRead
    } = useNotificationsStore();

    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'tasks' | 'news'>('all');
    const [assignedTasks, setAssignedTasks] = useState<AssignedTaskItem[]>([]);
    const [readTaskIds, setReadTaskIds] = useState<Set<string>>(new Set());
    const dropdownRef = useRef<HTMLDivElement>(null);
    const profilesCacheRef = useRef<Record<string, string>>({});

    // Pre-cache profiles for resolving creator/assigner names
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
                console.warn('[NotificationBell] Failed to load profiles cache:', err);
            }
        };
        fetchProfiles();
    }, []);

    // Load tasks assigned to current user
    const fetchAssignedTasks = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data } = await supabase
                .from('telesales_tasks')
                .select('id, title, status, priority, department, due_date, created_at, updated_at, user_id, owner_id, assigned_to, assignee_ids, metadata, note')
                .order('created_at', { ascending: false })
                .limit(40);

            if (data) {
                const myAssigned: AssignedTaskItem[] = [];
                for (const t of data) {
                    if (isTaskAssignedToUser(t, user.id)) {
                        const meta = extractTaskMetadata(t);
                        const myStep = meta.subtasks?.find((s: any) => s.assigned_to === user.id && !s.completed);
                        const cId = t.owner_id || t.user_id;
                        myAssigned.push({
                            id: t.id,
                            title: t.title || 'Công việc mới',
                            creator_id: cId,
                            creator_name: profilesCacheRef.current[cId] || 'Đồng nghiệp',
                            due_date: t.due_date,
                            status: t.status,
                            priority: t.priority,
                            department: t.department || meta.department,
                            created_at: t.created_at,
                            subtask_title: myStep ? myStep.title : null
                        });
                    }
                }
                setAssignedTasks(myAssigned);
            }
        } catch (err) {
            console.warn('[NotificationBell] Error fetching assigned tasks:', err);
        }
    }, [user?.id]);

    // Initial fetch & Realtime subscriptions
    useEffect(() => {
        if (!user) return;

        fetchNotifications();
        fetchAssignedTasks();

        // Realtime for notifications table
        const notifChannel = supabase
            .channel(`notif_bell_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload: any) => {
                    addNotification(payload.new as Notification);
                }
            )
            .subscribe();

        // Realtime for tasks table to immediately refresh assigned tasks list
        const tasksChannel = supabase
            .channel(`tasks_bell_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'telesales_tasks'
                },
                () => {
                    fetchAssignedTasks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(notifChannel);
            supabase.removeChannel(tasksChannel);
        };
    }, [user, fetchNotifications, fetchAssignedTasks, addNotification]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchAssignedTasks();
            fetchNotifications();
        }
    };

    const handleNavigateToTask = (taskId: string) => {
        setIsOpen(false);
        setReadTaskIds(prev => new Set(prev).add(taskId));

        // If already on tasks page, trigger locate or smooth scroll
        if (pathname?.includes('/tasks')) {
            const taskEl = document.getElementById(`task-${taskId}`);
            if (taskEl) {
                taskEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                taskEl.classList.add('ring-4', 'ring-[#00AFA9]', 'scale-[1.02]');
                setTimeout(() => {
                    taskEl.classList.remove('ring-4', 'ring-[#00AFA9]', 'scale-[1.02]');
                }, 3000);
            } else {
                const target = pathname.includes('/admin/tasks')
                    ? `/admin/tasks?taskId=${taskId}`
                    : `/telesales/tasks?taskId=${taskId}`;
                router.push(target);
            }
        } else {
            router.push(`/telesales/tasks?taskId=${taskId}`);
        }
    };

    const handleNotificationClick = (id: string, link?: string) => {
        markAsRead(id);
        setIsOpen(false);
        if (link) {
            router.push(link);
        }
    };

    const handleMarkAllRead = () => {
        markAllAsRead();
        // Mark all current tasks as acknowledged in local state
        const allTaskIds = new Set(assignedTasks.map(t => t.id));
        setReadTaskIds(allTaskIds);
    };

    // Calculate unread counts
    const unreadTaskCount = assignedTasks.filter(t => t.status !== 'done' && !readTaskIds.has(t.id)).length;
    const totalUnread = storeUnreadCount + unreadTaskCount;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'error': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
            case 'deal': return <Package className="w-4 h-4 text-blue-500" />;
            case 'task': return <CheckSquare className="w-4 h-4 text-[#00AFA9]" />;
            default: return <Info className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-all active:scale-95"
                title="Thông báo & Công việc"
                aria-label="Thông báo"
            >
                <Bell className="w-5 h-5" />
                {totalUnread > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">Thông báo</span>
                            {totalUnread > 0 && (
                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-[#00AFA9]">
                                    {totalUnread}
                                </span>
                            )}
                        </div>
                        {totalUnread > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-[#00AFA9] hover:text-[#009690] font-medium flex items-center gap-1 transition-colors"
                            >
                                <Check className="w-3 h-3" /> Đã xem tất cả
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex border-b border-slate-100 bg-white text-xs font-medium px-2 pt-1.5 gap-1">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 pb-2 pt-1 rounded-t-lg transition-colors border-b-2 ${
                                activeTab === 'all'
                                    ? 'border-[#00AFA9] text-[#00AFA9] font-semibold'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`flex-1 pb-2 pt-1 rounded-t-lg transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                                activeTab === 'tasks'
                                    ? 'border-[#00AFA9] text-[#00AFA9] font-semibold'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <span>Công việc</span>
                            {unreadTaskCount > 0 && (
                                <span className="bg-teal-100 text-[#00AFA9] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                    {unreadTaskCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('news')}
                            className={`flex-1 pb-2 pt-1 rounded-t-lg transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                                activeTab === 'news'
                                    ? 'border-[#00AFA9] text-[#00AFA9] font-semibold'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <span>Tin tức</span>
                            {storeUnreadCount > 0 && (
                                <span className="bg-rose-100 text-rose-600 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                    {storeUnreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Content List */}
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
                        {/* 1. ASSIGNED TASKS (Shown in 'all' and 'tasks') */}
                        {(activeTab === 'all' || activeTab === 'tasks') && assignedTasks.length > 0 && (
                            <div>
                                {activeTab === 'all' && (
                                    <div className="px-3.5 py-1.5 bg-teal-50/50 text-[11px] font-bold uppercase tracking-wider text-[#00AFA9] flex items-center gap-1.5">
                                        <CheckSquare className="w-3 h-3" />
                                        <span>Công việc được giao cho bạn ({assignedTasks.length})</span>
                                    </div>
                                )}
                                {assignedTasks.map((task) => {
                                    const isRead = task.status === 'done' || readTaskIds.has(task.id);
                                    const deptConf = task.department ? resolveDepartmentConfig(task.department) : null;
                                    const formattedDueDate = task.due_date
                                        ? new Date(task.due_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                                        : null;
                                    const isOverdue = task.due_date && new Date(task.due_date).getTime() < Date.now() && task.status !== 'done';

                                    return (
                                        <button
                                            key={`task_${task.id}`}
                                            onClick={() => handleNavigateToTask(task.id)}
                                            className={`w-full text-left p-3.5 hover:bg-slate-50 transition-colors cursor-pointer relative flex gap-3 ${
                                                !isRead ? 'bg-teal-50/30' : ''
                                            }`}
                                        >
                                            {!isRead && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00AFA9]"></div>
                                            )}
                                            {/* Icon */}
                                            <div className="mt-0.5 shrink-0 flex h-7 w-7 items-center justify-center rounded-xl bg-teal-50 text-[#00AFA9] ring-1 ring-teal-500/20 shadow-xs">
                                                <CheckSquare className="w-3.5 h-3.5" />
                                            </div>
                                            {/* Body */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-1">
                                                    <h4 className={`text-xs leading-snug line-clamp-2 ${!isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                        {task.title}
                                                    </h4>
                                                </div>

                                                {task.subtask_title && (
                                                    <div className="mt-1 text-[11px] text-teal-800 bg-teal-50 rounded px-1.5 py-0.5 inline-flex items-center gap-1 font-medium">
                                                        <span>Bước: {task.subtask_title}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] text-slate-500">
                                                    {task.creator_name && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <User className="w-2.5 h-2.5 text-slate-400" />
                                                            <span>Giao bởi: <strong className="text-slate-700">{task.creator_name}</strong></span>
                                                        </span>
                                                    )}
                                                    {formattedDueDate && (
                                                        <span className={`inline-flex items-center gap-0.5 font-medium ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                                                            <Calendar className="w-2.5 h-2.5" />
                                                            <span>Hạn: {formattedDueDate}</span>
                                                        </span>
                                                    )}
                                                    {deptConf && (
                                                        <span className={`inline-flex items-center gap-0.5 px-1 py-0.1 rounded text-[9px] font-medium border ${deptConf.badgeBg} ${deptConf.badgeText} ${deptConf.badgeBorder}`}>
                                                            <span>{deptConf.label}</span>
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                    {formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: vi })}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* 2. SYSTEM & NEWS NOTIFICATIONS (Shown in 'all' and 'news') */}
                        {(activeTab === 'all' || activeTab === 'news') && notifications.length > 0 && (
                            <div>
                                {activeTab === 'all' && assignedTasks.length > 0 && (
                                    <div className="px-3.5 py-1.5 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                        <Bell className="w-3 h-3" />
                                        <span>Tin tức & Hệ thống ({notifications.length})</span>
                                    </div>
                                )}
                                {notifications.map((notif) => (
                                    <button
                                        key={`notif_${notif.id}`}
                                        onClick={() => handleNotificationClick(notif.id, notif.link)}
                                        className={`w-full text-left p-3.5 hover:bg-slate-50 transition-colors cursor-pointer relative flex gap-3 ${
                                            !notif.is_read ? 'bg-teal-50/20' : ''
                                        }`}
                                    >
                                        {!notif.is_read && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00AFA9]"></div>
                                        )}
                                        <div className="mt-0.5 shrink-0">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-xs leading-snug ${!notif.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                {notif.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* EMPTY STATE */}
                        {((activeTab === 'all' && assignedTasks.length === 0 && notifications.length === 0) ||
                          (activeTab === 'tasks' && assignedTasks.length === 0) ||
                          (activeTab === 'news' && notifications.length === 0)) && (
                            <div className="p-8 text-center text-slate-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-medium">Không có thông báo nào</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
