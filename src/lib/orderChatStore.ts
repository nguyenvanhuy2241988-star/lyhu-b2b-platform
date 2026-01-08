import { supabase } from "@/lib/supabaseClient";

// Helper to get auth headers
const getHeaders = async (userInfo?: { token?: string }) => {
    let token = userInfo?.token;

    if (!token) {
        // Fallback: Try to get from session (risk of deadlock but fallback only)
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
    }

    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    return {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${token || apiKey}`
    };
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export interface OrderMessage {
    id: string;
    orderId: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string | null;
    imageUrl: string | null;
    createdAt: string;
}

/**
 * Fetch all messages for an order
 */
export async function fetchOrderMessages(orderId: string, token?: string): Promise<OrderMessage[]> {
    try {
        const headers = await getHeaders({ token });
        const res = await fetch(`${SUPABASE_URL}/rest/v1/order_messages?order_id=eq.${orderId}&select=*&order=created_at.asc`, {
            method: 'GET',
            headers
        });

        if (!res.ok) {
            console.error('[OrderChat] Error fetching messages:', res.statusText);
            return [];
        }

        const data = await res.json();
        return (data || []).map(mapMessage);
    } catch (err) {
        console.error('[OrderChat] Exception fetching messages:', err);
        return [];
    }
}

/**
 * Send a new message
 */
export async function sendMessage(
    orderId: string,
    senderId: string,
    senderName: string,
    senderRole: string,
    content: string,
    imageUrl?: string,
    token?: string
): Promise<{ success: boolean; data?: OrderMessage; error?: string }> {
    try {
        const headers = await getHeaders({ token });
        // Return representation to get the created row
        const res = await fetch(`${SUPABASE_URL}/rest/v1/order_messages`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({
                order_id: orderId,
                sender_id: senderId,
                sender_name: senderName,
                sender_role: senderRole,
                content: content || null,
                image_url: imageUrl || null
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[OrderChat] Error sending message:', errorText);
            return { success: false, error: errorText };
        }

        const data = await res.json();
        return { success: true, data: mapMessage(data[0]) };
    } catch (err: any) {
        console.error('[OrderChat] Exception sending message:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Upload image and get URL
 */
export async function uploadChatImage(
    file: File,
    orderId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orderId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('[OrderChat] Error uploading image:', error);
        return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
}

/**
 * Subscribe to new messages for an order
 */
export function subscribeToOrderMessages(
    orderId: string,
    onNewMessage: (message: OrderMessage) => void,
    token?: string
) {
    // Auto-auth is handled by createBrowserClient
    // if (token) {
    //    supabase.realtime.setAuth(token);
    // }
    const channel = supabase
        .channel(`order_chat_${orderId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'order_messages',
                filter: `order_id=eq.${orderId}`
            },
            (payload: any) => {
                onNewMessage(mapMessage(payload.new));
            }
        )
        (payload: any) => {
        onNewMessage(mapMessage(payload.new));
    }
        )
        .subscribe((status) => {
        console.log(`[OrderChat] Subscription status for ${orderId}:`, status);
    });

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Get unread message count for orders (for badge)
 */
export async function getOrdersWithNewMessages(
    since: string
): Promise<Record<string, number>> {
    const { data, error } = await supabase
        .from('order_messages')
        .select('order_id')
        .gte('created_at', since);

    if (error || !data) return {};

    // Count messages per order
    const counts: Record<string, number> = {};
    data.forEach((m: any) => {
        counts[m.order_id] = (counts[m.order_id] || 0) + 1;
    });

    return counts;
}

/**
 * Check if an order has unread messages (for badge)
 */
/**
 * Check if an order has unread messages (for badge) - Pure Fetch
 */
export async function hasUnreadMessages(orderId: string, token?: string): Promise<boolean> {
    try {
        const lastSeenKey = `chat_last_seen_${orderId}`;
        const lastSeen = typeof window !== 'undefined' ? localStorage.getItem(lastSeenKey) : null;

        const headers = await getHeaders({ token });

        // If never seen, check if there are any messages (limit 1)
        let query = `order_id=eq.${orderId}&select=id&limit=1&order=created_at.desc`;

        // If last seen, check for messages OLDER than last seen? No, NEWER (gt).
        if (lastSeen) {
            query += `&created_at=gt.${lastSeen}`;
        }

        const res = await fetch(`${SUPABASE_URL}/rest/v1/order_messages?${query}`, { headers });
        if (!res.ok) return false;

        const data = await res.json();
        return data && data.length > 0;
    } catch {
        return false;
    }
}

/**
 * Check multiple orders for unread messages (batch)
 */
/**
 * Check multiple orders for unread messages (batch) - Pure Fetch
 * Note: Doing this in loop is inefficient but acceptable for small pages.
 * Optimized: Could use a single query with OR, but PostgREST OR is limited for complex conditions.
 * Simple loop loop with parallel fetch is better for now.
 */
export async function getOrdersWithUnreadMessages(orderIds: string[], token?: string): Promise<Set<string>> {
    const unreadOrders = new Set<string>();

    // Parallel fetch for speed
    const checks = await Promise.all(orderIds.map(async (orderId) => {
        const isUnread = await hasUnreadMessages(orderId, token);
        return isUnread ? orderId : null;
    }));

    checks.forEach(id => {
        if (id) unreadOrders.add(id);
    });

    return unreadOrders;
}

/**
 * Mark chat as read (call when user opens chat modal)
 */
export function markChatAsRead(orderId: string): void {
    if (typeof window === 'undefined') return;
    const lastSeenKey = `chat_last_seen_${orderId}`;
    localStorage.setItem(lastSeenKey, new Date().toISOString());
}

// Helper to map DB row to interface
function mapMessage(row: any): OrderMessage {
    return {
        id: row.id,
        orderId: row.order_id,
        senderId: row.sender_id,
        senderName: row.sender_name,
        senderRole: row.sender_role,
        content: row.content,
        imageUrl: row.image_url,
        createdAt: row.created_at
    };
}

