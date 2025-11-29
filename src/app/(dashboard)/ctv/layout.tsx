import DashboardShell from "@/components/layout/DashboardShell";
import { ROLES } from "@/lib/constants";

export default function CTVLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardShell role={ROLES.CTV} title="CTV Dashboard">
            {children}
        </DashboardShell>
    );
}
