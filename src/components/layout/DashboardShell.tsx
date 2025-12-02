"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ROLES, NAV_ITEMS } from "@/lib/constants";
import { getCurrentUser, logout } from "@/lib/auth";

interface DashboardShellProps {
    children: React.ReactNode;
    role: keyof typeof NAV_ITEMS;
    title: string;
}

export default function DashboardShell({ children, role, title }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            router.replace("/login");
            return;
        }
        if (user.role !== role) {
            router.replace("/login");
        }
    }, [router, role]);

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar
                role={role}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <Topbar
                    title={title}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
