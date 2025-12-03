import { LayoutDashboard, Users, ShoppingBag, ShoppingCart, FileText, UserCheck, UserPlus, List } from "lucide-react";

export const ROLES = {
    ADMIN: "admin",
    CUSTOMER: "customer",
    SALES: "sales",
    CTV: "ctv",
} as const;

export const NAV_ITEMS = {
    [ROLES.ADMIN]: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Orders", href: "/admin/orders", icon: FileText },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Customers", href: "/admin/customers", icon: UserCheck },
        { label: "Products", href: "/admin/products", icon: ShoppingBag },
    ],
    [ROLES.CUSTOMER]: [
        { label: "Dashboard", href: "/customer", icon: LayoutDashboard },
        { label: "Catalogue", href: "/customer/catalogue", icon: ShoppingBag },
        { label: "Cart", href: "/customer/cart", icon: ShoppingCart },
        { label: "Orders", href: "/customer/orders", icon: FileText },
    ],
    [ROLES.SALES]: [
        { label: "Dashboard", href: "/sales", icon: LayoutDashboard },
        { label: "Orders", href: "/sales/orders", icon: FileText },
        { label: "My Customers", href: "/sales/my-customers", icon: Users },
        { label: "Create Order", href: "/sales/create-order", icon: ShoppingCart },
    ],
    [ROLES.CTV]: [
        { label: "Dashboard", href: "/ctv", icon: LayoutDashboard },
        { label: "New Lead", href: "/ctv/new-lead", icon: UserPlus },
        { label: "My Leads", href: "/ctv/my-leads", icon: List },
    ],
};
