"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { usePathname } from "next/navigation";

export default function SharedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const getTitle = () => {
        if (pathname?.includes("/clean-ai")) return "Khử nhãn AI Facebook";
        if (pathname?.includes("/bot-center")) return "Trung tâm BOT Tự động";
        if (pathname?.includes("/media-library")) return "Thư viện Media";
        if (pathname?.includes("/social-accounts")) return "Tài khoản Mạng xã hội";
        return "Tổng quan";
    };

    // No useAuthGuard — this is accessible to all authenticated roles.
    // DashboardShell auto-detects the user's role for sidebar display.
    return (
        <DashboardShell title={getTitle()}>
            {children}
        </DashboardShell>
    );
}
