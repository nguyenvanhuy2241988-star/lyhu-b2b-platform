"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Star, Clock, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

interface Reward {
    id: string;
    name: string;
    description: string;
    cost: number;
    image_url: string;
}

interface Redemption {
    id: string;
    reward: { name: string };
    status: string;
    redeemed_at: string;
}

export const RewardStore = ({ currentUser }: { currentUser: any }) => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [myPoints, setMyPoints] = useState(0); // This should filter from game_scores ideally
    const [history, setHistory] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        fetchData();
        calculatePoints();
    }, [currentUser]);

    const calculatePoints = async () => {
        // Calculate total points from all games
        // Specific query to sum score? For now let's mock or simple fetch
        // In real app: create a view/function `get_user_total_score`
        if (!currentUser?.id) return;

        const { data } = await supabase
            .from('game_scores')
            .select('score')
            .eq('user_id', currentUser.id);

        const total = (data as any[])?.reduce((acc, curr) => acc + curr.score, 0) || 0;

        // Subtract spent points (TODO)
        // const { data: spent } = ...

        setMyPoints(total);
    };

    const fetchData = async () => {
        setLoading(true);
        // Rewards
        const { data: rewardsData } = await supabase
            .from('entertainment_rewards' as any)
            .select('*')
            .eq('is_active', true)
            .order('cost', { ascending: true });
        setRewards((rewardsData as any) || []);

        // History
        if (currentUser?.id) {
            const { data: histData } = await supabase
                .from('user_redemptions' as any)
                .select('*, reward:entertainment_rewards(name)')
                .eq('user_id', currentUser.id)
                .order('redeemed_at', { ascending: false });
            setHistory((histData as any) || []);
        }
        setLoading(false);
    };

    const handleRedeem = async (reward: Reward) => {
        if (!confirm(`Bạn muốn đổi "${reward.name}" với giá ${reward.cost} điểm?`)) return;

        if (myPoints < reward.cost) {
            alert("Bạn không đủ điểm!");
            return;
        }

        const { error } = await supabase
            .from('user_redemptions' as any)
            .insert([{
                user_id: currentUser.id,
                reward_id: reward.id,
                cost: reward.cost
            }]);

        if (error) {
            alert("Lỗi đổi quà: " + error.message);
        } else {
            alert("Đổi thành công! Vào lịch sử để xem trạng thái.");
            calculatePoints(); // Refresh points
            fetchData(); // Refresh history
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Store (Left) */}
            <div className="flex-1 w-full">
                <div className="bg-gradient-to-r from-teal-500 to-teal-700 rounded-xl p-6 text-white mb-6 shadow-lg flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg mb-1">Ví điểm của bạn</h3>
                        <p className="text-3xl font-black flex items-center gap-2">
                            <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                            {myPoints.toLocaleString()}
                        </p>
                    </div>
                    <ShoppingBag className="w-12 h-12 opacity-20" />
                </div>

                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-500" /> Danh sách quà
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rewards.map(item => (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-2xl shrink-0">
                                {item.image_url === 'Smartphone' && '📱'}
                                {item.image_url === 'Clock' && '⏰'}
                                {item.image_url === 'Sunset' && '🌅'}
                                {item.image_url === 'Coffee' && '☕'}
                                {item.image_url === 'CupSoda' && '🥤'}
                                {item.image_url === 'Crown' && '👑'}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900">{item.name}</h4>
                                <p className="text-xs text-slate-500 mb-2 line-clamp-2">{item.description}</p>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="font-bold text-yellow-600 text-sm">{item.cost.toLocaleString()} điểm</span>
                                    <button
                                        onClick={() => handleRedeem(item)}
                                        disabled={myPoints < item.cost}
                                        className="px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Đổi ngay
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* History (Right) */}
            <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Lịch sử đổi quà
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {history.map(h => (
                        <div key={h.id} className="flex gap-3 text-sm pb-3 border-b border-slate-50 last:border-0">
                            <CheckCircle className={`w-4 h-4 shrink-0 ${h.status === 'PENDING' ? 'text-yellow-500' : 'text-green-500'}`} />
                            <div>
                                <p className="font-medium text-slate-900">{h.reward?.name}</p>
                                <p className="text-xs text-slate-400">{new Date(h.redeemed_at).toLocaleDateString()}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${h.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                    {h.status === 'PENDING' ? 'Chờ duyệt' : h.status}
                                </span>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-center text-xs text-slate-400 py-4">Chưa có giao dịch nào.</p>}
                </div>
            </div>
        </div>
    );
};
