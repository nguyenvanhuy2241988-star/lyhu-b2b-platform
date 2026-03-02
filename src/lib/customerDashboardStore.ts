// lib/customerDashboardStore.ts
// Aggregate queries for Admin Customer Dashboard

import { supabase } from '@/lib/supabaseClient';
import { DEAL_STAGE_LABELS } from '@/lib/crmDealsStore';

export interface CustomerDashboardStats {
    totalCustomers: number;
    newThisMonth: number;
    contacted: number;
    withOrders: number;
    cold: number;
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

export interface DistributionItem {
    key: string;
    label: string;
    count: number;
    color: string;
}

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

const PIPELINE_COLORS = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-amber-500',
    'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-emerald-500',
    'bg-rose-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500',
];

const TYPE_LABELS: Record<string, string> = {
    tap_hoa: 'Tạp hóa', mini_mart: 'Mini mart', dai_ly: 'Đại lý', npp: 'NPP', sieu_thi: 'Siêu thị'
};

/**
 * Fetch summary stats for dashboard cards.
 */
export const fetchCustomerDashboardStats = async (range?: DateRange): Promise<CustomerDashboardStats> => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Use range if provided, otherwise default to current month
    const startStr = range ? range.startDate.toISOString() : new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endStr = range ? range.endDate.toISOString() : now.toISOString();

    // 1. Total customers (always all-time)
    const { count: totalCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

    // 2. New in period
    const { count: newInPeriod } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startStr)
        .lte('created_at', endStr);

    // 3. Contacted in period
    const { data: contactedData } = await supabase
        .from('crm_activities')
        .select('customer_id')
        .gte('created_at', startStr)
        .lte('created_at', endStr)
        .not('customer_id', 'is', null);

    const contactedSet = new Set((contactedData || []).map((a: any) => a.customer_id));

    // 4. With orders in period
    const { data: orderData } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('status', 'delivered')
        .gte('created_at', startStr)
        .lte('created_at', endStr)
        .not('customer_id', 'is', null);

    const withOrdersSet = new Set((orderData || []).map((o: any) => o.customer_id));

    // 5. Cold: no activity in 30 days (always relative to now)
    const { data: recentActivityData } = await supabase
        .from('crm_activities')
        .select('customer_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('customer_id', 'is', null);

    const recentSet = new Set((recentActivityData || []).map((a: any) => a.customer_id));
    const cold = (totalCustomers || 0) - recentSet.size;

    return {
        totalCustomers: totalCustomers || 0,
        newThisMonth: newInPeriod || 0,
        contacted: contactedSet.size,
        withOrders: withOrdersSet.size,
        cold: Math.max(0, cold),
    };
};

/**
 * Fetch pipeline funnel with Vietnamese labels.
 */
export const fetchPipelineStats = async (): Promise<PipelineItem[]> => {
    const { data: deals } = await supabase
        .from('crm_deals')
        .select('stage, customer_id')
        .eq('status', 'open');

    const stageMap = new Map<string, Set<string>>();
    for (const deal of (deals || [])) {
        const d = deal as any;
        if (!d.stage) continue;
        if (!stageMap.has(d.stage)) stageMap.set(d.stage, new Set());
        if (d.customer_id) stageMap.get(d.stage)!.add(d.customer_id);
    }

    return Array.from(stageMap.entries())
        .map(([stage, customers], idx) => ({
            stage,
            label: (DEAL_STAGE_LABELS as Record<string, string>)[stage] || stage,
            count: customers.size,
            color: PIPELINE_COLORS[idx % PIPELINE_COLORS.length],
        }))
        .sort((a, b) => b.count - a.count);
};

/**
 * Fetch top customers by delivered order revenue.
 */
export const fetchTopCustomers = async (limit: number = 10, range?: DateRange): Promise<TopCustomer[]> => {
    let query = supabase
        .from('orders')
        .select('customer_id, customer_name, total_amount')
        .eq('status', 'delivered')
        .not('customer_id', 'is', null);

    if (range) {
        query = query
            .gte('created_at', range.startDate.toISOString())
            .lte('created_at', range.endDate.toISOString());
    }

    const { data: orders } = await query;
    if (!orders || orders.length === 0) return [];

    const custMap = new Map<string, { name: string; totalOrders: number; totalRevenue: number }>();
    for (const o of orders) {
        const order = o as any;
        const cid = order.customer_id;
        if (!cid) continue;
        if (!custMap.has(cid)) {
            custMap.set(cid, { name: order.customer_name || 'N/A', totalOrders: 0, totalRevenue: 0 });
        }
        const entry = custMap.get(cid)!;
        entry.totalOrders += 1;
        entry.totalRevenue += order.total_amount || 0;
    }

    const sorted = Array.from(custMap.entries())
        .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
        .slice(0, limit);

    const customerIds = sorted.map(([id]) => id);
    const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone, type, owner_user_id')
        .in('id', customerIds);

    const customerMap = new Map((customers || []).map((c: any) => [c.id, c]));

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

/**
 * Fetch customer distribution by province (top 10).
 */
export const fetchProvinceDistribution = async (): Promise<DistributionItem[]> => {
    const { data: customers } = await supabase
        .from('customers')
        .select('province');

    const provinceMap = new Map<string, number>();
    for (const c of (customers || [])) {
        const prov = (c as any).province || 'Chưa cập nhật';
        provinceMap.set(prov, (provinceMap.get(prov) || 0) + 1);
    }

    return Array.from(provinceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count], idx) => ({
            key,
            label: key,
            count,
            color: PIPELINE_COLORS[idx % PIPELINE_COLORS.length],
        }));
};

/**
 * Fetch customer distribution by owner (NV phụ trách).
 */
export const fetchOwnerDistribution = async (): Promise<DistributionItem[]> => {
    const { data: customers } = await supabase
        .from('customers')
        .select('owner_user_id');

    const ownerMap = new Map<string, number>();
    for (const c of (customers || [])) {
        const oid = (c as any).owner_user_id || '__none__';
        ownerMap.set(oid, (ownerMap.get(oid) || 0) + 1);
    }

    // Get owner names
    const ownerIds = Array.from(ownerMap.keys()).filter(k => k !== '__none__');
    const { data: profiles } = ownerIds.length > 0
        ? await supabase.from('profiles').select('id, full_name').in('id', ownerIds)
        : { data: [] };
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name || 'N/A']));

    return Array.from(ownerMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count], idx) => ({
            key,
            label: key === '__none__' ? 'Chưa phân bổ' : (profileMap.get(key) as string || 'N/A'),
            count,
            color: PIPELINE_COLORS[idx % PIPELINE_COLORS.length],
        }));
};

/**
 * Fetch customer distribution by type (Loại hình).
 */
export const fetchTypeDistribution = async (): Promise<DistributionItem[]> => {
    const { data: customers } = await supabase
        .from('customers')
        .select('type');

    const typeMap = new Map<string, number>();
    for (const c of (customers || [])) {
        const t = (c as any).type || '__none__';
        typeMap.set(t, (typeMap.get(t) || 0) + 1);
    }

    return Array.from(typeMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([key, count], idx) => ({
            key,
            label: key === '__none__' ? 'Chưa phân loại' : (TYPE_LABELS[key] || key),
            count,
            color: PIPELINE_COLORS[idx % PIPELINE_COLORS.length],
        }));
};
