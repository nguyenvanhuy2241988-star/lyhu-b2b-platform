"use client";

import { useState } from "react";
import { Smile, Plus } from "lucide-react";
import { useChatStore, Message } from "@/lib/chatStore";

interface MessageReactionProps {
    message: Message;
    currentUserId: string;
}

const PRESET_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export function MessageReaction({ message, currentUserId }: MessageReactionProps) {
    const { addReaction, removeReaction } = useChatStore();
    const [showPicker, setShowPicker] = useState(false);

    // Group reactions by emoji
    const reactionCounts = (message.reactions || []).reduce((acc, curr) => {
        acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Check which ones user has reacted with
    const userReactions = (message.reactions || [])
        .filter(r => r.user_id === currentUserId)
        .map(r => r.emoji);

    const handleReaction = async (emoji: string) => {
        if (userReactions.includes(emoji)) {
            await removeReaction(message.id, emoji);
        } else {
            await addReaction(message.id, emoji);
        }
        setShowPicker(false);
    };

    return (
        <div className="flex items-center gap-1 mt-1 relative group/reaction">
            {Object.entries(reactionCounts).map(([emoji, count]) => {
                const isReacted = userReactions.includes(emoji);
                return (
                    <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors border ${isReacted
                                ? 'bg-blue-100 border-blue-200 text-blue-600'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                        title={isReacted ? "Nhấn để bỏ cảm xúc" : "Nhấn để thêm cảm xúc"}
                    >
                        <span>{emoji}</span>
                        <span className="text-[10px] font-medium">{count}</span>
                    </button>
                );
            })}

            <button
                onClick={() => setShowPicker(!showPicker)}
                className={`p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 group-hover/reaction:opacity-100 transition-opacity ${showPicker ? 'opacity-100 bg-slate-100' : ''} ${Object.keys(reactionCounts).length > 0 ? 'opacity-100' : 'opacity-0'}`}
                title="Thêm cảm xúc"
            >
                <Smile className="w-4 h-4" />
            </button>

            {/* Emoji Picker */}
            {showPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-50 bg-white border border-slate-200 shadow-xl rounded-full px-2 py-1 flex items-center gap-1 animate-in zoom-in-50 duration-200">
                    {PRESET_REACTIONS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            className={`p-1.5 hover:bg-slate-100 rounded-full text-lg transition-transform hover:scale-125 ${userReactions.includes(emoji) ? 'bg-blue-50' : ''}`}
                        >
                            {emoji}
                        </button>
                    ))}
                    <button onClick={() => alert("More emojis coming soon!")} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
