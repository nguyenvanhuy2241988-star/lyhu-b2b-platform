"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Trophy, Save } from "lucide-react";
import { saveGameScore, getMyBestScore } from "@/lib/entertainmentStore";

interface LyhuBirdGameProps {
    currentUser: any;
    onScoreUpdate?: () => void;
}

export const LyhuBirdGame = ({ currentUser, onScoreUpdate }: LyhuBirdGameProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER'>('START');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Game Constants
    const GRAVITY = 0.6;
    const JUMP = -8; // Slightly stronger jump
    const PIPE_SPEED = 3;
    const PIPE_SPAWN_RATE = 100; // Frames
    const PIPE_GAP = 140; // Pixel gap

    // Game Refs (Mutable state for loop)
    const birdY = useRef(200);
    const birdVelocity = useRef(0);
    const pipes = useRef<{ x: number, topHeight: number, passed: boolean }[]>([]);
    const frameCount = useRef(0);
    const requestRef = useRef<number>();

    // Load High Score
    useEffect(() => {
        if (currentUser?.id) {
            getMyBestScore('lyhu_bird', currentUser.id).then(setHighScore);
        }
    }, [currentUser]);

    // Game Loop
    const loop = () => {
        if (gameState !== 'PLAYING') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Update Physics
        birdVelocity.current += GRAVITY;
        birdY.current += birdVelocity.current;

        // Spawn Pipes
        if (frameCount.current % PIPE_SPAWN_RATE === 0) {
            const minHeight = 50;
            const maxHeight = canvas.height - PIPE_GAP - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
            pipes.current.push({ x: canvas.width, topHeight, passed: false });
        }
        frameCount.current++;

        // Update Pipes
        pipes.current.forEach(pipe => {
            pipe.x -= PIPE_SPEED;
        });
        // Remove off-screen pipes
        if (pipes.current.length > 0 && pipes.current[0].x < -60) {
            pipes.current.shift();
        }

        // 2. Collision Detection
        // Floor/Ceiling
        if (birdY.current + 20 > canvas.height || birdY.current < 0) {
            handleGameOver();
            return;
        }

        // Pipes
        const birdRect = { x: 50, y: birdY.current, w: 30, h: 30 }; // Bird is at x=50

        pipes.current.forEach(pipe => {
            // Pipe Rects
            const pipeW = 50;
            const topPipeRect = { x: pipe.x, y: 0, w: pipeW, h: pipe.topHeight };
            const bottomPipeRect = { x: pipe.x, y: pipe.topHeight + PIPE_GAP, w: pipeW, h: canvas.height - (pipe.topHeight + PIPE_GAP) };

            if (checkCollision(birdRect, topPipeRect) || checkCollision(birdRect, bottomPipeRect)) {
                handleGameOver();
                return;
            }

            // Score counting
            if (!pipe.passed && pipe.x + pipeW < birdRect.x) {
                pipe.passed = true;
                setScore(prev => prev + 1);
            }
        });

        // 3. Render
        draw(ctx, canvas);

        // Next Frame
        requestRef.current = requestAnimationFrame(loop);
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background (Sky)
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Pipes
        ctx.fillStyle = '#22c55e'; // Green
        ctx.strokeStyle = '#15803d'; // Dark Green Border
        ctx.lineWidth = 2;

        pipes.current.forEach(pipe => {
            // Top Pipe
            ctx.fillRect(pipe.x, 0, 50, pipe.topHeight);
            ctx.strokeRect(pipe.x, 0, 50, pipe.topHeight);

            // Bottom Cap style
            ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, 54, 20);
            ctx.strokeRect(pipe.x - 2, pipe.topHeight - 20, 54, 20);


            // Bottom Pipe
            const bottomY = pipe.topHeight + PIPE_GAP;
            const bottomH = canvas.height - bottomY;
            ctx.fillRect(pipe.x, bottomY, 50, bottomH);
            ctx.strokeRect(pipe.x, bottomY, 50, bottomH);

            // Top Cap style
            ctx.fillRect(pipe.x - 2, bottomY, 54, 20);
            ctx.strokeRect(pipe.x - 2, bottomY, 54, 20);
        });

        // Bird (Yellow Box for now, or simple shape)
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(65, birdY.current + 15, 15, 0, 2 * Math.PI); // Center x=50+15=65
        ctx.fill();
        ctx.stroke();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(70, birdY.current + 10, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(72, birdY.current + 10, 2, 0, 2 * Math.PI);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(75, birdY.current + 15);
        ctx.lineTo(85, birdY.current + 20);
        ctx.lineTo(75, birdY.current + 25);
        ctx.fill();

        // Ground (Visual only)
        // ...
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

        // Auto save if high score
        if (score > highScore) {
            handleSaveScore(score);
        }
    };

    const handleSaveScore = async (finalScore: number) => {
        if (!currentUser?.id) return;
        setIsSaving(true);
        try {
            await saveGameScore('lyhu_bird', finalScore, currentUser.id);
            setHighScore(finalScore);
            if (onScoreUpdate) onScoreUpdate();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const startGame = () => {
        // Reset Physics
        birdY.current = 200;
        birdVelocity.current = 0;
        pipes.current = [];
        frameCount.current = 0;
        setScore(0);

        setGameState('PLAYING');
    };

    const handleJump = () => {
        if (gameState === 'PLAYING') {
            birdVelocity.current = JUMP;
        } else if (gameState !== 'PLAYING') {
            startGame();
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
    }, [gameState]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault(); // Prevent scroll
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
                    className="border-4 border-slate-800 rounded-lg shadow-xl bg-sky-200"
                />

                {/* Overlay Screen: Start */}
                {gameState === 'START' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white rounded-lg">
                        <Play className="w-16 h-16 mb-2 text-yellow-400 drop-shadow-md animate-pulse" />
                        <h2 className="text-2xl font-black drop-shadow-md">NHẤN ĐỂ CHƠI</h2>
                        <p className="text-sm opacity-90">Dùng phím CÁCH hoặc Click chuột</p>
                    </div>
                )}

                {/* Overlay: Game Over */}
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

                        <button
                            onClick={(e) => { e.stopPropagation(); startGame(); }}
                            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105"
                        >
                            <RotateCcw className="w-5 h-5" /> Chơi Lại
                        </button>
                    </div>
                )}

                {/* HUD */}
                <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
                    <span className="text-5xl font-black text-white stroke-black drop-shadow-lg stroke-2">
                        {score}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6 mt-2 text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>Kỷ lục của bạn: <span className="font-bold text-slate-900">{highScore}</span></span>
                </div>
            </div>
        </div>
    );
};
