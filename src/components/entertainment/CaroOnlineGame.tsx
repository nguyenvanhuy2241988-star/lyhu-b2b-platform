"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from '@/lib/supabaseClient';
import { User, Swords, RotateCcw, Trophy, LogOut } from "lucide-react";
import { toast } from 'sonner';

interface CaroOnlineGameProps {
    currentUser: any;
    roomId: string;
    onExit: () => void;
}

type Player = 'X' | 'O';
type CellValue = Player | null;
const BOARD_SIZE = 15;

export const CaroOnlineGame = ({ currentUser, roomId, onExit }: CaroOnlineGameProps) => {
    const [board, setBoard] = useState<CellValue[][]>(
        Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
    );
    const [roomState, setRoomState] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mySymbol, setMySymbol] = useState<Player | null>(null);
    const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
    const [winningLine, setWinningLine] = useState<number[][] | null>(null);

    // Players info
    const [opponent, setOpponent] = useState<any>(null);

    const supabase = createClient();
    const channelRef = useRef<any>(null);

    useEffect(() => {
        fetchRoomDetails();

        // Subscribe Realtime
        channelRef.current = supabase
            .channel(`room_${roomId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'caro_rooms', filter: `id=eq.${roomId}` }, (payload: any) => {
                handleRoomUpdate(payload.new);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channelRef.current);
        };
    }, [roomId]);

    const fetchRoomDetails = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('caro_rooms')
            .select(`*, player1:profiles!player1_id(*), player2:profiles!player2_id(*)`)
            .eq('id', roomId)
            .single();

        if (data) {
            handleRoomUpdate(data);
        } else {
            toast.error("Không tìm thấy phòng!");
            onExit();
        }
        setLoading(false);
    };

    const handleRoomUpdate = (roomData: any) => {
        setRoomState(roomData);

        // Determine Symbol
        if (currentUser.id === roomData.player1_id) {
            setMySymbol('X');
            setOpponent(roomData.player2);
        } else {
            setMySymbol('O');
            setOpponent(roomData.player1);
        }

        // Sync Board (Optimized: In real app, consider storing board as sparse array or just moves)
        // For MVP, if board_state is full array, use it. If only last_move, apply it.
        // Assuming simple full sync for reliability first.
        if (roomData.board_state && Array.isArray(roomData.board_state) && roomData.board_state.length > 0) {
            // Check formatted
            // If stored as JSON 2D array:
            setBoard(roomData.board_state);
        } else {
            // Init empty if new
            // setBoard(...) already done on init
        }

        // Check winner
        if (roomData.winner_id) {
            const winSym = roomData.winner_id === roomData.player1_id ? 'X' : 'O';
            setWinner(winSym);
            // Highlight line logic if stored
        }
    };

    const checkWinner = (currentBoard: CellValue[][], row: number, col: number, player: Player) => {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (const [dx, dy] of directions) {
            let count = 1;
            const line = [[row, col]];
            // Forward
            for (let i = 1; i < 5; i++) {
                const r = row + i * dx;
                const c = col + i * dy;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && currentBoard[r][c] === player) {
                    count++;
                    line.push([r, c]);
                } else break;
            }
            // Backward
            for (let i = 1; i < 5; i++) {
                const r = row - i * dx;
                const c = col - i * dy;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && currentBoard[r][c] === player) {
                    count++;
                    line.push([r, c]);
                } else break;
            }
            if (count >= 5) return line;
        }
        return null;
    };

    const handleCellClick = async (row: number, col: number) => {
        // Validation
        if (!roomState || roomState.status !== 'PLAYING') return;
        if (winner) return;
        if (board[row][col]) return; // Occupied

        // Turn Check
        const isMyTurn = (mySymbol === 'X' && roomState.current_turn === roomState.player1_id) ||
            (mySymbol === 'O' && roomState.current_turn === roomState.player2_id);

        if (!isMyTurn) {
            toast.warning("Chưa đến lượt bạn!");
            return;
        }

        // Optimistic UI Update
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = mySymbol;
        setBoard(newBoard);

        // Check Win Logic
        const line = checkWinner(newBoard, row, col, mySymbol!);
        let nextTurn = mySymbol === 'X' ? roomState.player2_id : roomState.player1_id;
        let newStatus = 'PLAYING';
        let winId = null;

        if (line) {
            setWinningLine(line);
            setWinner(mySymbol); // Local update
            newStatus = 'FINISHED';
            winId = currentUser.id;
        }

        // Sync to DB
        const { error } = await supabase
            .from('caro_rooms')
            .update({
                board_state: newBoard,
                current_turn: nextTurn,
                last_move: { r: row, c: col, val: mySymbol },
                status: newStatus,
                winner_id: winId,
                updated_at: new Date().toISOString()
            })
            .eq('id', roomId);

        if (error) {
            console.error("Move error", error);
            // Revert on error? For now just toast
            toast.error("Lỗi đồng bộ nước đi!");
        }
    };

    // Derived States
    const isMyTurn = roomState && (
        (mySymbol === 'X' && roomState.current_turn === roomState.player1_id) ||
        (mySymbol === 'O' && roomState.current_turn === roomState.player2_id)
    );

    if (loading) return <div className="p-12 text-center text-slate-400">Đang kết nối vào phòng...</div>;

    if (!roomState) return null;

    return (
        <div className="flex flex-col items-center animate-in fade-in">
            {/* Header / StatusBar */}
            <div className="flex items-center justify-between w-full max-w-3xl mb-4 px-4">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 transition-all ${isMyTurn ? 'border-teal-500 bg-teal-50 shadow-md transform scale-105' : 'border-transparent opacity-60'}`}>
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-black text-teal-600 border border-teal-200">
                        {currentUser?.full_name?.charAt(0)}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Bạn ({mySymbol})</p>
                        <p className="text-sm font-bold text-slate-800">{currentUser?.full_name}</p>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <Swords className="w-8 h-8 text-slate-300 mb-1" />
                    <div className="text-xs font-mono text-slate-400">VS</div>
                </div>

                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 transition-all ${!isMyTurn && roomState.status === 'PLAYING' ? 'border-red-500 bg-red-50 shadow-md transform scale-105' : 'border-transparent opacity-60'}`}>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase">Đối thủ ({mySymbol === 'X' ? 'O' : 'X'})</p>
                        <p className="text-sm font-bold text-slate-800">{opponent?.full_name || 'Đang chờ...'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-black text-red-600 border border-red-200">
                        {opponent?.full_name?.charAt(0) || '?'}
                    </div>
                </div>
            </div>

            {/* Status Message */}
            {roomState.status === 'WAITING' && (
                <div className="mb-6 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-full flex items-center gap-2 animate-pulse font-bold">
                    <User className="w-5 h-5" /> Đang chờ đối thủ tham gia...
                </div>
            )}

            {/* Board */}
            <div className="bg-[#f0d9b5] p-2 rounded shadow-xl border-4 border-[#b58863] overflow-hidden relative">
                {/* Board Overlay if Waiting */}
                {roomState.status === 'WAITING' && (
                    <div className="absolute inset-0 bg-black/10 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="text-white font-black text-2xl drop-shadow-md">WAITING PLAYER 2...</span>
                    </div>
                )}

                <div
                    className="grid bg-[#b58863]"
                    style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
                >
                    {board.map((row, rIdx) => (
                        row.map((cell, cIdx) => {
                            const isWin = winningLine?.some(([r, c]) => r === rIdx && c === cIdx);
                            // Highlight last move?
                            const isLast = roomState.last_move && roomState.last_move.r === rIdx && roomState.last_move.c === cIdx;

                            return (
                                <button
                                    key={`${rIdx}-${cIdx}`}
                                    className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xl sm:text-2xl font-bold leading-none select-none transition-colors border-[0.5px] border-[#b58863]/30
                                        ${isWin ? 'bg-yellow-200 animate-pulse' : (isLast ? 'bg-[#e0c090]' : 'bg-[#f0d9b5] hover:bg-[#eacca0]')}
                                    `}
                                    onClick={() => handleCellClick(rIdx, cIdx)}
                                    // Disable if not playing, not my turn, or taken
                                    disabled={cell !== null || !!winner || roomState.status !== 'PLAYING' || !isMyTurn}
                                >
                                    {cell === 'X' && <span className="text-teal-600 drop-shadow-sm">X</span>}
                                    {cell === 'O' && <span className="text-red-500 drop-shadow-sm">O</span>}
                                </button>
                            );
                        })
                    ))}
                </div>
            </div>

            {/* Game Over Modal */}
            {winner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full transform scale-110">
                        {winner === mySymbol ? (
                            <>
                                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
                                <h2 className="text-3xl font-black text-slate-800 mb-2">CHIẾN THẮNG!</h2>
                                <p className="text-slate-500 mb-6 font-medium">Bạn đã đánh bại đối thủ.</p>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">💀</span>
                                </div>
                                <h2 className="text-3xl font-black text-slate-800 mb-2">THẤT BẠI...</h2>
                                <p className="text-slate-500 mb-6 font-medium">Chúc may mắn lần sau!</p>
                            </>
                        )}

                        <button
                            onClick={onExit}
                            className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-5 h-5" /> Rời phòng
                        </button>
                    </div>
                </div>
            )}

            {/* Footer Control */}
            <div className="mt-6">
                <button onClick={onExit} className="text-slate-400 text-sm hover:text-red-500 flex items-center gap-1 font-medium underline decoration-slate-300">
                    <LogOut className="w-4 h-4" /> Thoát trận đấu
                </button>
            </div>
        </div>
    );
};
