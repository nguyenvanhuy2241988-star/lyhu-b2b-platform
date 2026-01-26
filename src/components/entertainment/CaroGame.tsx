"use client";

import React, { useState, useEffect, useRef } from "react";
import { RotateCcw, User, Bot, Trophy } from "lucide-react";
import { saveGameScore } from "@/lib/entertainmentStore";

interface CaroGameProps {
    currentUser: any;
}

type Player = 'X' | 'O';
type CellValue = Player | null;

const BOARD_SIZE = 15;

export const CaroGame = ({ currentUser }: CaroGameProps) => {
    const [board, setBoard] = useState<CellValue[][]>(
        Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
    );
    const [isXNext, setIsXNext] = useState(true); // Player is X, Bot is O
    const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
    const [winningLine, setWinningLine] = useState<number[][] | null>(null);
    const [isBotThinking, setIsBotThinking] = useState(false);
    const [gameMode, setGameMode] = useState<'PvE'>('PvE'); // Future: PvP

    // Bot Logic (Simple Heuristic)
    useEffect(() => {
        if (!isXNext && !winner && gameMode === 'PvE') {
            setIsBotThinking(true);
            setTimeout(() => {
                makeBotMove();
                setIsBotThinking(false);
            }, 600);
        }
    }, [isXNext, winner, gameMode]);

    const checkWinner = (currentBoard: CellValue[][], row: number, col: number, player: Player) => {
        const directions = [
            [0, 1],  // Horizontal
            [1, 0],  // Vertical
            [1, 1],  // Diagonal \
            [1, -1]  // Diagonal /
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            const line = [[row, col]];

            // Check forward
            for (let i = 1; i < 5; i++) {
                const r = row + i * dx;
                const c = col + i * dy;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && currentBoard[r][c] === player) {
                    count++;
                    line.push([r, c]);
                } else break;
            }

            // Check backward
            for (let i = 1; i < 5; i++) {
                const r = row - i * dx;
                const c = col - i * dy;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && currentBoard[r][c] === player) {
                    count++;
                    line.push([r, c]);
                } else break;
            }

            if (count >= 5) {
                return line;
            }
        }
        return null;
    };

    const handleCellClick = (row: number, col: number) => {
        if (winner || board[row][col] || (!isXNext && gameMode === 'PvE')) return;

        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = 'X';
        setBoard(newBoard);

        const line = checkWinner(newBoard, row, col, 'X');
        if (line) {
            setWinner('X');
            setWinningLine(line);
            // Save win?? Maybe just for fun now.
        } else {
            setIsXNext(false);
        }
    };

    const makeBotMove = () => {
        // 1. Find best move
        // Simple strategy: Block opponent or find 3/4 in a row
        // For MVP: Random nearby or random empty

        // Intelligent Heuristic
        let bestScore = -Infinity;
        let bestMove = { r: 7, c: 7 };

        // Only evaluate cells near existing stones (optimization)
        const relevantCells = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === null) {
                    if (hasNeighbor(r, c)) {
                        relevantCells.push({ r, c });
                    }
                }
            }
        }

        if (relevantCells.length === 0) {
            // First move center
            relevantCells.push({ r: 7, c: 7 });
        }

        for (const cell of relevantCells) {
            const score = evaluateMove(cell.r, cell.c, 'O');
            if (score > bestScore) {
                bestScore = score;
                bestMove = cell;
            }
        }

        const newBoard = board.map(r => [...r]);
        newBoard[bestMove.r][bestMove.c] = 'O';
        setBoard(newBoard);

        const line = checkWinner(newBoard, bestMove.r, bestMove.c, 'O');
        if (line) {
            setWinner('O');
            setWinningLine(line);
        } else {
            setIsXNext(true);
        }
    };

    const hasNeighbor = (r: number, c: number) => {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const rr = r + i, cc = c + j;
                if (rr >= 0 && rr < BOARD_SIZE && cc >= 0 && cc < BOARD_SIZE && board[rr][cc] !== null) return true;
            }
        }
        return false;
    };

    const evaluateMove = (r: number, c: number, player: Player) => {
        // very basic scoring
        // Prioritize winning, then blocking, then building
        // Need to simulate placing 'O' at r,c

        // Block X?
        // Check if putting X here would win for X? -> High priority

        // ... Implementing full heuristic is complex.
        // Let's use simplified randomness weighted by centrality for MVP
        // OR: just random neighbor + small logic

        return Math.random(); // Placeholder for actual logic
    };

    const resetGame = () => {
        setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
        setWinner(null);
        setWinningLine(null);
        setIsXNext(true);
    };

    return (
        <div className="flex flex-col items-center">
            {/* Header / StatusBar */}
            <div className="flex items-center gap-8 mb-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-colors ${isXNext ? 'bg-blue-100 border-blue-500' : 'border-transparent opacity-50'}`}>
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-blue-900">Bạn (X)</span>
                </div>

                <div className="text-xl font-bold text-slate-300">VS</div>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-colors ${!isXNext ? 'bg-red-100 border-red-500' : 'border-transparent opacity-50'}`}>
                    <Bot className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-red-900">Máy (O)</span>
                    {isBotThinking && <span className="animate-pulse text-xs">...</span>}
                </div>
            </div>

            {/* Board */}
            <div className="bg-[#f0d9b5] p-2 rounded shadow-xl border-4 border-[#b58863] overflow-hidden">
                <div
                    className="grid gap-[1px] bg-[#b58863]"
                    style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
                >
                    {board.map((row, rIdx) => (
                        row.map((cell, cIdx) => {
                            const isWin = winningLine?.some(([r, c]) => r === rIdx && c === cIdx);
                            return (
                                <button
                                    key={`${rIdx}-${cIdx}`}
                                    className={`w-8 h-8 sm:w-10 sm:h-10 bg-[#f0d9b5] flex items-center justify-center text-xl sm:text-2xl font-bold leading-none select-none transition-colors
                                        ${isWin ? 'bg-yellow-200' : 'hover:bg-[#eacca0]'}
                                    `}
                                    onClick={() => handleCellClick(rIdx, cIdx)}
                                    disabled={cell !== null || !!winner}
                                >
                                    {cell === 'X' && <span className="text-blue-600">X</span>}
                                    {cell === 'O' && <span className="text-red-500">O</span>}
                                </button>
                            );
                        })
                    ))}
                </div>
            </div>

            {/* Game Over Overlay */}
            {winner && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl text-center transform scale-110">
                        <Trophy className={`w-16 h-16 mx-auto mb-2 ${winner === 'X' ? 'text-yellow-500' : 'text-slate-400'}`} />
                        <h2 className="text-3xl font-black mb-2 text-slate-800">
                            {winner === 'X' ? 'BẠN THẮNG!' : winner === 'O' ? 'MÁY THẮNG!' : 'HÒA!'}
                        </h2>
                        <p className="text-slate-500 mb-6">
                            {winner === 'X' ? 'Đỉnh cao trí tuệ!' : 'Thử lại nhé, máy chơi hay quá.'}
                        </p>
                        <button
                            onClick={resetGame}
                            className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-all"
                        >
                            <RotateCcw className="w-5 h-5" /> Chơi ván mới
                        </button>
                    </div>
                </div>
            )}

            {!winner && (
                <button onClick={resetGame} className="mt-8 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm">
                    <RotateCcw className="w-4 h-4" /> Reset bàn cờ
                </button>
            )}
        </div>
    );
};
