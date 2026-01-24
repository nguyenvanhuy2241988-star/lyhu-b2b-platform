'use client';

import React, { useEffect, useState } from 'react';
import { StagingLead, getPendingLeads, rejectLead, approveLeadToCRM } from '@/lib/marketingLeadsStore';
import { supabase } from '@/lib/supabaseClient';
import { Check, X, ExternalLink, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function MarketingLeadsPage() {
    const [leads, setLeads] = useState<StagingLead[]>([]);
    const [loading, setLoading] = useState(false);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const data = await getPendingLeads();
            setLeads(data);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải danh sách Lead");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeads();

        // Realtime Subscription
        const channel = supabase
            .channel('marketing_leads_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'marketing_leads_staging' }, (payload: any) => {
                setLeads(prev => [payload.new as StagingLead, ...prev]);
                toast.info("Có Lead mới đổ về!");
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleApprove = async (lead: StagingLead) => {
        try {
            await approveLeadToCRM(lead);
            setLeads(prev => prev.filter(l => l.id !== lead.id));
            toast.success(`Đã duyệt: ${lead.name}`);
        } catch (e) {
            toast.error("Lỗi duyệt lead");
        }
    };

    const handleReject = async (lead: StagingLead) => {
        if (!confirm("Chắc chắn loại bỏ Lead này?")) return;
        try {
            await rejectLead(lead.id);
            setLeads(prev => prev.filter(l => l.id !== lead.id));
            toast.success("Đã loại bỏ");
        } catch (e) {
            toast.error("Lỗi từ chối lead");
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Duyệt Lead Marketing</h1>
                    <p className="text-slate-500">Danh sách khách hàng tiềm năng do Bot thu thập</p>
                </div>
                <button
                    onClick={loadLeads}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {leads.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Hiện chưa có Lead nào cần duyệt.</p>
                    <p className="text-sm text-slate-400">Hãy chạy Bot để đi săn khách hàng!</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {leads.map(lead => (
                        <div key={lead.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{lead.name || 'Unknown User'}</h3>
                                    <a
                                        href={lead.profile_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 text-sm hover:underline flex items-center gap-1 mt-1"
                                    >
                                        <ExternalLink className="w-3 h-3" /> Xem Profile
                                    </a>
                                </div>
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase">
                                    {lead.source}
                                </span>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <p><span className="font-medium text-slate-500">SĐT:</span> {lead.phone || 'Chưa có'}</p>
                                <p><span className="font-medium text-slate-500">Time:</span> {new Date(lead.created_at).toLocaleString('vi-VN')}</p>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handleReject(lead)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <X className="w-4 h-4" /> Bỏ qua
                                </button>
                                <button
                                    onClick={() => handleApprove(lead)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-green-200"
                                >
                                    <Check className="w-4 h-4" /> Duyệt CRM
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
