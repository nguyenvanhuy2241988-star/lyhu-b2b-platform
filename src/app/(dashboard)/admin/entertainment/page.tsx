"use client";

import React, { useState } from 'react';
import { Gamepad2, Gift, Settings, ClipboardList, HelpCircle, Keyboard } from 'lucide-react';
import { GameConfigTab } from '@/components/admin/entertainment/GameConfigTab';
import { RewardManagementTab } from '@/components/admin/entertainment/RewardManagementTab';
import { RedemptionRequestsTab } from '@/components/admin/entertainment/RedemptionRequestsTab';
import { QuizManagementTab } from '@/components/admin/entertainment/QuizManagementTab';
import { TypingManagementTab } from '@/components/admin/entertainment/TypingManagementTab';

export default function AdminEntertainmentPage() {
    const [activeTab, setActiveTab] = useState<'config' | 'rewards' | 'requests' | 'quiz' | 'typing'>('config');

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Gamepad2 className="w-8 h-8 text-[#00AFA9]" /> Quản Trị Giải Trí & Đổi Quà
                </h1>
                <p className="text-slate-500 mt-1">Cấu hình game, quản lý kho quà, nội dung game và duyệt yêu cầu đổi quà.</p>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveTab('config')}
                    className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'config' ? 'border-[#00AFA9] text-[#00AFA9]' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Settings className="w-4 h-4" /> Cấu hình Game
                </button>
                <button
                    onClick={() => setActiveTab('rewards')}
                    className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'rewards' ? 'border-[#00AFA9] text-[#00AFA9]' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Gift className="w-4 h-4" /> Kho Quà
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'requests' ? 'border-[#00AFA9] text-[#00AFA9]' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <ClipboardList className="w-4 h-4" /> Yêu cầu Đổi quà
                </button>
                <button
                    onClick={() => setActiveTab('quiz')}
                    className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'quiz' ? 'border-[#00AFA9] text-[#00AFA9]' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <HelpCircle className="w-4 h-4" /> Đuổi Hình
                </button>
                <button
                    onClick={() => setActiveTab('typing')}
                    className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'typing' ? 'border-[#00AFA9] text-[#00AFA9]' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Keyboard className="w-4 h-4" /> Đua Gõ
                </button>
            </div>

            {/* Content Tab */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[500px]">
                {activeTab === 'config' && <GameConfigTab />}
                {activeTab === 'rewards' && <RewardManagementTab />}
                {activeTab === 'requests' && <RedemptionRequestsTab />}
                {activeTab === 'quiz' && <QuizManagementTab />}
                {activeTab === 'typing' && <TypingManagementTab />}
            </div>
        </div>
    );
}
