"use client";
// Force rebuild

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LuckyWheelGame } from "@/components/entertainment/LuckyWheelGame";
import { LyhuBirdGame } from "@/components/entertainment/LyhuBirdGame";
import { CaroGame } from "@/components/entertainment/CaroGame";
import { QuizGame } from "@/components/entertainment/QuizGame";
import { RewardStore } from "@/components/entertainment/RewardStore";
import { TypingGame } from "@/components/entertainment/TypingGame";
import { Gamepad2, Gift, Trophy, Grid3X3, Image, ShoppingBag, Keyboard } from "lucide-react";
import { getLeaderboard, getAccumulatedLeaderboard, GameScore } from "@/lib/entertainmentStore";
import { createClient } from "@/lib/supabaseClient";

interface LeaderboardWidgetProps {
    gamePrefix: string; // e.g. 'lyhu_bird' or 'caro'
    gameName: string;   // e.g. 'Lyhu Bird' or 'Caro'
}

const LeaderboardWidget = ({ gamePrefix, gameName }: LeaderboardWidgetProps) => {
    const supabase = createClient();
    const [scores, setScores] = useState<GameScore[]>([]);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'pvp'>('medium');

    const fetchScores = async () => {
        try {
            let data;
            if (difficulty === 'pvp') {
                // PvP is accumulated
                data = await getAccumulatedLeaderboard(`${gamePrefix}_pvp`);
            } else {
                // Determine code
                const code = `${gamePrefix}_${difficulty}`;
                data = await getLeaderboard(code);
            }
            setScores(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchScores();

        // 1. Listen for local updates (when user plays)
        const localHandler = () => fetchScores();
        window.addEventListener('lb-update', localHandler);

        // 2. Listen for Realtime updates (from other users)
        const channel = supabase
            .channel('leaderboard_custom_channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'game_scores',
                    filter: `game_code=eq.${gamePrefix}_${difficulty}` // Only listen for relevant game/difficulty
                },
                () => {
                    console.log('Leaderboard updated via Realtime');
                    fetchScores();
                }
            )
            .subscribe();

        return () => {
            window.removeEventListener('lb-update', localHandler);
            supabase.removeChannel(channel);
        };
    }, [difficulty, gamePrefix]); // Refetch when difficulty or game changes

    return (
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 text-white">
                <h3 className="font-bold flex items-center gap-2"><Trophy className="w-5 h-5" /> Bảng Xếp Hạng</h3>
                <p className="text-xs opacity-90 mt-1">Top cao thủ "{gameName}"</p>
            </div>

            {/* Difficulty Tabs */}
            <div className="flex border-b border-slate-100 overflow-x-auto">
                <button
                    onClick={() => setDifficulty('easy')}
                    className={`flex-1 py-2 px-2 text-[10px] sm:text-xs font-bold whitespace-nowrap ${difficulty === 'easy' ? 'text-teal-600 border-b-2 border-teal-500 bg-teal-50' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    DỄ
                </button>
                <button
                    onClick={() => setDifficulty('medium')}
                    className={`flex-1 py-2 px-2 text-[10px] sm:text-xs font-bold whitespace-nowrap ${difficulty === 'medium' ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    VỪA
                </button>
                <button
                    onClick={() => setDifficulty('hard')}
                    className={`flex-1 py-2 px-2 text-[10px] sm:text-xs font-bold whitespace-nowrap ${difficulty === 'hard' ? 'text-red-600 border-b-2 border-red-500 bg-red-50' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                    KHÓ
                </button>
                {/* Only show PvP for Caro */}
                {gamePrefix === 'caro' && (
                    <button
                        onClick={() => setDifficulty('pvp')}
                        className={`flex-1 py-2 px-2 text-[10px] sm:text-xs font-bold whitespace-nowrap ${difficulty === 'pvp' ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        THÁCH ĐẤU
                    </button>
                )}
            </div>

            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
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
                {scores.length === 0 && <p className="p-4 text-center text-slate-400 text-sm">Chưa có ai chơi cấp độ này.</p>}
            </div>
        </div>
    );
};

export default function EntertainmentPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'wheel' | 'bird' | 'typing' | 'caro' | 'quiz' | 'store'>('wheel');

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Gamepad2 className="w-8 h-8 text-teal-600" /> Góc Giải Trí
                    </h1>
                    <p className="text-slate-500 mt-1">Nơi xả stress và gắn kết đồng đội!</p>
                </div>
            </div>

            {/* Game Selector Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveTab('wheel')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'wheel'
                        ? "border-teal-600 text-teal-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4" /> Vòng Quay
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('bird')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'bird'
                        ? "border-teal-600 text-teal-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" /> Lyhu Bird
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('typing')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'typing'
                        ? "border-teal-600 text-teal-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Keyboard className="w-4 h-4" /> Đua Gõ (Tuần)
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('caro')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'caro'
                        ? "border-teal-600 text-teal-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Grid3X3 className="w-4 h-4" /> Cờ Caro
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('quiz')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'quiz'
                        ? "border-teal-600 text-teal-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Image className="w-4 h-4" /> Đuổi Hình
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('store')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'store'
                        ? "border-emerald-600 text-emerald-700"
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
                            <h2 className="text-xl font-bold mb-2">Vòng Quay Nhân Phẩm</h2>
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
                            <LeaderboardWidget gamePrefix="lyhu_bird" gameName="Lyhu Bird" />
                        </div>
                    </div>
                )}

                {activeTab === 'typing' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold mb-2">Đua Gõ Phím (Typing Race)</h2>
                            <p className="text-slate-500 text-sm">Luyện ngón tay vàng - Sẵn sàng chạy deadline!</p>
                        </div>
                        <TypingGame currentUser={user} />
                    </div>
                )}

                {activeTab === 'caro' && (
                    <div className="flex flex-col xl:flex-row gap-8 items-start animate-in fade-in duration-300">
                        <div className="flex-1 w-full justify-center">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold mb-2">Cờ Caro (Gomoku)</h2>
                                <p className="text-slate-500 text-sm">Đấu với máy để giải trí nhanh hoặc thách đấu đồng nghiệp.</p>
                            </div>
                            <CaroGame currentUser={user} />
                        </div>

                        {/* Sidebar: Leaderboard */}
                        <div className="w-full xl:w-80 shrink-0 mt-8 xl:mt-0">
                            <LeaderboardWidget gamePrefix="caro" gameName="Cờ Caro" />
                        </div>
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
                            <h2 className="text-xl font-bold mb-2 text-teal-700">Cửa Hàng Đổi Quà</h2>
                            <p className="text-slate-500 text-sm">Dùng điểm tích lũy để đổi những phần quà hấp dẫn!</p>
                        </div>
                        <RewardStore currentUser={user} />
                    </div>
                )}
            </div>
        </div>
    );
}
