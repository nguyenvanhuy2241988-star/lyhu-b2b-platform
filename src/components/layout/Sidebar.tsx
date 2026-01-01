"use client";

import Link from "next/link";
import NextImage from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { LucideIcon } from "lucide-react";
import { UserRole } from "@/lib/auth";
import { useEffect, useState } from "react";
import { getMyTasks } from "@/lib/telesalesTasksStore";
import { calculateKpiMetrics, calculateKpiProgress } from "@/lib/telesalesKpiSelectors";

interface SidebarProps {
    role: UserRole;
    isOpen: boolean;
    onClose?: () => void;
    // We could pass kpiStatus from layout, but fetching here is simpler for now
}

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const items = NAV_ITEMS[role] || [];
    const [showKpiBadge, setShowKpiBadge] = useState(false);

    useEffect(() => {
        // Only check for Telesales role or if the link exists
        if (role === 'telesales' || role === 'admin') { // Check role
            const checkKpi = async () => {
                try {
                    const tasks = await getMyTasks();
                    const now = new Date();
                    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
                    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

                    const metrics = calculateKpiMetrics(tasks, startOfDay, endOfDay);
                    const { status } = calculateKpiProgress(metrics);

                    // Show badge if warning or bad
                    setShowKpiBadge(status === 'warning' || status === 'bad');
                } catch (e) {
                    console.error("Sidebar KPI check failed", e);
                }
            };

            checkKpi();

            // Listen for updates
            window.addEventListener("telesales-tasks-updated", checkKpi);
            return () => window.removeEventListener("telesales-tasks-updated", checkKpi);
        }
    }, [role]);

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar Container - CORE APP Style */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-28 items-center border-b border-slate-100 px-4 py-6 justify-center bg-white">
                    <Link href="/" className="flex items-center w-full justify-center">
                        <NextImage
                            src="/logo-full.png"
                            alt="LYHU Logo"
                            width={180}
                            height={80}
                            className="h-20 w-auto object-contain max-w-[90%]"
                            priority
                        />
                    </Link>
                </div>

                <nav className="p-4 space-y-1">
                    {items.map((item) => {
                        const Icon = item.icon as LucideIcon;
                        const isActive = pathname === item.href;
                        const isKpiLink = item.href === '/telesales/earnings';

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm relative",
                                    isActive
                                        ? "bg-primary-50 text-primary-600 font-medium"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                                {isKpiLink && showKpiBadge && (
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
