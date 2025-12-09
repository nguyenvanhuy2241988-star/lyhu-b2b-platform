import { LayoutDashboard, Users, ShoppingBag, ShoppingCart, FileText, UserCheck, UserPlus, List, Wallet, Gift, TrendingUp, CreditCard, Trophy, User } from "lucide-react";

export const ROLES = {
    ADMIN: "admin",
    CUSTOMER: "customer",
    SALES: "sales",
    CTV: "ctv",
} as const;

export const NAV_ITEMS = {
    [ROLES.ADMIN]: [
        { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
        { label: "Đơn hàng", href: "/admin/orders", icon: FileText },
        { label: "Người dùng", href: "/admin/users", icon: Users },
        { label: "Khách hàng", href: "/admin/customers", icon: UserCheck },
        { label: "Sản phẩm", href: "/admin/products", icon: ShoppingBag },
        { label: "Hiệu suất CTV", href: "/admin/ctv", icon: TrendingUp },
        { label: "Giới thiệu", href: "/admin/referrals", icon: Gift },
        { label: "Rút tiền", href: "/admin/payouts", icon: CreditCard },
        { label: "Bảng xếp hạng", href: "/admin/leaderboard", icon: Trophy },
    ],
    [ROLES.CUSTOMER]: [
        { label: "Tổng quan", href: "/customer", icon: LayoutDashboard },
        { label: "Danh mục sản phẩm", href: "/customer/catalogue", icon: ShoppingBag },
        { label: "Giỏ hàng", href: "/customer/cart", icon: ShoppingCart },
        { label: "Đơn hàng", href: "/customer/orders", icon: FileText },
    ],
    [ROLES.SALES]: [
        { label: "Tổng quan", href: "/sales", icon: LayoutDashboard },
        { label: "Đơn hàng", href: "/sales/orders", icon: FileText },
        { label: "Khách hàng của tôi", href: "/sales/my-customers", icon: Users },
        { label: "Tạo đơn hàng", href: "/sales/create-order", icon: ShoppingCart },
    ],
    [ROLES.CTV]: [
        { label: "Tổng quan", href: "/ctv", icon: LayoutDashboard },
        { label: "Hồ sơ CTV", href: "/ctv/profile", icon: User },
        { label: "Ví CTV", href: "/ctv/wallet", icon: Wallet },
        { label: "Tạo đơn hàng", href: "/ctv/create-order", icon: ShoppingCart },
        { label: "Đơn hàng", href: "/ctv/orders", icon: FileText },
        { label: "Rút tiền", href: "/ctv/payouts", icon: CreditCard },
        { label: "Bảng xếp hạng", href: "/ctv/leaderboard", icon: Trophy },
        { label: "Giới thiệu", href: "/ctv/referrals", icon: Gift },
        { label: "Tạo Lead mới", href: "/ctv/new-lead", icon: UserPlus },
        { label: "Lead của tôi", href: "/ctv/my-leads", icon: List },
    ],
};



