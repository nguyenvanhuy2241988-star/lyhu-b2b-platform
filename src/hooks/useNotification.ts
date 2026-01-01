"use client";

import { useEffect, useCallback, useRef } from 'react';

interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    onClick?: () => void;
}

/**
 * Hook for browser push notifications
 */
export function useNotification() {
    const permissionRef = useRef<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            permissionRef.current = Notification.permission;
        }
    }, []);

    /**
     * Request notification permission
     */
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            console.warn('Browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            permissionRef.current = 'granted';
            return true;
        }

        if (Notification.permission === 'denied') {
            console.warn('Notification permission denied');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            permissionRef.current = permission;
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }, []);

    /**
     * Show notification
     */
    const showNotification = useCallback(async (options: NotificationOptions): Promise<boolean> => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return false;
        }

        // Request permission if not granted
        if (permissionRef.current !== 'granted') {
            const granted = await requestPermission();
            if (!granted) return false;
        }

        try {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon || '/icon.png',
                badge: '/icon.png',
                tag: 'lyhu-notification',
                requireInteraction: false,
            });

            if (options.onClick) {
                notification.onclick = () => {
                    window.focus();
                    options.onClick?.();
                    notification.close();
                };
            }

            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            return true;
        } catch (error) {
            console.error('Error showing notification:', error);
            return false;
        }
    }, [requestPermission]);

    /**
     * Check if notifications are supported and permitted
     */
    const isSupported = typeof window !== 'undefined' && 'Notification' in window;
    const isPermitted = permissionRef.current === 'granted';

    return {
        showNotification,
        requestPermission,
        isSupported,
        isPermitted,
    };
}

/**
 * Notification for new order
 */
export function notifyNewOrder(orderId: string, customerName: string, amount: number) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return;
    }

    if (Notification.permission !== 'granted') {
        return;
    }

    const formattedAmount = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);

    new Notification('🛒 Đơn hàng mới!', {
        body: `${customerName} - ${formattedAmount}`,
        icon: '/icon.png',
        tag: `order-${orderId}`,
    });
}
