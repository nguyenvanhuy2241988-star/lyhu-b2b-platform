import { createClient } from "@/lib/supabaseClient";

const supabase = createClient();

export interface RevenueDataPoint {
    date: string;
    revenue: number;
    orders: number;
}

export interface LowStockItem {
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    minStockLevel: number;
    warehouseName: string;
}

/**
 * Get revenue data for chart (last N days)
 */
export async function getRevenueByDate(days: number = 30): Promise<RevenueDataPoint[]> {
    const { data, error } = await supabase
        .rpc('get_revenue_by_date', { p_days: days });

    if (error) {
        console.error('[Dashboard] Error fetching revenue:', error);
        // Fallback: query directly
        return getRevenueByDateFallback(days);
    }

    return (data || []).map((row: any) => ({
        date: row.date,
        revenue: parseFloat(row.revenue) || 0,
        orders: row.order_count || 0
    }));
}

/**
 * Fallback query if RPC doesn't exist
 */
async function getRevenueByDateFallback(days: number): Promise<RevenueDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', startDate.toISOString())
        .neq('status', 'cancelled');

    if (error || !data) return [];

    // Group by date
    const grouped = data.reduce((acc: Record<string, { revenue: number; orders: number }>, order: any) => {
        const date = new Date(order.created_at).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit'
        });
        if (!acc[date]) {
            acc[date] = { revenue: 0, orders: 0 };
        }
        acc[date].revenue += order.total_amount || 0;
        acc[date].orders += 1;
        return acc;
    }, {});

    return Object.entries(grouped).map(([date, data]: [string, any]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
    }));
}

/**
 * Get low stock items
 */
export async function getLowStockItems(): Promise<LowStockItem[]> {
    const { data, error } = await supabase
        .rpc('get_low_stock_items');

    if (error) {
        console.error('[Dashboard] Error fetching low stock:', error);
        // Fallback: query directly
        return getLowStockItemsFallback();
    }

    return (data || []).map((row: any) => ({
        productId: row.product_id,
        productName: row.product_name,
        sku: row.sku,
        currentStock: row.current_stock,
        minStockLevel: row.min_stock_level,
        warehouseName: row.warehouse_name
    }));
}

/**
 * Fallback query if RPC doesn't exist
 */
async function getLowStockItemsFallback(): Promise<LowStockItem[]> {
    const { data, error } = await supabase
        .from('inventory_levels')
        .select(`
            product_id,
            quantity_on_hand,
            min_stock_level,
            product:products(name, sku),
            warehouse:warehouses(name)
        `);

    if (error || !data) return [];

    // Filter low stock items (default min = 10)
    return data
        .filter((item: any) => item.quantity_on_hand < (item.min_stock_level || 10))
        .map((item: any) => ({
            productId: item.product_id,
            productName: (item.product as any)?.name || 'Unknown',
            sku: (item.product as any)?.sku || '',
            currentStock: item.quantity_on_hand,
            minStockLevel: item.min_stock_level || 10,
            warehouseName: (item.warehouse as any)?.name || ''
        }));
}
