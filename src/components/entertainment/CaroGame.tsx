"use client";

import React, { useState, useEffect, useRef } from "react";
import { RotateCcw, User, Bot, Trophy, Grid3X3 } from "lucide-react";
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
    const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'FINISHED'>('MENU');
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
    const [winningLine, setWinningLine] = useState<number[][] | null>(null);
    const [isBotThinking, setIsBotThinking] = useState(false);

    // Bot Logic
    useEffect(() => {
        if (gameState === 'PLAYING' && !isXNext && !winner) {
            setIsBotThinking(true);
            setTimeout(() => {
                makeBotMove();
                setIsBotThinking(false);
            }, 600);
        }
    }, [isXNext, winner, gameState]);

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

    const handleCellClick = (row: number, col: number) => {
        if (gameState !== 'PLAYING' || winner || board[row][col] || !isXNext) return;

        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = 'X';
        setBoard(newBoard);

        const line = checkWinner(newBoard, row, col, 'X');
        if (line) {
            finishGame('X', line);
        } else {
            setIsXNext(false);
        }
    };

    const finishGame = (w: Player | 'DRAW', line?: number[][]) => {
        setWinner(w);
        if (line) setWinningLine(line);
        if (w === 'X') {
            let code = 'caro_easy';
            if (difficulty === 'MEDIUM') code = 'caro_medium';
            if (difficulty === 'HARD') code = 'caro_hard';
            saveGameScore(code, 100, currentUser.id);
        }
    };

    const makeBotMove = () => {
        let bestMove = { r: 7, c: 7 };

        if (difficulty === 'EASY') {
            const emptyCells = getEmptyNeighbors(board);
            if (emptyCells.length > 0) {
                bestMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
        } else if (difficulty === 'MEDIUM') {
            bestMove = findMediumMove(board);
        } else {
            bestMove = findBestMoveMinimax(board);
        }

        const newBoard = board.map(r => [...r]);
        if (newBoard[bestMove.r][bestMove.c] === null) {
            newBoard[bestMove.r][bestMove.c] = 'O';
            setBoard(newBoard);

            const line = checkWinner(newBoard, bestMove.r, bestMove.c, 'O');
            if (line) {
                finishGame('O', line);
            } else {
                setIsXNext(true);
            }
        }
    };

    const getEmptyNeighbors = (b: CellValue[][]) => {
        const cells = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (b[r][c] === null && hasNeighbor(r, c)) cells.push({ r, c });
            }
        }
        if (cells.length === 0) return [{ r: 7, c: 7 }];
        return cells;
    };

    // Medium Strategy: Win or Block Immediate Threat
    const findMediumMove = (b: CellValue[][]) => {
        const candidates = getEmptyNeighbors(b);

        // 1. Check Win
        for (let move of candidates) {
            b[move.r][move.c] = 'O';
            if (checkWinner(b, move.r, move.c, 'O')) {
                b[move.r][move.c] = null;
                return move;
            }
            b[move.r][move.c] = null;
        }

        // 2. Check Block
        for (let move of candidates) {
            b[move.r][move.c] = 'X';
            if (checkWinner(b, move.r, move.c, 'X')) {
                b[move.r][move.c] = null;
                return move;
            }
            b[move.r][move.c] = null;
        }

        // 3. Random
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Hard Strategy: Simple Score Evaluation (Minimax too slow for 15x15 in React w/o worker)
    const findBestMoveMinimax = (b: CellValue[][]) => {
        const candidates = getEmptyNeighbors(b);
        let bestScore = -Infinity;
        let bestMove = candidates[0];

        for (let move of candidates) {
            const score = evaluatePosition(b, move.r, move.c);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    };

    const evaluatePosition = (b: CellValue[][], r: number, c: number): number => {
        let score = 0;

        // Offensive (Bot O)
        b[r][c] = 'O';
        const winO = checkWinner(b, r, c, 'O');
        if (winO) score += 10000;
        else score += countConsecutive(b, r, c, 'O');

        // Defensive (Block X)
        b[r][c] = 'X';
        const winX = checkWinner(b, r, c, 'X');
        if (winX) score += 5000;
        else score += countConsecutive(b, r, c, 'X') * 0.8;

        b[r][c] = null;

        const centerDist = Math.abs(r - 7) + Math.abs(c - 7);
        score -= centerDist;

        return score + Math.random();
    }

    const countConsecutive = (b: CellValue[][], row: number, col: number, player: Player) => {
        let total = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (const [dx, dy] of directions) {
            let count = 0;
            // Check line length including this spot
            for (let i = -4; i <= 4; i++) {
                const r = row + i * dx;
                const c = col + i * dy;
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && b[r][c] === player) {
                    count++;
                } else {
                    if (count >= 3) total += count * 10;
                    if (count === 4) total += 500;
                    count = 0;
                }
            }
            if (count >= 3) total += count * 10;
        }
        return total;
    }

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

    const startGame = (d: 'EASY' | 'MEDIUM' | 'HARD') => {
        setDifficulty(d);
        setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
        setWinner(null);
        setWinningLine(null);
        setIsXNext(true);
        setGameState('PLAYING');
    };

    const returnToMenu = () => {
        setGameState('MENU');
    };

    if (gameState === 'MENU') {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                <Grid3X3 className="w-20 h-20 text-teal-600 mb-6" />
                <h2 className="text-2xl font-black text-slate-800 mb-8">CHỌN CẤP ĐỘ</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => startGame('EASY')}
                        className="flex flex-col items-center gap-2 p-6 bg-teal-50 border-2 border-teal-100 rounded-xl hover:border-teal-500 hover:shadow-lg transition-all w-32"
                    >
                        <Bot className="w-8 h-8 text-teal-600" />
                        <span className="font-bold text-teal-900">Dễ</span>
                    </button>
                    <button
                        onClick={() => startGame('MEDIUM')}
                        className="flex flex-col items-center gap-2 p-6 bg-blue-50 border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all w-32"
                    >
                        <Bot className="w-8 h-8 text-blue-600" />
                        <span className="font-bold text-blue-900">Vừa</span>
                    </button>
                    <button
                        onClick={() => startGame('HARD')}
                        className="flex flex-col items-center gap-2 p-6 bg-red-50 border-2 border-red-100 rounded-xl hover:border-red-500 hover:shadow-lg transition-all w-32"
                    >
                        <Bot className="w-8 h-8 text-red-600" />
                        <span className="font-bold text-red-900">Khó</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            {/* Header */}
            <div className="flex items-center gap-8 mb-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-colors ${isXNext ? 'bg-teal-100 border-teal-500' : 'border-transparent opacity-50'}`}>
                    <User className="w-5 h-5 text-teal-600" />
                    <span className="font-bold text-teal-900">Bạn (X)</span>
                </div>
                <div className="text-xl font-bold text-slate-300">VS</div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-colors ${!isXNext ? 'bg-red-100 border-red-500' : 'border-transparent opacity-50'}`}>
                    <Bot className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-red-900">Máy ({difficulty})</span>
                    {isBotThinking && <span className="animate-pulse text-xs">...</span>}
                </div>
            </div>

            <button onClick={returnToMenu} className="mb-4 text-xs text-slate-400 hover:text-slate-600 underline">Quay lại chọn cấp độ</button>

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
                                    {cell === 'X' && <span className="text-teal-600">X</span>}
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
                        <div className="flex gap-4 justify-center mt-6">
                            <button
                                onClick={() => startGame(difficulty)}
                                className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold transition-all"
                            >
                                <RotateCcw className="w-5 h-5" /> Chơi lại
                            </button>
                            <button
                                onClick={returnToMenu}
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold transition-all"
                            >
                                Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
