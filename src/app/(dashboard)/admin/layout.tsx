import DashboardShell from "@/components/layout/DashboardShell";
import { ROLES } from "@/lib/constants";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardShell role={ROLES.ADMIN} title="Admin Dashboard">
            {children}
        </DashboardShell>
    );
}
