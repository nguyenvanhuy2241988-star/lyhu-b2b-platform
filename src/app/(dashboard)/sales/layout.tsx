import DashboardShell from "@/components/layout/DashboardShell";
import { ROLES } from "@/lib/constants";

export default function SalesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardShell role={ROLES.SALES} title="Sales Dashboard">
            {children}
        </DashboardShell>
    );
}
