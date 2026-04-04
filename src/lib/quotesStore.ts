import { supabase } from '@/lib/supabaseClient';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface QuoteItem {
    productId?: string;
    name: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    discountType?: 'amount' | 'percent';
    subtotal: number;
    isGift?: boolean;
}

export interface Quote {
    id: string;
    readable_id: number;
    customer_id?: string;
    customer_name: string;
    customer_phone?: string;
    customer_address?: string;
    status: QuoteStatus;
    items: QuoteItem[];
    subtotal: number;
    discount_amount: number;
    discount_type: 'amount' | 'percent';
    vat_percent: number;
    shipping_fee: number;
    total: number;
    valid_until?: string;
    notes?: string;
    terms?: string;
    converted_order_id?: string;
    created_by?: string;
    creator_name?: string;
    created_at: string;
    updated_at: string;
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
    draft: 'Nháp',
    sent: 'Đã gửi',
    accepted: 'Đã chấp nhận',
    rejected: 'Từ chối',
    expired: 'Hết hạn',
    converted: 'Đã chuyển đơn',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
    draft: 'bg-slate-100 text-slate-600',
    sent: 'bg-blue-100 text-blue-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-amber-100 text-amber-700',
    converted: 'bg-primary-100 text-primary-700',
};

export async function fetchQuotes(token?: string): Promise<Quote[]> {
    try {
        const { data, error } = await supabase
            .rpc('fetch_quotes', { p_status: null, p_limit: 200 });
        if (error) {
            console.error('[fetchQuotes] RPC error:', error);
            return [];
        }
        return (data || []).map(mapQuoteFromDb);
    } catch (err) {
        console.error('[fetchQuotes] Exception:', err);
        return [];
    }
}

export async function createQuote(quote: Partial<Quote>, token?: string): Promise<Quote | null> {
    try {
        const payload = {
            customer_id: quote.customer_id || null,
            customer_name: quote.customer_name || '',
            customer_phone: quote.customer_phone || null,
            customer_address: quote.customer_address || null,
            status: quote.status || 'draft',
            items: JSON.stringify(quote.items || []),
            subtotal: quote.subtotal || 0,
            discount_amount: quote.discount_amount || 0,
            discount_type: quote.discount_type || 'amount',
            vat_percent: quote.vat_percent || 0,
            shipping_fee: quote.shipping_fee || 0,
            total: quote.total || 0,
            valid_until: quote.valid_until || null,
            notes: quote.notes || null,
            terms: quote.terms || null,
            created_by: quote.created_by || null,
            creator_name: quote.creator_name || null,
        };

        const { data, error } = await supabase
            .from('quotes')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('[createQuote] Error:', error);
            return null;
        }
        return mapQuoteFromDb(data);
    } catch (err) {
        console.error('[createQuote] Exception:', err);
        return null;
    }
}

export async function updateQuote(id: string, updates: Partial<Quote>, token?: string): Promise<boolean> {
    try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.customer_name !== undefined) payload.customer_name = updates.customer_name;
        if (updates.customer_phone !== undefined) payload.customer_phone = updates.customer_phone;
        if (updates.customer_address !== undefined) payload.customer_address = updates.customer_address;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.items !== undefined) payload.items = JSON.stringify(updates.items);
        if (updates.subtotal !== undefined) payload.subtotal = updates.subtotal;
        if (updates.discount_amount !== undefined) payload.discount_amount = updates.discount_amount;
        if (updates.discount_type !== undefined) payload.discount_type = updates.discount_type;
        if (updates.vat_percent !== undefined) payload.vat_percent = updates.vat_percent;
        if (updates.shipping_fee !== undefined) payload.shipping_fee = updates.shipping_fee;
        if (updates.total !== undefined) payload.total = updates.total;
        if (updates.valid_until !== undefined) payload.valid_until = updates.valid_until;
        if (updates.notes !== undefined) payload.notes = updates.notes;
        if (updates.terms !== undefined) payload.terms = updates.terms;

        const { error } = await supabase
            .from('quotes')
            .update(payload)
            .eq('id', id);

        if (error) {
            console.error('[updateQuote] Error:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[updateQuote] Exception:', err);
        return false;
    }
}

export async function deleteQuote(id: string): Promise<boolean> {
    try {
        const { error } = await supabase.from('quotes').delete().eq('id', id);
        if (error) {
            console.error('[deleteQuote] Error:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[deleteQuote] Exception:', err);
        return false;
    }
}

export async function convertQuoteToOrder(quote: Quote, userId: string, token?: string): Promise<string | null> {
    try {
        // Create order from quote
        const orderPayload = {
            customer_name: quote.customer_name,
            customer_id: quote.customer_id || null,
            receiver_phone: quote.customer_phone || null,
            receiver_address: quote.customer_address || null,
            status: 'pending',
            source: 'SALES',
            items: JSON.stringify(quote.items.map(it => ({
                productId: it.productId || '',
                name: it.name,
                sku: it.sku || '',
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                subtotal: it.subtotal,
                isGift: it.isGift || false,
            }))),
            total_amount: quote.total,
            notes: quote.notes || null,
            vat: quote.vat_percent || 0,
            shipping_fee: quote.shipping_fee || 0,
            telesales_user_id: userId,
            created_by: userId,
        };

        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert(orderPayload)
            .select('id')
            .single();

        if (orderError || !orderData) {
            console.error('[convertQuoteToOrder] Order creation failed:', orderError);
            return null;
        }

        // Update quote status to converted
        await supabase
            .from('quotes')
            .update({
                status: 'converted',
                converted_order_id: orderData.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', quote.id);

        return orderData.id;
    } catch (err) {
        console.error('[convertQuoteToOrder] Exception:', err);
        return null;
    }
}

function mapQuoteFromDb(row: any): Quote {
    return {
        id: row.id,
        readable_id: row.readable_id,
        customer_id: row.customer_id,
        customer_name: row.customer_name || '',
        customer_phone: row.customer_phone,
        customer_address: row.customer_address,
        status: row.status || 'draft',
        items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
        subtotal: Number(row.subtotal) || 0,
        discount_amount: Number(row.discount_amount) || 0,
        discount_type: row.discount_type || 'amount',
        vat_percent: Number(row.vat_percent) || 0,
        shipping_fee: Number(row.shipping_fee) || 0,
        total: Number(row.total) || 0,
        valid_until: row.valid_until,
        notes: row.notes,
        terms: row.terms,
        converted_order_id: row.converted_order_id,
        created_by: row.created_by,
        creator_name: row.creator_name,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}
