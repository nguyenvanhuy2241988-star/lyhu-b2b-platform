"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trash2, Plus, RotateCw, Save, Trophy } from "lucide-react";

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

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Color palette for wheel segments
    const colors = [
        "#F87171", "#fbbf24", "#34D399", "#60A5FA",
        "#A78BFA", "#F472B6", "#FB923C", "#2DD4BF"
    ];

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

        setIsSpinning(true);
        setWinner(null);

        // Random spin calculation
        // Ensure at least 5 full spins (360 * 5) + random stop
        const minSpin = 360 * 5;
        const randomStop = Math.floor(Math.random() * 360);
        const totalSpin = minSpin + randomStop;

        // We accumulate rotation so it flows naturally
        const currentRotation = rotation % 360;
        const newRotation = rotation + totalSpin;

        setRotation(newRotation);

        // Calculate winner
        // The pointer is usually at 0 degrees (Right) or 270 (Top). 
        // Let's assume pointer is at 0 (Right).
        // The segment at 0 degrees after rotation is correct.
        // Actually CSS rotate moves the whole canvas.
        // The winning angle is (360 - (totalSpin % 360)) % 360.

        setTimeout(() => {
            setIsSpinning(false);
            const normalizedRotation = newRotation % 360;
            // Pointer is at right (0 deg) in standard canvas arc 
            // Typically css rotate rotates clockwise.
            // Angle mapping needs care. Let's simplify:
            // Arc size = 360 / count.
            // Effective angle = (360 - normalizedAngle) % 360.

            const sliceDeg = 360 / items.length;
            const effectiveAngle = (360 - normalizedRotation) % 360;
            // Adjustment if pointer is fixed at 0 (Right side)
            // But usually pointer is at top (270deg) or right (0deg).
            // Let's assume specific CSS pointer placement.
            // Let's compute vaguely for now, precise math depends on arrow.

            // Re-calculate simply:
            const winningIndex = Math.floor(effectiveAngle / sliceDeg);
            setWinner(items[winningIndex]);

            // Confetti or sound could go here
        }, 5000); // 5s spin duration matching CSS
    };

    const addItem = () => {
        if (!newItem.trim()) return;
        setItems([...items, newItem.trim()]);
        setNewItem("");
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 items-start justify-center p-4">
            {/* Wheel Section */}
            <div className="flex-1 flex flex-col items-center">
                <div className="relative">
                    {/* Pointer */}
                    <div className="absolute top-1/2 -right-8 -mt-3 w-0 h-0 border-t-[12px] border-t-transparent border-l-[24px] border-l-red-600 border-b-[12px] border-b-transparent z-10 drop-shadow-lg"></div>

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
            <div className="w-full md:w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-5">
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

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 group hover:border-blue-200 transition-colors">
                            <span className="text-sm font-medium text-slate-700 truncate">{item}</span>
                            <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <p className="text-center text-xs text-slate-400 py-4">Chưa có nội dung nào.</p>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center italic">
                    * Nhập ít nhất 2 mục để quay
                </div>
            </div>
        </div>
    );
};
