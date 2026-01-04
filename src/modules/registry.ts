import type { ModuleDef } from './types';

export const MODULES: Record<string, ModuleDef> = {
    leads: {
        key: 'leads',
        title: 'Leads (CRM)',
        path: '/m/leads',
        requiredPerms: ['leads.read'],
        navGroup: 'CRM',
        // Lazy load module screen
        loader: () => import('@/modules/leads/Screen'),
    },
    orders: {
        key: 'orders',
        title: 'Orders',
        path: '/m/orders',
        requiredPerms: ['orders.read'],
        navGroup: 'Sales',
        // Lazy load module screen
        loader: () => import('@/modules/orders/Screen'),
    },
};
