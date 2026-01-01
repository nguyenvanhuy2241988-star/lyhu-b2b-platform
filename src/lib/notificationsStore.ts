import { createClient } from "@/lib/supabaseClient";

const supabase = createClient();

export interface Notification {
    id: string;
    userId: string | null;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'order';
    isRead: boolean;
    link?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

/**
 * Fetch notifications for current user
 */
export async function fetchNotifications(limit: number = 20): Promise<Notification[]> {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[Notifications] Error:', error);
        return [];
    }

    return (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        link: n.link,
        metadata: n.metadata,
        createdAt: n.created_at
    }));
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    return !error;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<boolean> {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

    return !error;
}

/**
 * Get unread count
 */
export async function getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

    if (error) return 0;
    return count || 0;
}

/**
 * Add a new notification
 */
export async function addNotification(userId: string, notification: {
    title: string;
    message: string;
    type: Notification['type'];
    link?: string;
    metadata?: Record<string, any>;
}): Promise<boolean> {
    const { error } = await supabase
        .from('notifications')
        .insert([{
            user_id: userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            metadata: notification.metadata,
            is_read: false
        }]);

    if (error) {
        console.error('[Notifications] Error adding:', error);
        return false;
    }

    return true;
}
