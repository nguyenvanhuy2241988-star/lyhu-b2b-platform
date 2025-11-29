import DashboardShell from "@/components/layout/DashboardShell";
import { ROLES } from "@/lib/constants";

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardShell role={ROLES.CUSTOMER} title="Customer Dashboard">
            {children}
        </DashboardShell>
    );
}
