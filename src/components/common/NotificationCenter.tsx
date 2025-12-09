"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import {
    getNotificationsByUser,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    Notification,
    loadNotifications
} from "@/lib/notificationsStore";
import { getCurrentUser } from "@/lib/auth";

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const user = getCurrentUser();

    useEffect(() => {
        if (!user) return;

        const load = () => {
            setNotifications(getNotificationsByUser(user.id));
            setUnreadCount(getUnreadCount(user.id));
        };

        load();
        window.addEventListener("notifications-updated", load);

        // Also click outside to close
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("notifications-updated", load);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [user?.id]);

    const handleMarkAsRead = (id: string) => {
        markAsRead(id);
    };

    const handleMarkAllRead = () => {
        if (user) {
            markAllAsRead(user.id);
        }
    };

    if (!user) return null;

    const NotificationIcon = ({ type }: { type: string }) => {
        switch (type) {
            case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case "error": return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg relative transition-colors"
                title="Thông báo"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-semibold text-slate-900 text-sm">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                <p className="text-sm">Không có thông báo mới</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => handleMarkAsRead(notif.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-0.5">
                                                <NotificationIcon type={notif.type} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notif.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-2">
                                                    {new Date(notif.createdAt).toLocaleString("vi-VN")}
                                                </p>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
