
export type Role = "admin" | "telesales" | "sales" | "ctv" | "customer" | "recruiter" | "warehouse" | "marketing" | "ecommerce" | "rnd" | "shipper" | "accountant" | "sale_admin" | "livestream" | "sales_gt" | "media_creator";

export type PermissionKey =
    // Leads & CRM
    | 'leads.read'
    | 'leads.write'
    // Orders
    | 'orders.read'
    | 'orders.create'
    | 'orders.write'
    // Chat
    | 'chat.use'
    // Docs
    | 'docs.read'
    | 'docs.write'
    // Inventory
    | 'inventory.read'
    | 'inventory.write'
    // Reports
    | 'reports.read';

// Module Keys
export type ModuleKey = 'leads' | 'orders';

export interface ModuleDef {
    key: ModuleKey;
    title: string;
    path: `/m/${string}`;
    requiredPerms: PermissionKey[];
    navGroup?: string;
    // Dynamic import loader for the screen component
    loader: () => Promise<{ default: React.ComponentType<any> }>;
}
