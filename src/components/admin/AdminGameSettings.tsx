"use client";

import React, { useState, useEffect } from "react";
import { getGames, updateGameConfig } from "@/lib/entertainmentStore";
import { Loader2, Save, Gamepad2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // Assuming toast exists

export const AdminGameSettings = () => {
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadGames();
    }, []);

    const loadGames = async () => {
        try {
            const data = await getGames();
            // Parse config if string (though supabase returns json)
            const parsed = data.map(g => ({
                ...g,
                config: typeof g.config === 'string' ? JSON.parse(g.config) : g.config || {}
            }));
            setGames(parsed);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = (code: string, key: string, value: any) => {
        setGames(prev => prev.map(g => {
            if (g.code === code) {
                return { ...g, config: { ...g.config, [key]: parseInt(value) || 0 } };
            }
            return g;
        }));
    };

    const saveConfig = async (game: any) => {
        setSaving(game.code);
        try {
            await updateGameConfig(game.code, game.config);
            toast({ title: "Cập nhật thành công", description: `Đã lưu cấu hình cho ${game.name}` });
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể lưu cấu hình", variant: "destructive" });
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-teal-600" />
                Cấu Hình Trò Chơi
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {games.map(game => (
                    <div key={game.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-slate-700">{game.name}</h3>
                            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{game.code}</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Điểm Thưởng (Dễ)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={game.config?.points_easy || 0}
                                    onChange={(e) => handleConfigChange(game.code, 'points_easy', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Điểm Thưởng (Vừa)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={game.config?.points_medium || 0}
                                    onChange={(e) => handleConfigChange(game.code, 'points_medium', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Điểm Thưởng (Khó)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={game.config?.points_hard || 0}
                                    onChange={(e) => handleConfigChange(game.code, 'points_hard', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Giới hạn chơi (Lần/Ngày)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={game.config?.daily_limit || 0}
                                    onChange={(e) => handleConfigChange(game.code, 'daily_limit', e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => saveConfig(game)}
                            disabled={saving === game.code}
                            className="mt-6 w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            {saving === game.code ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Lưu Cấu Hình
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
