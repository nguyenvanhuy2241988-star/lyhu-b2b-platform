import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'deal' | 'task';
    link?: string;
    is_read: boolean;
    created_at: string;
    metadata?: any;
}

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: Notification) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const { data, error } = await supabase.rpc('get_notifications', { p_limit: 50 });

            if (error) {
                console.error('Error fetching notifications:', error);
                return;
            }

            const notifs = data as Notification[];
            const unreadCount = notifs.filter(n => !n.is_read).length;

            set({ notifications: notifs, unreadCount, isLoading: false });
        } catch (err) {
            console.error('Exception fetching notifications:', err);
            set({ isLoading: false });
        }
    },

    markAsRead: async (id: string) => {
        // Optimistic update
        set(state => {
            const newNotifs = state.notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            );
            return {
                notifications: newNotifs,
                unreadCount: newNotifs.filter(n => !n.is_read).length
            };
        });

        // Backend call
        try {
            await supabase.rpc('mark_notification_read', { p_notification_id: id });
        } catch (err) {
            console.error('Error marking notification as read:', err);
            // Revert if needed (omitted for simplicity)
        }
    },

    markAllAsRead: async () => {
        // Optimistic update
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, is_read: true })),
            unreadCount: 0
        }));

        try {
            await supabase.rpc('mark_all_notifications_read');
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    },

    addNotification: (notification: Notification) => {
        set(state => {
            const newNotifs = [notification, ...state.notifications].slice(0, 50); // Keep max 50 recent
            return {
                notifications: newNotifs,
                unreadCount: state.unreadCount + 1
            };
        });
    }
}));
