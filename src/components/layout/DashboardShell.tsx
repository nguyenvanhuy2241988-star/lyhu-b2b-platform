"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { UserRole } from "@/lib/auth";
import { WelcomeGreeting } from "@/components/common/WelcomeGreeting";

interface DashboardShellProps {
    role?: UserRole;
    allowedRoles?: UserRole[];
    title: string;
    children: React.ReactNode;
}

export default function DashboardShell({ children, role, allowedRoles, title }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, role: userRole, isLoading } = useAuth();
    const router = useRouter();

    // Determine the role to display in Sidebar
    // Priority: If user is ADMIN, always show Admin sidebar. Otherwise respect prop role (layout) > Context > User object
    const sidebarRole = (userRole === 'admin' ? 'admin' : (role || userRole || user?.role || 'admin')) as UserRole;

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
                role={sidebarRole}
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
                <WelcomeGreeting />
            </div>
        </div>
    );
}
