"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ROLES } from "@/lib/constants";

export default function RecruitmentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useAuthGuard(ROLES.RECRUITER as any);

    return (
        <DashboardShell role={ROLES.RECRUITER} title="Tuyển dụng">
            {children}
        </DashboardShell>
    );
}
