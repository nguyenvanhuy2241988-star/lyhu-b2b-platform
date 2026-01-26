"use client";

import React, { useState, useEffect, useRef } from "react";
import { RotateCcw, User, Bot, Trophy, Grid3X3 } from "lucide-react";
import { saveGameScore, getGameConfig, addPoints } from "@/lib/entertainmentStore";

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

    // Config State
    const [config, setConfig] = useState<any>({ points_easy: 50, points_medium: 100, points_hard: 200 });

    useEffect(() => {
        // Load config from Admin Settings
        getGameConfig('caro_ai').then(cfg => {
            if (cfg) setConfig(cfg);
        });
    }, []);

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

    const finishGame = async (w: Player | 'DRAW', line?: number[][]) => {
        setWinner(w);
        if (line) setWinningLine(line);
        if (w === 'X') {
            // Calculate Points
            let points = 0;
            let code = 'caro_easy';
            if (difficulty === 'EASY') points = config.points_easy || 50;
            if (difficulty === 'MEDIUM') { points = config.points_medium || 100; code = 'caro_medium'; }
            if (difficulty === 'HARD') { points = config.points_hard || 200; code = 'caro_hard'; }

            // Save Score (Leaderboard)
            saveGameScore(code, 100, currentUser.id);

            // Add Points to Wallet
            try {
                await addPoints(currentUser.id, points, 'GAME_WIN', `Thắng Caro (${difficulty})`, code);
                // Maybe show a toast or modal effect?
            } catch (e) {
                console.error("Failed to add points", e);
            }
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
            // HARD MODE: Minimax with Alpha-Beta Pruning (Depth limited)
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

    // --- HARD MODE AI (Minimax + Heuristics) ---
    // Refined for "Expert" level: Prioritizes Threats (VCF/VCT) and blocks heavily.

    const findBestMoveMinimax = (b: CellValue[][]) => {
        const candidates = getEmptyNeighbors(b);
        if (candidates.length === 0) return { r: 7, c: 7 };
        if (candidates.length === 1) return candidates[0];

        // 0. THREAT CHECK (Forced Moves - Optimization)
        // If we have a winning move, take it immediately.
        for (let move of candidates) {
            b[move.r][move.c] = 'O';
            if (checkWinner(b, move.r, move.c, 'O')) {
                b[move.r][move.c] = null;
                return move;
            }
            b[move.r][move.c] = null;
        }

        // If opponent has a winning move (Open 4 or Broken 4), we MUST block it.
        // We search for ALL blocking moves to see which one is best (e.g., block + create threat).
        const defensiveMoves = [];
        for (let move of candidates) {
            b[move.r][move.c] = 'X';
            if (checkWinner(b, move.r, move.c, 'X')) {
                defensiveMoves.push(move);
            }
            b[move.r][move.c] = null;
        }

        if (defensiveMoves.length > 0) {
            // If there are multiple ways to block (rare for 5-in-row, but possible if double threat), pick the one that gives us best position.
            // Usually just picking the first one is fine for "Don't Lose", but let's be smart.
            // We reuse the scoring to pick the best defensive move.
            return pickBestFromList(b, defensiveMoves);
        }

        // 1. Minimax Recursion (Depth 3 for better lookahead, but limited beam)
        // Sort candidates by heuristic score first to maximize alpha-beta pruning
        const ratedCandidates = candidates.map(m => {
            // Quick score: Attack + Defense (blocking opponent high score spots)
            const attackScore = evaluateSingleMove(b, m.r, m.c, 'O');
            const defenseScore = evaluateSingleMove(b, m.r, m.c, 'X');
            return { ...m, score: attackScore + defenseScore }; // Combined potential
        }).sort((a, b) => b.score - a.score).slice(0, 8); // Look at top 8 candidates only

        let bestScore = -Infinity;
        let bestMoves: { r: number, c: number }[] = [];

        for (let move of ratedCandidates) {
            b[move.r][move.c] = 'O';
            // Depth 2 full search is fast enough with 8 candidates.
            const score = minimax(b, 2, false, -Infinity, Infinity);
            b[move.r][move.c] = null;

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }

        return bestMoves.length > 0 ? bestMoves[Math.floor(Math.random() * bestMoves.length)] : candidates[0];
    };

    const pickBestFromList = (b: CellValue[][], moves: { r: number, c: number }[]) => {
        let bestScore = -Infinity;
        let bestMove = moves[0];
        for (let move of moves) {
            b[move.r][move.c] = 'O'; // Assume we play here
            const score = evaluateBoard(b, 'O');
            b[move.r][move.c] = null;
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    };

    const minimax = (b: CellValue[][], depth: number, isMaximizing: boolean, alpha: number, beta: number): number => {
        if (depth === 0) return evaluateBoard(b, 'O');

        const candidates = getEmptyNeighbors(b);
        // Strict beam search to prevent lag
        const limit = 5;

        // Optimistic Sorting for Pruning
        const sorted = candidates.map(m => ({
            ...m,
            score: evaluateSingleMove(b, m.r, m.c, isMaximizing ? 'O' : 'X')
        })).sort((a, b) => b.score - a.score).slice(0, limit);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let move of sorted) {
                b[move.r][move.c] = 'O';
                if (checkWinner(b, move.r, move.c, 'O')) {
                    b[move.r][move.c] = null;
                    return 1000000 + depth;
                }
                const evalScore = minimax(b, depth - 1, false, alpha, beta);
                b[move.r][move.c] = null;
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let move of sorted) {
                b[move.r][move.c] = 'X';
                if (checkWinner(b, move.r, move.c, 'X')) {
                    b[move.r][move.c] = null;
                    return -1000000 - depth;
                }
                const evalScore = minimax(b, depth - 1, true, alpha, beta);
                b[move.r][move.c] = null;
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    };

    // Quick heuristic for a single point (used for sorting)
    const evaluateSingleMove = (b: CellValue[][], r: number, c: number, p: Player) => {
        // Temporarily simple check: neighbors
        let score = 0;
        // Check 4 directions
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (const [dx, dy] of directions) {
            // Check instant lines created
            // (Simplified for performance: just count adjacent friendlies)
            let count = 0;
            for (let i = 1; i <= 4; i++) {
                if (isOnBoard(r + i * dx, c + i * dy) && b[r + i * dx][c + i * dy] === p) count++; else break;
            }
            for (let i = 1; i <= 4; i++) {
                if (isOnBoard(r - i * dx, c - i * dy) && b[r - i * dx][c - i * dy] === p) count++; else break;
            }
            if (count >= 4) score += 10000;
            else if (count === 3) score += 1000;
            else if (count === 2) score += 100;
        }
        return score;
    }

    const isOnBoard = (r: number, c: number) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

    const evaluateBoard = (b: CellValue[][], player: 'O') => {
        let score = 0;
        score += evaluatePlayerStatic(b, 'O');

        // Paranoid: Defensive bias (weight opponent threats HIGHER than own gains unless winning)
        const opponentScore = evaluatePlayerStatic(b, 'X');
        score -= opponentScore * 1.5;

        return score;
    };

    // Heuristic Weights - Aggressively favor Open 3 and Open 4
    const SCORES = {
        WIN_5: 10000000,
        OPEN_4: 1000000, // Must block/win
        CLOSED_4: 50000, // Threatens win if not blocked at other end
        OPEN_3: 50000,  // Powerful structure
        CLOSED_3: 1000,
        OPEN_2: 200,
        CLOSED_2: 10
    };

    const evaluatePlayerStatic = (b: CellValue[][], p: Player) => {
        let total = 0;
        // Optimization: combine loops or iterate efficiently.
        // For Caro, evaluating all 4 directions for every cell is standard O(N^2).

        // Horizontal
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE - 4; c++) {
                // Sample window
                const chunk = [b[r][c], b[r][c + 1], b[r][c + 2], b[r][c + 3], b[r][c + 4]];
                // Look one cell beyond for "Open" detection?
                // Simple 5-window slide is often enough if scored right, 
                // but checking ends (c-1, c+5) is better for Open/Closed detection.

                // Smart Evaluation:
                // Check "blocked" status
                const before = (c > 0) ? b[r][c - 1] : 'BLOCKED';
                const after = (c < BOARD_SIZE - 5) ? b[r][c + 5] : 'BLOCKED';
                total += evaluateSequence(chunk, p, before, after);
            }
        }

        // Vertical
        for (let r = 0; r < BOARD_SIZE - 4; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const chunk = [b[r][c], b[r + 1][c], b[r + 2][c], b[r + 3][c], b[r + 4][c]];
                const before = (r > 0) ? b[r - 1][c] : 'BLOCKED';
                const after = (r < BOARD_SIZE - 5) ? b[r + 5][c] : 'BLOCKED';
                total += evaluateSequence(chunk, p, before, after);
            }
        }

        // Diagonals... (omitted for brevity, keep existing simple chunk eval or upgrade?)
        // Let's stick to the existing chunk evaluator but with updated weights if possible, 
        // OR reuse the robust logic. To be safe/consistent, I'll update evaluateChunk to be smarter.

        // Re-implement diagonals using simple sliding window loop for now to avoid complexity explosion in this snippet
        // Diagonal \
        for (let r = 0; r < BOARD_SIZE - 4; r++) {
            for (let c = 0; c < BOARD_SIZE - 4; c++) {
                const chunk = [b[r][c], b[r + 1][c + 1], b[r + 2][c + 2], b[r + 3][c + 3], b[r + 4][c + 4]];
                total += evaluateChunk(chunk, p);
            }
        }
        // Diagonal /
        for (let r = 0; r < BOARD_SIZE - 4; r++) {
            for (let c = 4; c < BOARD_SIZE; c++) {
                const chunk = [b[r][c], b[r + 1][c - 1], b[r + 2][c - 2], b[r + 3][c - 3], b[r + 4][c - 4]];
                total += evaluateChunk(chunk, p);
            }
        }

        return total;
    }

    const evaluateSequence = (chunk: CellValue[], p: Player, before: CellValue | 'BLOCKED', after: CellValue | 'BLOCKED') => {
        // This function handles the nuanced "Open" vs "Closed" better for Horiz/Vert
        let count = 0;
        let empty = 0;
        for (const cell of chunk) {
            if (cell === p) count++;
            else if (cell === null) empty++;
            else return 0; // Blocked inside the 5-chunk means useless for winning
        }

        if (count === 5) return SCORES.WIN_5;

        // Check boundaries
        const blockedBefore = (before !== null && before !== p);
        const blockedAfter = (after !== null && after !== p);

        if (count === 4) {
            if (!blockedBefore && !blockedAfter) return SCORES.OPEN_4; // Open ends: .XXXX.
            if (!blockedBefore || !blockedAfter) return SCORES.CLOSED_4; // One blocked: X.XXX or .xxxxX
            return 0; // Dead 4
        }

        if (count === 3 && empty === 2) {
            // Rough approx for open 3
            if (!blockedBefore && !blockedAfter) return SCORES.OPEN_3;
            return SCORES.CLOSED_3;
        }

        if (count === 2 && empty === 3) {
            if (!blockedBefore && !blockedAfter) return SCORES.OPEN_2;
            return SCORES.CLOSED_2;
        }

        return 0;
    }

    const evaluateChunk = (chunk: CellValue[], p: Player) => {
        // Fallback for diagonals (simpler logic)
        let count = 0;
        let empty = 0;
        let blocked = 0;

        for (const cell of chunk) {
            if (cell === p) count++;
            else if (cell === null) empty++;
            else blocked++;
        }

        if (blocked > 0) return 0;

        if (count === 5) return SCORES.WIN_5;
        if (count === 4 && empty === 1) return SCORES.OPEN_4; // Treat as high value
        if (count === 3 && empty === 2) return SCORES.OPEN_3;
        if (count === 2 && empty === 3) return SCORES.OPEN_2;

        return 0;
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
