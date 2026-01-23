"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle, Package, Calendar } from "lucide-react";
import { useNotificationsStore, Notification } from "@/lib/notificationsStore";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function NotificationBell() {
    const { user } = useAuth();
    const router = useRouter();
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        addNotification,
        markAsRead,
        markAllAsRead
    } = useNotificationsStore();

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial fetch & Realtime subscription
    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        const channel = supabase
            .channel('public:notifications')
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
                    // Optional: Play sound or show toast
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchNotifications, addNotification]);

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
    };

    const handleNotificationClick = (id: string, link?: string) => {
        markAsRead(id);
        if (link) {
            setIsOpen(false);
            console.log("Navigating to:", link);
            router.push(link);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'deal': return <Package className="w-4 h-4 text-blue-500" />;
            case 'task': return <Calendar className="w-4 h-4 text-purple-500" />;
            default: return <Info className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-semibold text-sm text-slate-900">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" /> Đã xem tất cả
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNotificationClick(notif.id, notif.link);
                                        }}
                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        {!notif.is_read && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                        )}
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 shrink-0">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Không có thông báo mới</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
