"use client";

import React, { useState, useEffect } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

interface QuizQuestion {
    id: string;
    question: string;
    image_url?: string;
    correct_answer: string;
    options?: any; // JSONB comes as any or array
    explanation?: string;
}

export const QuizGame = () => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'LOADING' | 'PLAYING' | 'FINISHED'>('LOADING');
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const supabase = createClient();

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        const { data, error } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('game_code', 'quiz_image')
            .limit(10);

        if (data) {
            setQuestions(data);
            setGameState(data.length > 0 ? 'PLAYING' : 'FINISHED');
        } else {
            setGameState('FINISHED');
        }
    };

    const handleAnswer = (answer: string) => {
        if (selectedAnswer) return; // Prevent multiple clicks

        setSelectedAnswer(answer);
        const currentQ = questions[currentIndex];
        const correct = answer === currentQ.correct_answer;

        setIsCorrect(correct);
        if (correct) setScore(s => s + 1);

        // Auto move next after 2s
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1);
                setSelectedAnswer(null);
                setIsCorrect(null);
            } else {
                setGameState('FINISHED');
            }
        }, 2000);
    };

    const resetGame = () => {
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setGameState('PLAYING');
    };

    if (gameState === 'LOADING') return <div className="p-8 text-center text-slate-500">Đang tải câu hỏi...</div>;

    if (gameState === 'FINISHED') return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🎉</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Hoàn thành!</h2>
            <p className="text-slate-600 mb-6">Bạn trả lời đúng <span className="font-bold text-purple-600 text-xl">{score}/{questions.length}</span> câu.</p>

            <button onClick={resetGame} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                Chơi lại
            </button>
        </div>
    );

    const currentQ = questions[currentIndex];

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-6 flex items-center gap-4">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                    />
                </div>
                <span className="text-sm font-medium text-slate-500">
                    {currentIndex + 1}/{questions.length}
                </span>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
                {currentQ.image_url && (
                    <div className="h-48 md:h-64 bg-slate-100 w-full relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={currentQ.image_url}
                            alt="Question"
                            className="w-full h-full object-contain p-4"
                        />
                    </div>
                )}

                <div className="p-6">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6">
                        {currentQ.question}
                    </h3>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentQ.options && (currentQ.options as string[]).map((opt: string, idx: number) => {
                            let stateClass = "border-slate-200 hover:border-purple-300 hover:bg-purple-50";

                            if (selectedAnswer) {
                                if (opt === currentQ.correct_answer) {
                                    stateClass = "border-green-500 bg-green-50 text-green-700";
                                } else if (opt === selectedAnswer) {
                                    stateClass = "border-red-500 bg-red-50 text-red-700";
                                } else {
                                    stateClass = "border-slate-100 opacity-50";
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    disabled={!!selectedAnswer}
                                    onClick={() => handleAnswer(opt)}
                                    className={`p-4 rounded-lg border-2 text-left font-medium transition-all ${stateClass}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{opt}</span>
                                        {selectedAnswer && opt === currentQ.correct_answer && <Check className="w-5 h-5 text-green-600" />}
                                        {selectedAnswer && opt === selectedAnswer && opt !== currentQ.correct_answer && <X className="w-5 h-5 text-red-600" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {selectedAnswer && currentQ.explanation && (
                        <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm flex gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div>
                                <span className="font-bold block mb-1">Giải thích:</span>
                                {currentQ.explanation}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
