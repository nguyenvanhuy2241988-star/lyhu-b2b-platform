"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Trophy } from "lucide-react";
import { saveGameScore, getMyBestScore, addPoints } from "@/lib/entertainmentStore";
import { useToast } from "@/components/ui/toast";

interface LyhuBirdGameProps {
    currentUser: any;
    onScoreUpdate?: () => void;
}

export const LyhuBirdGame = ({ currentUser, onScoreUpdate }: LyhuBirdGameProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'MENU' | 'START' | 'PLAYING' | 'GAME_OVER'>('MENU');
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Game Constants
    const GRAVITY = 0.6;
    const JUMP = -8;

    // Difficulty Settings
    const SETTINGS = {
        EASY: { gap: 170, speed: 3, spawnRate: 110, code: 'lyhu_bird_easy' },
        MEDIUM: { gap: 150, speed: 4, spawnRate: 100, code: 'lyhu_bird_medium' },
        HARD: { gap: 130, speed: 5, spawnRate: 80, code: 'lyhu_bird_hard' }
    };

    // Game Refs
    const birdY = useRef(200);
    const birdVelocity = useRef(0);
    const pipes = useRef<{ x: number, topHeight: number, passed: boolean }[]>([]);
    const frameCount = useRef(0);
    const requestRef = useRef<number>();

    // Load High Score when entering menu or changing difficulty
    useEffect(() => {
        if (currentUser?.id) {
            getMyBestScore(SETTINGS[difficulty].code, currentUser.id).then(setHighScore);
        }
    }, [currentUser, difficulty]);

    // Game Loop
    const loop = () => {
        if (gameState !== 'PLAYING') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const config = SETTINGS[difficulty];

        // 1. Update Physics
        birdVelocity.current += GRAVITY;
        birdY.current += birdVelocity.current;

        // Spawn Pipes
        if (frameCount.current % config.spawnRate === 0) {
            const minHeight = 50;
            const maxHeight = canvas.height - config.gap - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
            pipes.current.push({ x: canvas.width, topHeight, passed: false });
        }
        frameCount.current++;

        // Update Pipes
        pipes.current.forEach(pipe => {
            pipe.x -= config.speed;
        });

        // Remove pipes
        if (pipes.current.length > 0 && pipes.current[0].x < -60) {
            pipes.current.shift();
        }

        // 2. Collision Detection
        if (birdY.current + 20 > canvas.height || birdY.current < 0) {
            handleGameOver();
            return;
        }

        const birdRect = { x: 50, y: birdY.current, w: 30, h: 30 };

        pipes.current.forEach(pipe => {
            const pipeW = 50;
            const topPipeRect = { x: pipe.x, y: 0, w: pipeW, h: pipe.topHeight };
            const bottomPipeRect = { x: pipe.x, y: pipe.topHeight + config.gap, w: pipeW, h: canvas.height - (pipe.topHeight + config.gap) };

            if (checkCollision(birdRect, topPipeRect) || checkCollision(birdRect, bottomPipeRect)) {
                handleGameOver();
                return;
            }

            if (!pipe.passed && pipe.x + pipeW < birdRect.x) {
                pipe.passed = true;
                setScore(prev => prev + 1);
            }
        });

        // 3. Render
        draw(ctx, canvas);
        requestRef.current = requestAnimationFrame(loop);
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = difficulty === 'EASY' ? '#2dd4bf' : (difficulty === 'MEDIUM' ? '#0d9488' : '#0f766e');
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Pipes
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2;

        pipes.current.forEach(pipe => {
            const config = SETTINGS[difficulty];
            // Top
            ctx.fillRect(pipe.x, 0, 50, pipe.topHeight);
            ctx.strokeRect(pipe.x, 0, 50, pipe.topHeight);

            // Cap
            ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, 54, 20);
            ctx.strokeRect(pipe.x - 2, pipe.topHeight - 20, 54, 20);

            // Bottom
            const bottomY = pipe.topHeight + config.gap;
            const bottomH = canvas.height - bottomY;
            ctx.fillRect(pipe.x, bottomY, 50, bottomH);
            ctx.strokeRect(pipe.x, bottomY, 50, bottomH);

            // Cap
            ctx.fillRect(pipe.x - 2, bottomY, 54, 20);
            ctx.strokeRect(pipe.x - 2, bottomY, 54, 20);
        });

        // Bird
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(65, birdY.current + 15, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Eye & Beak details...
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(70, birdY.current + 10, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(72, birdY.current + 10, 2, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(75, birdY.current + 15);
        ctx.lineTo(85, birdY.current + 20);
        ctx.lineTo(75, birdY.current + 25);
        ctx.fill();
    };

    const checkCollision = (rect1: any, rect2: any) => {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.h + rect1.y > rect2.y
        );
    };

    const handleGameOver = () => {
        setGameState('GAME_OVER');
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (score > highScore) {
            handleSaveScore(score);
        }
    };

    const { toast } = useToast();

    const handleSaveScore = async (finalScore: number) => {
        if (!currentUser?.id) return;
        setIsSaving(true);
        try {
            await saveGameScore(SETTINGS[difficulty].code, finalScore, currentUser.id);
            setHighScore(finalScore);

            // Point System Logic for Bird
            // Award points if score >= 1
            if (finalScore >= 1) {
                // Fetch config or use defaults. 
                // Note: Real logic should use DB config, but for now we update default fallback.
                const reward = difficulty === 'EASY' ? 50 : (difficulty === 'MEDIUM' ? 100 : 200);

                // Add points securely
                await addPoints(currentUser.id, reward, 'GAME_WIN', `Lyhu Bird ${difficulty} (${finalScore} điểm)`, SETTINGS[difficulty].code);
            }

            if (onScoreUpdate) onScoreUpdate();

            toast({
                title: "Lưu điểm thành công!",
                description: `Bạn đã đạt ${finalScore} điểm (Top Server?)`,
                className: "bg-green-500 text-white border-none"
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Lỗi lưu điểm",
                description: error.message || "Không thể lưu điểm số. Vui lòng thử lại.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const resetGame = () => {
        birdY.current = 200;
        birdVelocity.current = 0;
        pipes.current = [];
        frameCount.current = 0;
        setScore(0);
        setGameState('START');
    };

    const handleJump = () => {
        if (gameState === 'START') {
            setGameState('PLAYING');
            birdVelocity.current = JUMP;
        } else if (gameState === 'PLAYING') {
            birdVelocity.current = JUMP;
        }
    };

    // Effect to start loop
    useEffect(() => {
        if (gameState === 'PLAYING') {
            requestRef.current = requestAnimationFrame(loop);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, difficulty]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                handleJump();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={handleJump} title="Nhấn Space hoặc Click để nhảy">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={500}
                    className="border-4 border-slate-800 rounded-lg shadow-xl bg-teal-200"
                />

                {/* MENU SCREEN */}
                {gameState === 'MENU' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white rounded-lg p-6 text-center">
                        <Trophy className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
                        <h2 className="text-3xl font-black mb-6">CHỌN CẤP ĐỘ</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setDifficulty('EASY'); setGameState('START'); }}
                                className="px-5 py-3 bg-teal-500 hover:bg-teal-600 rounded-xl font-bold transition-transform hover:scale-105"
                            >
                                DỄ
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setDifficulty('MEDIUM'); setGameState('START'); }}
                                className="px-5 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold transition-transform hover:scale-105"
                            >
                                VỪA
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setDifficulty('HARD'); setGameState('START'); }}
                                className="px-5 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold transition-transform hover:scale-105"
                            >
                                KHÓ
                            </button>
                        </div>
                    </div>
                )}

                {/* START SCREEN */}
                {gameState === 'START' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white rounded-lg">
                        <Play className="w-16 h-16 mb-2 text-yellow-400 drop-shadow-md animate-pulse" />
                        <h2 className="text-2xl font-black drop-shadow-md">NHẤN ĐỂ CHƠI</h2>
                        <p className="text-sm opacity-90 mb-4">Cấp độ: {difficulty === 'EASY' ? 'Dễ' : (difficulty === 'MEDIUM' ? 'Vừa' : 'Khó')}</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); setGameState('MENU'); }}
                            className="text-xs text-white/70 hover:text-white underline"
                        >
                            Quay lại Menu
                        </button>
                    </div>
                )}

                {/* GAME OVER SCREEN */}
                {gameState === 'GAME_OVER' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white rounded-lg animate-in zoom-in duration-300">
                        <h2 className="text-3xl font-black text-red-500 drop-shadow-lg mb-2">GAME OVER</h2>
                        <div className="bg-white/10 p-4 rounded-lg border border-white/20 mb-4 text-center">
                            <p className="text-sm text-slate-300">Điểm của bạn</p>
                            <p className="text-4xl font-bold text-yellow-400">{score}</p>
                            {score >= highScore && score > 0 && (
                                <div className="mt-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded font-bold animate-pulse">
                                    KỶ LỤC MỚI!
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); resetGame(); }}
                                className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105"
                            >
                                <RotateCcw className="w-5 h-5" /> Chơi Lại
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setGameState('MENU'); }}
                                className="px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-full font-bold"
                            >
                                Menu
                            </button>
                        </div>
                    </div>
                )}

                {/* HUD */}
                {gameState === 'PLAYING' && (
                    <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
                        <span className="text-5xl font-black text-white stroke-black drop-shadow-lg stroke-2">
                            {score}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6 mt-2 text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>Kỷ lục ({difficulty === 'EASY' ? 'Dễ' : (difficulty === 'MEDIUM' ? 'Vừa' : 'Khó')}): <span className="font-bold text-slate-900">{highScore}</span></span>
                </div>
            </div>
        </div>
    );
};
