"use client";

import React, { useState, useEffect, useRef } from "react";
import { Keyboard, RotateCcw, Trophy, Timer } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { saveGameScore } from "@/lib/entertainmentStore";

interface TextSample {
    id: string;
    content: string;
    category: string;
}

export const TypingGame = ({ currentUser }: { currentUser: any }) => {
    const [textSamples, setTextSamples] = useState<TextSample[]>([]);
    const [currentText, setCurrentText] = useState<TextSample | null>(null);
    const [input, setInput] = useState("");
    const [startTime, setStartTime] = useState<number | null>(null);
    const [wpm, setWpm] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);

    const inputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    useEffect(() => {
        loadTexts();
    }, []);

    const loadTexts = async () => {
        setLoading(true);
        const { data } = await supabase.from('typing_texts' as any).select('*').limit(20);
        if (data && data.length > 0) {
            setTextSamples(data as any);
            pickRandomText(data as any);
        } else {
            // Fallback
            const fallback = [{ id: '1', content: 'Hello World', category: 'Basic' }];
            setTextSamples(fallback);
            pickRandomText(fallback);
        }
        setLoading(false);
    };

    const pickRandomText = (samples: TextSample[]) => {
        const random = samples[Math.floor(Math.random() * samples.length)];
        setCurrentText(random);
        resetState();
    };

    const resetState = () => {
        setInput("");
        setStartTime(null);
        setWpm(0);
        setIsFinished(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);

        if (!startTime) {
            setStartTime(Date.now());
        }

        if (currentText && val === currentText.content) {
            finishGame();
        }
    };

    const finishGame = async () => {
        if (!startTime || !currentText) return;
        const endTime = Date.now();
        const durationInMinutes = (endTime - startTime) / 60000;
        const words = currentText.content.split(' ').length;
        const calculatedWpm = Math.round(words / durationInMinutes);

        setWpm(calculatedWpm);
        setIsFinished(true);
        saveGameScore('typing', calculatedWpm, currentUser.id);
    };

    const getCharClass = (char: string, index: number) => {
        if (index >= input.length) return "text-slate-400";
        return char === input[index] ? "text-green-600 bg-green-50" : "text-red-500 bg-red-100";
    };

    if (loading) return <div className="text-center p-8 text-slate-400">Đang tải văn bản...</div>;

    return (
        <div className="max-w-3xl mx-auto flex flex-col items-center">
            {/* Stats */}
            <div className="flex gap-8 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <Timer className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Tốc độ</p>
                        <p className="text-2xl font-black text-slate-800">{wpm} <span className="text-sm font-normal text-slate-400">WPM</span></p>
                    </div>
                </div>
            </div>

            {/* Display Text */}
            <div className="w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-6 text-xl md:text-2xl font-mono leading-relaxed relative min-h-[150px] select-none">
                {currentText?.content.split('').map((char, idx) => (
                    <span key={idx} className={getCharClass(char, idx)}>{char}</span>
                ))}
            </div>

            {/* Input */}
            <div className="w-full relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleChange}
                    disabled={isFinished}
                    className="w-full p-4 text-xl rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-50"
                    placeholder={isFinished ? "Hoàn thành!" : "Gõ nội dung trên vào đây..."}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                    <Keyboard className="w-6 h-6" />
                </div>
            </div>

            {/* Controls */}
            {isFinished && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 text-center">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Quá dữ! 🚀</h3>
                    <p className="text-slate-500 mb-6">Bạn gõ với tốc độ <span className="font-bold text-purple-600">{wpm} từ/phút</span>.</p>
                    <button
                        onClick={() => pickRandomText(textSamples)}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-200 mx-auto"
                    >
                        <RotateCcw className="w-5 h-5" /> Thử đoạn khác
                    </button>
                </div>
            )}

            {!isFinished && (
                <button
                    onClick={() => pickRandomText(textSamples)}
                    className="mt-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm"
                >
                    <RotateCcw className="w-4 h-4" /> Đổi đoạn văn khác
                </button>
            )}
        </div>
    );
};
