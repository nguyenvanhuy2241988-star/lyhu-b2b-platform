"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trash2, Plus, RotateCw, Trophy, Edit2, Check } from "lucide-react";

interface LuckyWheelGameProps {
    currentUser: any;
}

export const LuckyWheelGame = ({ currentUser }: LuckyWheelGameProps) => {
    // State
    const [items, setItems] = useState<string[]>([
        "Ngủ trưa 15p", "Mời trà sữa", "Hát 1 bài", "Được về sớm 30p",
        "Rửa bát", "Khao pizza", "Chúc may mắn", "Bị búng tai"
    ]);
    const [newItem, setNewItem] = useState("");
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [rotation, setRotation] = useState(0);

    // Edit State
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Color palette for wheel segments
    const colors = [
        "#F87171", "#fbbf24", "#34D399", "#60A5FA",
        "#A78BFA", "#F472B6", "#FB923C", "#2DD4BF"
    ];

    // Initialize Audio Context
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }, []);

    const playTickSound = () => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    };

    const playWinSound = () => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;

        // Simple major chord arpeggio
        [0, 0.1, 0.2, 0.4].forEach((delay, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major
            osc.frequency.value = freqs[i];
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 1);

            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 1);
        });
    };

    // Draw functions
    const drawWheel = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2 - 10;
        const step = (2 * Math.PI) / items.length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        items.forEach((item, index) => {
            const startAngle = index * step;
            const endAngle = startAngle + step;

            // Slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + step / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px Arial";
            ctx.fillText(item, radius - 20, 5);
            ctx.restore();
        });
    };

    useEffect(() => {
        drawWheel();
    }, [items]);

    const handleSpin = () => {
        if (isSpinning || items.length < 2) return;

        // Resume Audio Context if needed
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

        setIsSpinning(true);
        setWinner(null);

        // Random spin calculation
        const minSpin = 360 * 5;
        const randomStop = Math.floor(Math.random() * 360);
        const totalSpin = minSpin + randomStop;

        const currentRotation = rotation % 360;
        const newRotation = rotation + totalSpin;

        setRotation(newRotation);

        // Sound effect loop
        let start = Date.now();
        const duration = 5000;
        const tickInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - start;
            if (elapsed >= duration) {
                clearInterval(tickInterval);
                return;
            }
            // Logic to play tick based on speed could be complex, 
            // randomly playing ticks for feeling
            if (Math.random() > 0.7) playTickSound();
        }, 100);

        setTimeout(() => {
            clearInterval(tickInterval);
            setIsSpinning(false);
            const normalizedRotation = newRotation % 360;

            // Pointer is at right (0 deg)
            const sliceDeg = 360 / items.length;
            const effectiveAngle = (360 - normalizedRotation) % 360;
            const winningIndex = Math.floor(effectiveAngle / sliceDeg);

            setWinner(items[winningIndex]);
            playWinSound();
        }, 5000);
    };

    // CRUD Handlers
    const addItem = () => {
        if (!newItem.trim()) return;
        setItems([...items, newItem.trim()]);
        setNewItem("");
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const startEdit = (idx: number, val: string) => {
        setEditingIndex(idx);
        setEditValue(val);
    };

    const saveEdit = (idx: number) => {
        if (!editValue.trim()) return;
        const newItems = [...items];
        newItems[idx] = editValue.trim();
        setItems(newItems);
        setEditingIndex(null);
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 items-start justify-center p-4">
            {/* Wheel Section */}
            <div className="flex-1 flex flex-col items-center">
                <div className="relative">
                    {/* Pointer - Flipped to point LEFT into the wheel */}
                    <div className="absolute top-1/2 -right-8 -mt-3 w-0 h-0 border-t-[12px] border-t-transparent border-r-[24px] border-r-red-600 border-b-[12px] border-b-transparent z-10 drop-shadow-lg"></div>

                    {/* Wheel Container */}
                    <div
                        className="rounded-full overflow-hidden shadow-2xl border-4 border-white transition-transform ease-out"
                        style={{
                            width: '400px',
                            height: '400px',
                            transform: `rotate(${rotation}deg)`,
                            transitionDuration: isSpinning ? '5s' : '0s'
                        }}
                    >
                        <canvas ref={canvasRef} width={400} height={400} />
                    </div>
                </div>

                <button
                    disabled={isSpinning || items.length < 2}
                    onClick={handleSpin}
                    className="mt-8 px-12 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xl font-bold rounded-full shadow-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:grayscale"
                >
                    {isSpinning ? "Đang quay..." : "QUAY NGAY!"}
                </button>

                {winner && !isSpinning && (
                    <div className="mt-6 animate-bounce text-center">
                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Kết quả</p>
                        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{winner}</h2>
                    </div>
                )}
            </div>

            {/* Controls Section */}
            <div className="w-full md:w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-5 max-h-[600px] flex flex-col">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <RotateCw className="w-5 h-5 text-blue-500" /> Thiết lập vòng quay
                </h3>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addItem()}
                        placeholder="Nhập nội dung..."
                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={addItem} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 group hover:border-blue-200 transition-colors">
                            {editingIndex === idx ? (
                                <div className="flex items-center gap-1 w-full">
                                    <input
                                        autoFocus
                                        className="w-full text-sm px-1 py-0.5 border border-blue-300 rounded focus:outline-none"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && saveEdit(idx)}
                                    />
                                    <button onClick={() => saveEdit(idx)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check className="w-3 h-3" /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="text-sm font-medium text-slate-700 truncate cursor-pointer" onClick={() => startEdit(idx, item)} title="Bấm để sửa">{item}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(idx, item)} className="text-slate-400 hover:text-blue-500 p-1">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 p-1">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {items.length === 0 && (
                        <p className="text-center text-xs text-slate-400 py-4">Chưa có nội dung nào.</p>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center italic">
                    * Mũi tên chỉ vào item nào khi dừng lại là thắng
                </div>
            </div>
        </div>
    );
};
