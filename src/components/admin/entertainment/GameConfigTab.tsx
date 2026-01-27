"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Game {
    code: string;
    name: string;
    config: {
        points_easy?: number;
        points_medium?: number;
        points_hard?: number;
        daily_limit?: number;
        [key: string]: any;
    };
}

export const GameConfigTab = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const fetchGames = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('entertainment_games')
            .select('*')
            .order('name');

        if (error) {
            toast.error("Lỗi tải danh sách game: " + error.message);
        } else {
            setGames(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchGames();
    }, []);

    const handleChange = (code: string, field: string, value: any) => {
        setGames(prev => prev.map(g => {
            if (g.code === code) {
                return {
                    ...g,
                    config: { ...(g.config || {}), [field]: Number(value) }
                };
            }
            return g;
        }));
    };

    const handleSave = async (game: Game) => {
        const { error } = await supabase
            .from('entertainment_games')
            .update({ config: game.config })
            .eq('code', game.code);

        if (error) {
            toast.error("Lỗi lưu cấu hình: " + error.message);
        } else {
            toast.success(`Đã lưu cấu hình cho ${game.name}`);
        }
    };

    if (loading && games.length === 0) return <div>Đang tải...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Cấu hình Trò Chơi</h3>
                <button onClick={fetchGames} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {games.map(game => (
                    <div key={game.code} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg">{game.name}</h4>
                                <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded inline-block mt-1">{game.code}</p>
                            </div>
                            <button
                                onClick={() => handleSave(game)}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm"
                            >
                                <Save className="w-4 h-4" /> Lưu
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Điểm (Dễ)</label>
                                <input
                                    type="number"
                                    value={game.config?.points_easy || 0}
                                    onChange={(e) => handleChange(game.code, 'points_easy', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Điểm (Vừa)</label>
                                <input
                                    type="number"
                                    value={game.config?.points_medium || 0}
                                    onChange={(e) => handleChange(game.code, 'points_medium', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Điểm (Khó)</label>
                                <input
                                    type="number"
                                    value={game.config?.points_hard || 0}
                                    onChange={(e) => handleChange(game.code, 'points_hard', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Giới hạn / ngày</label>
                                <input
                                    type="number"
                                    value={game.config?.daily_limit || 0}
                                    onChange={(e) => handleChange(game.code, 'daily_limit', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {games.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-400">Không tìm thấy trò chơi nào.</div>
                )}
            </div>
        </div>
    );
};
