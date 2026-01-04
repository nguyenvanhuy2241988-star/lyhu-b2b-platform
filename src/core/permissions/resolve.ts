import type { Role, PermissionKey } from '@/modules/types';

// STATIC MAPPING (Option A)
// This serves as the single source of truth for "who can do what".
// In the future (Option B), this can be potentially loaded from DB.

const ROLE_PERMS: Record<Role, PermissionKey[]> = {
    admin: [
        'leads.read', 'leads.write',
        'orders.read', 'orders.create', 'orders.write',
        'chat.use',
        'docs.read', 'docs.write',
        'inventory.read', 'inventory.write',
        'reports.read'
    ],
    telesales: [
        'leads.read', 'leads.write',
        'orders.read', 'orders.create',
        'chat.use',
        'docs.read'
    ],
    sales: [
        'leads.read',
        'orders.read', 'orders.create',
        'chat.use',
        'docs.read'
    ],
    sale_admin: [
        'leads.read',
        'orders.read', 'orders.write',
        'chat.use',
        'docs.read',
        'reports.read'
    ],
    warehouse: [
        'inventory.read', 'inventory.write',
        'orders.read',
        'docs.read'
    ],
    accountant: [
        'orders.read',
        'reports.read',
        'docs.read'
    ],
    shipper: [
        'orders.read',
        'docs.read'
    ],
    marketing: [
        'docs.read'
    ],
    ecommerce: [
        'orders.read',
        'inventory.read',
        'chat.use'
    ],
    rnd: [
        'docs.read', 'docs.write'
    ],
    recruiter: [
        'docs.read'
    ],
    ctv: [
        'orders.create', 'orders.read',
        'docs.read'
    ],
    customer: [
        'orders.read'
    ],
    livestream: [
        'orders.read', 'orders.create'
    ]
};

// --- Resolver ---

export function resolvePermissions(role: Role): Set<PermissionKey> {
    const list = ROLE_PERMS[role] || [];
    return new Set(list);
}

// Helper to check if a user with a certain role has ALL permissions in needed list
export function hasAllPermissions(role: Role, needed: PermissionKey[]): boolean {
    const userPerms = resolvePermissions(role);
    return needed.every(p => userPerms.has(p));
}

// Helper to check if a user has AT LEAST ONE permission
export function hasAnyPermission(role: Role, candidates: PermissionKey[]): boolean {
    const userPerms = resolvePermissions(role);
    return candidates.some(p => userPerms.has(p));
}
