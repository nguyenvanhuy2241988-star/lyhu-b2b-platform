export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

const STORAGE_KEY = "lyhu_notifications";

export const loadNotifications = (): Notification[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to load notifications:", error);
        return [];
    }
};

export const saveNotifications = (notifications: Notification[]) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
        console.error("Failed to save notifications:", error);
    }
};

export const getNotificationsByUser = (userId: string): Notification[] => {
    const all = loadNotifications();
    return all.filter(n => n.userId === userId).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

export const getUnreadCount = (userId: string): number => {
    return getNotificationsByUser(userId).filter(n => !n.isRead).length;
};

export const addNotification = (
    userId: string,
    data: { title: string; message: string; type?: NotificationType; link?: string }
) => {
    const all = loadNotifications();
    const newNotification: Notification = {
        id: Date.now().toString(),
        userId,
        title: data.title,
        message: data.message,
        type: data.type || "info",
        isRead: false,
        link: data.link,
        createdAt: new Date().toISOString(),
    };
    saveNotifications([newNotification, ...all]);
    return newNotification;
};

export const markAsRead = (notificationId: string) => {
    const all = loadNotifications();
    const updated = all.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
    saveNotifications(updated);
};

export const markAllAsRead = (userId: string) => {
    const all = loadNotifications();
    const updated = all.map(n => n.userId === userId ? { ...n, isRead: true } : n);
    saveNotifications(updated);
};
