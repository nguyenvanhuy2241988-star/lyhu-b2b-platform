"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Plus, Users, Play, Radio, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

interface Room {
    id: string;
    player1_id: string;
    player2_id?: string;
    status: string;
    created_at: string;
    player1?: {
        full_name: string;
        avatar_url?: string;
    };
}

interface CaroLobbyProps {
    currentUser: any;
    onJoinRoom: (roomId: string) => void;
    onCreateRoom: () => void;
}

export const CaroLobby = ({ currentUser, onJoinRoom, onCreateRoom }: CaroLobbyProps) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const fetchRooms = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('caro_rooms')
            .select(`
                *,
                player1:profiles!player1_id(full_name, avatar_url)
            `)
            .eq('status', 'WAITING')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch rooms error:", error);
        } else {
            setRooms((data as any) || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRooms();

        // Subscribe to room updates (Realtime Lobby)
        const channel = supabase
            .channel('caro_lobby')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'caro_rooms' }, () => {
                fetchRooms();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleJoin = async (room: Room) => {
        if (room.player1_id === currentUser.id) {
            // Re-enter own room?
            onJoinRoom(room.id);
            return;
        }

        try {
            const { data, error } = await supabase.rpc('join_caro_room', { p_room_id: room.id });
            if (error) throw error;
            toast.success("Đã vào phòng!");
            onJoinRoom(room.id);
        } catch (err: any) {
            toast.error("Không thể vào phòng: " + err.message);
            fetchRooms();
        }
    };

    const handleCreate = async () => {
        try {
            // Check if already has waiting room? Maybe limit 1 per user.
            const { data, error } = await supabase
                .from('caro_rooms')
                .insert([{
                    player1_id: currentUser.id,
                    status: 'WAITING'
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success("Đã tạo phòng mới!");
            onCreateRoom();
            onJoinRoom(data.id);
        } catch (err: any) {
            toast.error("Lỗi tạo phòng: " + err.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow border border-slate-200 min-h-[500px]">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Users className="w-8 h-8 text-indigo-600" /> SẢNH THÁCH ĐẤU
                    </h2>
                    <p className="text-slate-500">Tìm đối thủ và so tài Caro đỉnh cao!</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchRooms} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full">
                        <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-lg hover:shadow-teal-200 transition-all"
                    >
                        <Plus className="w-5 h-5" /> TẠO PHÒNG
                    </button>
                </div>
            </div>

            {/* Room List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => (
                    <div key={room.id} className="border border-slate-200 rounded-xl p-5 hover:border-teal-500 hover:shadow-md transition-all bg-slate-50 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="w-20 h-20" />
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg border-2 border-white shadow-sm">
                                {room.player1?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">Chủ phòng</p>
                                <h4 className="font-bold text-slate-800 truncate max-w-[150px]">{room.player1?.full_name}</h4>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                <Radio className="w-3 h-3 animate-pulse" /> Đang chờ
                            </span>
                            <button
                                onClick={() => handleJoin(room)}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm"
                            >
                                THAM CHIẾN
                            </button>
                        </div>
                    </div>
                ))}

                {rooms.length === 0 && !loading && (
                    <div className="col-span-full py-16 text-center text-slate-400 flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 opacity-20" />
                        </div>
                        <p>Chưa có phòng nào đang chờ.</p>
                        <button onClick={handleCreate} className="mt-2 text-teal-600 font-bold hover:underline">Tạo phòng ngay</button>
                    </div>
                )}
            </div>
        </div>
    );
};
