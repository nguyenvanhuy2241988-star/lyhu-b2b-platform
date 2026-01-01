'use client';

import { useState, useEffect } from 'react';
import { Plus, Megaphone, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

interface Campaign {
    id: string;
    title: string;
    status: 'planning' | 'active' | 'completed' | 'paused';
    budget: number;
    start_date: string;
    end_date: string;
    channel: string;
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isInternalModalOpen, setIsInternalModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [newCampaign, setNewCampaign] = useState({
        title: '',
        budget: 0,
        start_date: '',
        end_date: '',
        channel: 'Facebook',
        status: 'planning'
    });

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false });
        if (data) setCampaigns(data as any);
        setLoading(false);
    };

    const handleCreate = async () => {
        const supabase = createClient();
        const { error } = await supabase.from('marketing_campaigns').insert([newCampaign]);
        if (error) {
            alert('Lỗi khi tạo chiến dịch: ' + error.message);
        } else {
            setIsInternalModalOpen(false);
            loadCampaigns();
            setNewCampaign({ title: '', budget: 0, start_date: '', end_date: '', channel: 'Facebook', status: 'planning' });
        }
    };

    const statusColors = {
        planning: 'bg-slate-100 text-slate-700',
        active: 'bg-green-50 text-green-700',
        paused: 'bg-amber-50 text-amber-700',
        completed: 'bg-blue-50 text-blue-700'
    };

    const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Chiến dịch Marketing</h1>
                    <p className="text-slate-500">Quản lý các hoạt động quảng bá và ngân sách</p>
                </div>
                <button
                    onClick={() => setIsInternalModalOpen(true)}
                    className="flex items-center gap-2 bg-fuchsia-600 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-700 transition"
                >
                    <Plus className="w-4 h-4" /> Tạo chiến dịch
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map(camp => (
                    <div key={camp.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-lg">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${statusColors[camp.status]}`}>
                                {camp.status}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-2 truncate">{camp.title}</h3>

                        <div className="space-y-2 text-sm text-slate-500 mb-4">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-medium text-slate-700">{formatMoney(camp.budget)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{camp.start_date || 'N/A'} - {camp.end_date || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" />
                                <span>{camp.channel}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Modal */}
            {isInternalModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Tạo chiến dịch mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên chiến dịch</label>
                                <input className="w-full border rounded-lg p-2" value={newCampaign.title} onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Kênh (Channel)</label>
                                <select className="w-full border rounded-lg p-2" value={newCampaign.channel} onChange={e => setNewCampaign({ ...newCampaign, channel: e.target.value })}>
                                    <option value="Facebook">Facebook Ads</option>
                                    <option value="Google">Google Ads</option>
                                    <option value="TikTok">TikTok Ads</option>
                                    <option value="Event">Event / Offline</option>
                                    <option value="Other">Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Ngân sách (VND)</label>
                                <input type="number" className="w-full border rounded-lg p-2" value={newCampaign.budget} onChange={e => setNewCampaign({ ...newCampaign, budget: parseInt(e.target.value) })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                                    <input type="date" className="w-full border rounded-lg p-2" value={newCampaign.start_date} onChange={e => setNewCampaign({ ...newCampaign, start_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                                    <input type="date" className="w-full border rounded-lg p-2" value={newCampaign.end_date} onChange={e => setNewCampaign({ ...newCampaign, end_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end mt-6">
                                <button onClick={() => setIsInternalModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Hủy</button>
                                <button onClick={handleCreate} className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700">Tạo mới</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
