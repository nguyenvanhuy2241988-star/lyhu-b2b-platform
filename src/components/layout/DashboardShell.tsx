"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ROLES } from "@/lib/constants";

interface DashboardShellProps {
    children: React.ReactNode;
    role: keyof typeof ROLES;
    title?: string;
}

export default function DashboardShell({ children, role, title }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
