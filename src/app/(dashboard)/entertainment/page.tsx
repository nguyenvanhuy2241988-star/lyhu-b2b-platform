"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LuckyWheelGame } from "@/components/entertainment/LuckyWheelGame";
import { Gamepad2, Gift, Trophy } from "lucide-react";

export default function EntertainmentPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'wheel' | 'bird'>('wheel');

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Gamepad2 className="w-8 h-8 text-purple-600" /> Góc Giải Trí
                    </h1>
                    <p className="text-slate-500 mt-1">Nơi xả stress và gắn kết đồng đội!</p>
                </div>
            </div>

            {/* Game Selector Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('wheel')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'wheel'
                            ? "border-purple-600 text-purple-700"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4" /> Vòng Quay Nhân Phẩm
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('bird')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'bird'
                            ? "border-purple-600 text-purple-700"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" /> Lyhu Bird (Coming Soon)
                    </div>
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] p-6 text-slate-800">
                {activeTab === 'wheel' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold mb-2">Vòng Quay May Mắn</h2>
                            <p className="text-slate-500 text-sm">Trưa nay ăn gì? Ai rửa bát? Để định mệnh quyết định!</p>
                        </div>
                        <LuckyWheelGame currentUser={user} />
                    </div>
                )}

                {activeTab === 'bird' && (
                    <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 animate-in fade-in duration-300">
                        <Trophy className="w-20 h-20 mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-slate-600">Sắp ra mắt!</h3>
                        <p>Game thi đấu tính điểm xếp hạng đang được phát triển.</p>
                        <button onClick={() => setActiveTab('wheel')} className="mt-4 text-purple-600 hover:underline text-sm">
                            Chơi Vòng quay trước đi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
