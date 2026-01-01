"use client";

import { useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, Circle, ArrowRight, Gift, Trophy, Play, Award, Sparkles } from "lucide-react";
import type { Order } from "@/lib/ordersStore";
import type { CtvLead } from "@/lib/ctvLeads";
import { useRouter } from "next/navigation";

interface StarterQuestProps {
    user: any;
    orders: Order[];
    leads: CtvLead[];
}

export function StarterQuest({ user, orders, leads }: StarterQuestProps) {
    const router = useRouter();

    // Calculate 7-day expiry (Mock logic: assume user created within last 7 days for demo)
    // In real app: const daysLeft = 7 - (now - user.createdAtInDays)
    const daysLeft = 5;

    const tasks = useMemo(() => {
        if (!user) return [];

        const isProfileComplete = user.phone && user.address && user.province && user.onboardingStep === 3;
        const hasFirstLead = leads.length > 0;
        const hasFirstOrder = orders.length > 0;

        return [
            {
                id: "profile",
                title: "Hoàn tất hồ sơ CTV",
                description: "Cập nhật thông tin nhận hàng & thanh toán",
                completed: isProfileComplete,
                action: () => router.push("/ctv/onboarding"),
                actionLabel: "Cập nhật ngay",
                reward: "+50 điểm"
            },
            {
                id: "lead",
                title: "Có khách hàng đầu tiên",
                description: "Thêm 1 khách hàng tiềm năng (Lead)",
                completed: hasFirstLead,
                action: () => router.push("/ctv/new-lead"),
                actionLabel: "Thêm Lead",
                reward: "+100 điểm"
            },
            {
                id: "order",
                title: "Lên đơn hàng đầu tiên",
                description: "Tạo thành công đơn hàng đầu tiên",
                completed: hasFirstOrder,
                action: () => router.push("/ctv/create-order"),
                actionLabel: "Lên đơn ngay",
                reward: "+200 điểm + Voucher 50k"
            }
        ];
    }, [user, leads, orders, router]);

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = (completedCount / tasks.length) * 100;

    if (completedCount === tasks.length) return null; // Hide if all done? Or show Success state. Let's show success state briefly or keep it minimized.
    // For now, let's always show it if not fully completed, or show a "Mission Complete" banner.

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 text-white overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="w-32 h-32" />
            </div>

            <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Gift className="w-5 h-5 text-yellow-400" />
                            Nhiệm vụ 7 ngày đầu tiên
                        </h3>
                        <p className="text-indigo-200 text-sm mt-1">
                            Hoàn thành để nhận thưởng nóng & mở khóa tính năng cao cấp!
                        </p>
                    </div>
                    <div className="bg-indigo-800/50 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 border border-indigo-700">
                        Còn {daysLeft} ngày
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs mb-1.5 font-medium text-indigo-300">
                        <span>Tiến độ: {completedCount}/{tasks.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-indigo-950/50 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}% ` }}
                        />
                    </div>
                </div>

                {/* Task List */}
                <div className="space-y-3">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`flex items - center gap - 3 p - 3 rounded - lg transition - all ${task.completed
                                ? "bg-indigo-800/40 border border-indigo-700/50"
                                : "bg-white/5 border border-white/10"
                                } `}
                        >
                            <div className={`flex - shrink - 0 `}>
                                {task.completed ? (
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                ) : (
                                    <Circle className="w-6 h-6 text-indigo-400" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`font - medium ${task.completed ? "text-indigo-200 line-through" : "text-white"} `}>
                                    {task.title}
                                </p>
                                <p className="text-xs text-indigo-300 truncate">
                                    {task.description}
                                </p>
                            </div>

                            {task.completed ? (
                                <span className="text-xs font-semibold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                                    Đã nhận
                                </span>
                            ) : (
                                <button
                                    onClick={task.action}
                                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                                >
                                    {task.actionLabel}
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
