// lib/customerDashboardStore.ts
// Aggregate queries for Admin Customer Dashboard

import { supabase } from '@/lib/supabaseClient';

export interface CustomerDashboardStats {
    totalCustomers: number;
    newThisMonth: number;
    contacted: number;      // distinct customers with ≥1 activity
    withOrders: number;     // distinct customers with ≥1 delivered order
    cold: number;           // no activity in last 30 days
}

export interface PipelineItem {
    stage: string;
    label: string;
    count: number;
    color: string;
}

export interface TopCustomer {
    id: string;
    name: string;
    phone: string;
    type: string;
    totalOrders: number;
    totalRevenue: number;
    ownerName?: string;
}

const PIPELINE_COLORS = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-amber-500',
    'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-emerald-500',
    'bg-rose-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500',
];

/**
 * Fetch summary stats for dashboard cards.
 */
export const fetchCustomerDashboardStats = async (): Promise<CustomerDashboardStats> => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Total customers
    const { count: totalCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

    // 2. New this month
    const { count: newThisMonth } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

    // 3. Contacted (distinct customers with any activity)
    const { data: contactedData } = await supabase
        .from('crm_activities')
        .select('customer_id')
        .not('customer_id', 'is', null);

    const contactedSet = new Set((contactedData || []).map((a: any) => a.customer_id));
    const contacted = contactedSet.size;

    // 4. With orders (distinct customers with delivered orders)
    const { data: orderData } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('status', 'delivered')
        .not('customer_id', 'is', null);

    const withOrdersSet = new Set((orderData || []).map((o: any) => o.customer_id));
    const withOrders = withOrdersSet.size;

    // 5. Cold: no activity in 30 days
    const { data: recentActivityData } = await supabase
        .from('crm_activities')
        .select('customer_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('customer_id', 'is', null);

    const recentSet = new Set((recentActivityData || []).map((a: any) => a.customer_id));
    const cold = (totalCustomers || 0) - recentSet.size;

    return {
        totalCustomers: totalCustomers || 0,
        newThisMonth: newThisMonth || 0,
        contacted,
        withOrders,
        cold: Math.max(0, cold),
    };
};

/**
 * Fetch pipeline funnel: count of distinct customers per CRM deal stage (open deals only).
 * Stages are dynamic — fetched directly from data, no hardcoded config.
 */
export const fetchPipelineStats = async (): Promise<PipelineItem[]> => {
    const { data: deals } = await supabase
        .from('crm_deals')
        .select('stage, customer_id')
        .eq('status', 'open');

    // Count distinct customers per stage
    const stageMap = new Map<string, Set<string>>();
    for (const deal of (deals || [])) {
        const d = deal as any;
        if (!d.stage) continue;
        if (!stageMap.has(d.stage)) stageMap.set(d.stage, new Set());
        if (d.customer_id) stageMap.get(d.stage)!.add(d.customer_id);
    }

    // Sort by count desc, assign colors dynamically
    return Array.from(stageMap.entries())
        .map(([stage, customers], idx) => ({
            stage,
            label: stage,
            count: customers.size,
            color: PIPELINE_COLORS[idx % PIPELINE_COLORS.length],
        }))
        .sort((a, b) => b.count - a.count);
};

/**
 * Fetch top customers by delivered order revenue.
 */
export const fetchTopCustomers = async (limit: number = 10): Promise<TopCustomer[]> => {
    // Get all delivered orders with customer info
    const { data: orders } = await supabase
        .from('orders')
        .select('customer_id, customer_name, total_amount')
        .eq('status', 'delivered')
        .not('customer_id', 'is', null);

    if (!orders || orders.length === 0) return [];

    // Aggregate by customer_id
    const custMap = new Map<string, { name: string; totalOrders: number; totalRevenue: number }>();
    for (const o of orders) {
        const order = o as any;
        const cid = order.customer_id;
        if (!cid) continue;
        if (!custMap.has(cid)) {
            custMap.set(cid, {
                name: order.customer_name || 'N/A',
                totalOrders: 0,
                totalRevenue: 0,
            });
        }
        const entry = custMap.get(cid)!;
        entry.totalOrders += 1;
        entry.totalRevenue += order.total_amount || 0;
    }

    // Sort by revenue desc, take top N
    const sorted = Array.from(custMap.entries())
        .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
        .slice(0, limit);

    // Enrich with customer info
    const customerIds = sorted.map(([id]) => id);
    const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone, type, owner_user_id')
        .in('id', customerIds);

    const customerMap = new Map((customers || []).map((c: any) => [c.id, c]));

    // Get owner names
    const ownerIds = Array.from(new Set((customers || []).map((c: any) => c.owner_user_id).filter(Boolean)));
    const { data: profiles } = ownerIds.length > 0
        ? await supabase.from('profiles').select('id, full_name').in('id', ownerIds)
        : { data: [] };
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

    return sorted.map(([id, stats]) => {
        const cust = customerMap.get(id) as any;
        return {
            id,
            name: cust?.name || stats.name,
            phone: cust?.phone || '',
            type: cust?.type || '',
            totalOrders: stats.totalOrders,
            totalRevenue: stats.totalRevenue,
            ownerName: cust?.owner_user_id ? (profileMap.get(cust.owner_user_id) as string | undefined) : undefined,
        };
    });
};
