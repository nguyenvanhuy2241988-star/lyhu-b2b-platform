"use client";

import Link from "next/link";
import NextImage from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { LucideIcon, GripVertical, Check, RotateCcw } from "lucide-react";
import { UserRole } from "@/lib/auth";
import { useEffect, useState, useRef, useCallback } from "react";
import { getMyTasks } from "@/lib/telesalesTasksStore";
import { calculateKpiMetrics, calculateKpiProgress } from "@/lib/telesalesKpiSelectors";
import { useChatStore } from "@/lib/chatStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { loadNavOrder, saveNavOrder, applyNavOrder } from "@/lib/navOrderStore";

interface SidebarProps {
    role: UserRole;
    isOpen: boolean;
    onClose?: () => void;
}

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const defaultItems = NAV_ITEMS[role] || [];
    const [showKpiBadge, setShowKpiBadge] = useState(false);
    const { getTotalUnreadCount } = useChatStore();
    const chatUnread = role === 'customer' ? 0 : getTotalUnreadCount();
    const { user } = useAuth();

    // ── Drag & Drop state ──
    const [orderedItems, setOrderedItems] = useState(defaultItems);
    const [isReordering, setIsReordering] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [orderLoaded, setOrderLoaded] = useState(false);
    const dragCounter = useRef(0);

    // ── Load saved order ──
    useEffect(() => {
        if (!user?.id || !role) return;
        (async () => {
            const saved = await loadNavOrder(user.id, role);
            const ordered = applyNavOrder(defaultItems, saved);
            setOrderedItems(ordered);
            setOrderLoaded(true);
        })();
    }, [user?.id, role, defaultItems]);

    // ── Update items when defaultItems change (role switch) ──
    useEffect(() => {
        if (!orderLoaded) {
            setOrderedItems(defaultItems);
        }
    }, [defaultItems, orderLoaded]);

    // ── KPI badge ──
    useEffect(() => {
        if (role === 'telesales' || role === 'recruiter' || role === 'admin') {
            const checkKpi = async () => {
                try {
                    const tasks = await getMyTasks();
                    const now = new Date();
                    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
                    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
                    const metrics = calculateKpiMetrics(tasks, startOfDay, endOfDay);
                    const { status } = calculateKpiProgress(metrics);
                    setShowKpiBadge(status === 'warning' || status === 'bad');
                } catch (e) {
                    console.error("Sidebar KPI check failed", e);
                }
            };
            checkKpi();
            window.addEventListener("telesales-tasks-updated", checkKpi);
            return () => window.removeEventListener("telesales-tasks-updated", checkKpi);
        }
    }, [role]);

    // ── Drag handlers ──
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
        // Make drag image slightly transparent
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = "0.5";
        }
    };

    const handleDragEnd = (e: React.DragEvent) => {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = "1";
        }
        setDragIndex(null);
        setDragOverIndex(null);
        dragCounter.current = 0;
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        dragCounter.current++;
        setDragOverIndex(index);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDragOverIndex(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
        if (isNaN(fromIndex) || fromIndex === dropIndex) return;

        setOrderedItems(prev => {
            const newItems = [...prev];
            const [moved] = newItems.splice(fromIndex, 1);
            newItems.splice(dropIndex, 0, moved);
            return newItems;
        });

        setDragIndex(null);
        setDragOverIndex(null);
        dragCounter.current = 0;
    };

    // ── Save order ──
    const handleSaveOrder = async () => {
        if (!user?.id) return;
        setSaving(true);
        const navOrder = orderedItems.map(item => item.href);
        await saveNavOrder(user.id, role, navOrder);
        setSaving(false);
        setIsReordering(false);
    };

    // ── Reset to default ──
    const handleResetOrder = async () => {
        setOrderedItems(defaultItems);
        if (user?.id) {
            setSaving(true);
            await saveNavOrder(user.id, role, []);
            setSaving(false);
        }
        setIsReordering(false);
    };

    const items = orderedItems;

    return (
        <>
            {/* Sidebar Container - Only visible on desktop (lg and up) */}
            <aside
                className={cn(
                    "hidden lg:flex fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-28 items-center border-b border-slate-100 px-4 py-6 justify-center bg-white shrink-0">
                    <Link href={role === 'customer' ? "/" : "/portal"} className="flex items-center w-full justify-center">
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

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {items.map((item, index) => {
                        const Icon = item.icon as LucideIcon;
                        const isActive = pathname === item.href;
                        const isKpiLink = item.href === '/telesales/earnings' || item.href === '/recruitment/earnings';
                        const isChatLink = item.href === '/chat';
                        const isDragOver = dragOverIndex === index && dragIndex !== index;
                        const isSeparator = item.label.startsWith("---");

                        if (isSeparator) {
                            return (
                                <div
                                    key={`sep-${index}`}
                                    className={cn(
                                        "border-t border-slate-100 my-2",
                                        isReordering && "cursor-grab"
                                    )}
                                    draggable={isReordering}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, index)}
                                />
                            );
                        }

                        return (
                            <div
                                key={item.href}
                                className={cn(
                                    "relative transition-all duration-150",
                                    isDragOver && "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-teal-400 before:rounded-full",
                                    dragIndex === index && "opacity-50"
                                )}
                                draggable={isReordering}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                            >
                                {isReordering ? (
                                    <div
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm cursor-grab active:cursor-grabbing",
                                            "bg-slate-50 border border-dashed border-slate-200 text-slate-600",
                                            isDragOver && "border-teal-300 bg-teal-50/50"
                                        )}
                                    >
                                        <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                    </div>
                                ) : (
                                    <Link
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
                                        {isChatLink && chatUnread > 0 && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                                                {chatUnread > 9 ? '9+' : chatUnread}
                                            </span>
                                        )}
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Reorder controls */}
                <div className="shrink-0 border-t border-slate-100 p-3 bg-white">
                    {isReordering ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSaveOrder}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
                            >
                                <Check className="w-3.5 h-3.5" />
                                {saving ? "Đang lưu..." : "Lưu"}
                            </button>
                            <button
                                onClick={handleResetOrder}
                                className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                                title="Đặt lại mặc định"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => { setIsReordering(false); }}
                                className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                            >
                                Hủy
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsReordering(true)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
                        >
                            <GripVertical className="w-3.5 h-3.5" />
                            Sắp xếp menu
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
