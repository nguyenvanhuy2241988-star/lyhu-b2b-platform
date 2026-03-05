"use client";

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Terminal, Activity, Wifi } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

type LogEntry = {
    id: string;
    created_at: string;
    action_type: string;
    status: 'success' | 'info' | 'error' | 'warning';
    details: {
        message: string;
        profile_url?: string; // Optional URL field
    };
};

export default function BotActivityLog() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const [stats, setStats] = useState({ sent: 0, errors: 0 });

    useEffect(() => {
        // Initial fetch (last 20 logs)
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('marketing_action_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) setLogs(data.reverse());
        };
        fetchRecent();

        // NOTE: Realtime disabled to save Supabase egress.
        // Logs load once on page open. Refresh manually if needed.
    }, []);

    // Auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700 flex flex-col h-[400px]">
            {/* Header */}
            <div className="bg-slate-800 p-3 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-400 my-auto" />
                    <span className="font-mono text-xs font-bold text-slate-200">BOT TERMINAL (LIVE)</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-700 rounded text-[10px] text-slate-300">
                        <Activity className="w-3 h-3" />
                        <span>Status: Online</span>
                    </div>
                    <Wifi className="w-3 h-3 text-green-500 animate-pulse" />
                </div>
            </div>

            {/* Logs Window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {logs.length === 0 && (
                    <div className="text-slate-500 text-center italic mt-10">Chưa có hoạt động nào...</div>
                )}

                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-slate-500 min-w-[60px]">
                            [{dayjs(log.created_at).format('HH:mm:ss')}]
                        </span>

                        <div className="flex-1 break-words">
                            {log.action_type === 'defense' && <span className="text-purple-400 font-bold mr-2">[DEFENSE]</span>}
                            {log.action_type === 'search' && <span className="text-blue-400 font-bold mr-2">[SEARCH]</span>}
                            {log.action_type === 'invite' && <span className="text-green-400 font-bold mr-2">[INVITE]</span>}

                            <span className={
                                log.status === 'error' ? 'text-red-400' :
                                    log.status === 'success' ? 'text-green-300' :
                                        log.status === 'warning' ? 'text-yellow-300' :
                                            'text-slate-300'
                            }>
                                {log.details.message}
                            </span>

                            {/* Profile Link Button */}
                            {log.details.profile_url && (
                                <a
                                    href={log.details.profile_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 px-2 py-0.5 bg-blue-900 border border-blue-700 text-blue-300 rounded hover:bg-blue-800 transition-colors text-[10px] inline-flex items-center gap-1"
                                >
                                    ↗ Xem Profile
                                </a>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Footer Status */}
            <div className="bg-slate-950 p-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                <span>Session ID: {Math.random().toString(36).substring(7)}</span>
                <span>Active Threads: 1</span>
            </div>
        </div>
    );
}
