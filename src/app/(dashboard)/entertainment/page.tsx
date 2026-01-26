"use client";
// Force rebuild

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LuckyWheelGame } from "@/components/entertainment/LuckyWheelGame";
import { LyhuBirdGame } from "@/components/entertainment/LyhuBirdGame";
import { CaroGame } from "@/components/entertainment/CaroGame";
import { QuizGame } from "@/components/entertainment/QuizGame";
import { RewardStore } from "@/components/entertainment/RewardStore";
import { Gamepad2, Gift, Trophy, Grid3X3, Image, ShoppingBag } from "lucide-react";
import { getLeaderboard, GameScore } from "@/lib/entertainmentStore";

const LeaderboardWidget = () => {
    const [scores, setScores] = useState<GameScore[]>([]);

    const fetchScores = async () => {
        try {
            const data = await getLeaderboard('lyhu_bird');
            setScores(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchScores();
        // Listen for updates
        const handler = () => fetchScores();
        window.addEventListener('lb-update', handler);
        return () => window.removeEventListener('lb-update', handler);
    }, []);

    return (
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 text-white">
                <h3 className="font-bold flex items-center gap-2"><Trophy className="w-5 h-5" /> Bảng Xếp Hạng</h3>
                <p className="text-xs opacity-90 mt-1">Top cao thủ "Lyhu Bird"</p>
            </div>
            <div className="divide-y divide-slate-100">
                {scores.map((s, idx) => (
                    <div key={s.id} className="p-3 flex items-center gap-3 hover:bg-slate-50">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                            idx === 1 ? 'bg-slate-100 text-slate-600' :
                                idx === 2 ? 'bg-orange-100 text-orange-600' : 'text-slate-400'
                            }`}>
                            {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{s.user?.full_name || 'Ẩn danh'}</p>
                            <p className="text-xs text-slate-500">{new Date(s.played_at).toLocaleDateString()}</p>
                        </div>
                        <div className="font-bold text-slate-700">{s.score}</div>
                    </div>
                ))}
                {scores.length === 0 && <p className="p-4 text-center text-slate-400 text-sm">Chưa có ai chơi. Hãy là người đầu tiên!</p>}
            </div>
        </div>
    );
};

export default function EntertainmentPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'wheel' | 'bird' | 'caro' | 'quiz'>('wheel');

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
                        <Trophy className="w-4 h-4" /> Lyhu Bird
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('caro')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'caro'
                        ? "border-purple-600 text-purple-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Grid3X3 className="w-4 h-4" /> Cờ Caro (Beta)
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('quiz')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'quiz'
                        ? "border-purple-600 text-purple-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Image className="w-4 h-4" /> Đuổi Hình (Mới)
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('store')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'store'
                        ? "border-purple-600 text-purple-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Đổi Quà
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
                    <div className="flex flex-col xl:flex-row gap-8 items-start animate-in fade-in duration-300">
                        {/* Game Area */}
                        <div className="flex-1 w-full flex justify-center">
                            <LyhuBirdGame currentUser={user} onScoreUpdate={() => window.dispatchEvent(new CustomEvent('lb-update'))} />
                        </div>

                        {/* Sidebar: Leaderboard */}
                        <div className="w-full xl:w-80 shrink-0">
                            <LeaderboardWidget />
                        </div>
                    </div>
                )}

                {activeTab === 'caro' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold mb-2">Cờ Caro (Gomoku)</h2>
                            <p className="text-slate-500 text-sm">Đấu với máy để giải trí nhanh. Luật 5 quân thẳng hàng.</p>
                        </div>
                        <CaroGame currentUser={user} />
                    </div>
                )}

                {activeTab === 'quiz' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold mb-2">Đuổi Hình Bắt Chữ</h2>
                            <p className="text-slate-500 text-sm">Thử tài kiến thức và văn hóa công ty!</p>
                        </div>
                        <QuizGame />
                    </div>
                )}

                {activeTab === 'store' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold mb-2">Cửa Hàng Đổi Quà</h2>
                            <p className="text-slate-500 text-sm">Dùng điểm tích lũy để đổi những phần quà hấp dẫn!</p>
                        </div>
                        <RewardStore currentUser={user} />
                    </div>
                )}
            </div>
        </div>
    );
}
