"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { UserRole } from "@/lib/auth";

const ALLOWED_ROLES: UserRole[] = ['admin', 'sale_admin', 'telesales', 'sales'];

export default function CRMLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardShell title="CRM" allowedRoles={ALLOWED_ROLES}>
            {children}
        </DashboardShell>
    );
}
