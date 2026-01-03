"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { UserRole } from "@/lib/auth";

interface DashboardShellProps {
    role?: UserRole;
    allowedRoles?: UserRole[];
    title: string;
    children: React.ReactNode;
}

export default function DashboardShell({ children, role, allowedRoles, title }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, isLoading } = useAuth();
    const router = useRouter();

    // Determine the role to display in Sidebar
    const displayRole = role || user?.role || 'telesales';

    if (isLoading && !user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar
                role={displayRole}
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
