'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Zap, Users, Loader2, RefreshCw, Check, Clock, Phone, MapPin, MessageSquare, User as UserIcon, Bell, AlertCircle } from 'lucide-react';

interface TelesalesUser {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_online: boolean;
    last_seen: string | null;
}

interface DistConfig {
    enabled: boolean;
    eligible_user_ids: string[];
    only_online: boolean;
    fallback_delay_minutes: number;
}

interface MarketingLead {
    id: string;
    customer_name: string;
    customer_phone: string;
    region: string | null;
    source: string;
    page_name: string | null;
    status: string;
    assigned_to: string | null;
    assigned_at: string | null;
    created_at: string;
    conversation_id: string | null;
    social_conversations?: {
        tags: string[] | null;
        customer_type: string | null;
        interested_products: string[] | null;
        referral_source: string | null;
        ad_id: string | null;
        source_type: string | null;
        facebook_pages?: { name: string } | null;
    } | null;
}

interface FollowupConv {
    id: string;
    customer_name: string;
    external_id: string;
    followup_count: number;
    last_message_at: string;
    needs_followup: boolean;
}

export default function LeadDistributionSettings() {
    const [config, setConfig] = useState<DistConfig>({
        enabled: true,
        eligible_user_ids: [],
        only_online: true,
        fallback_delay_minutes: 5
    });
    const [users, setUsers] = useState<TelesalesUser[]>([]);
    const [leads, setLeads] = useState<MarketingLead[]>([]);
    const [followups, setFollowups] = useState<FollowupConv[]>([]);
    const [totalLeads, setTotalLeads] = useState(0);
    const [totalFollowups, setTotalFollowups] = useState(0);
    const [leadsPage, setLeadsPage] = useState(0);
    const [leadsPageSize, setLeadsPageSize] = useState(20);
    const [followupsPage, setFollowupsPage] = useState(0);
    const [followupsPageSize, setFollowupsPageSize] = useState(20);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedRecently, setSavedRecently] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Load config
            const { data: cfgData } = await supabase
                .from('lead_distribution_config')
                .select('*')
                .eq('id', 1)
                .single();
            if (cfgData) {
                setConfig({
                    enabled: cfgData.enabled,
                    eligible_user_ids: cfgData.eligible_user_ids || [],
                    only_online: cfgData.only_online,
                    fallback_delay_minutes: cfgData.fallback_delay_minutes
                });
            }

            // Load all telesales users
            const { data: usersData } = await supabase.rpc('get_users_activity_stats');
            if (usersData) {
                const telesales = usersData
                    .filter((u: any) => u.role === 'telesales' || u.role === 'sale_admin')
                    .map((u: any) => ({
                        id: u.user_id,
                        full_name: u.full_name,
                        email: u.email,
                        role: u.role,
                        is_online: u.is_online,
                        last_seen: u.last_seen
                    }));
                setUsers(telesales);
            }

            // Load leads with joined conversation data
            const leadsFrom = leadsPage * leadsPageSize;
            const leadsTo = leadsFrom + leadsPageSize - 1;
            const { data: leadsData, count: leadsCount } = await supabase
                .from('marketing_leads')
                .select('*, social_conversations!conversation_id(tags, customer_type, interested_products, referral_source, ad_id, source_type, facebook_pages!page_id(name))', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(leadsFrom, leadsTo);
            if (leadsData) setLeads(leadsData);
            if (leadsCount !== null) setTotalLeads(leadsCount);

            // Load follow-up conversations
            const fuFrom = followupsPage * followupsPageSize;
            const fuTo = fuFrom + followupsPageSize - 1;
            const { data: followupData, count: followupCount } = await supabase
                .from('social_conversations')
                .select('id, customer_name, external_id, followup_count, last_message_at, needs_followup, tags, interested_products', { count: 'exact' })
                .eq('needs_followup', true)
                .is('customer_phone', null)
                .order('last_message_at', { ascending: true })
                .range(fuFrom, fuTo);
            if (followupData) setFollowups(followupData);
            if (followupCount !== null) setTotalFollowups(followupCount);

        } catch (err) {
            console.error('Load lead dist data error:', err);
        } finally {
            setLoading(false);
        }
    }, [leadsPage, leadsPageSize, followupsPage, followupsPageSize]);

    useEffect(() => { loadData(); }, [loadData]);

    // Pagination helper
    const PaginationControls = ({ page, setPage, pageSize, setPageSize, total, label }: {
        page: number; setPage: (p: number) => void;
        pageSize: number; setPageSize: (s: number) => void;
        total: number; label: string;
    }) => {
        const totalPages = Math.ceil(total / pageSize);

        // Generate page numbers with ellipsis
        const getPageNumbers = () => {
            const pages: (number | string)[] = [];
            if (totalPages <= 7) {
                for (let i = 0; i < totalPages; i++) pages.push(i);
            } else {
                pages.push(0); // always show first
                if (page > 2) pages.push('...');
                for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) {
                    pages.push(i);
                }
                if (page < totalPages - 3) pages.push('...');
                pages.push(totalPages - 1); // always show last
            }
            return pages;
        };

        return (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Hiển thị</span>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                        className="border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span>/ {total} {label}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="px-2 py-1 text-xs rounded border border-slate-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >←</button>
                    {getPageNumbers().map((p, i) =>
                        typeof p === 'string' ? (
                            <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">...</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`min-w-[28px] py-1 text-xs rounded border transition ${p === page
                                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                        : 'border-slate-300 hover:bg-white text-slate-600'
                                    }`}
                            >{p + 1}</button>
                        )
                    )}
                    <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-2 py-1 text-xs rounded border border-slate-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >→</button>
                </div>
            </div>
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('lead_distribution_config')
                .upsert({
                    id: 1,
                    enabled: config.enabled,
                    eligible_user_ids: config.eligible_user_ids,
                    only_online: config.only_online,
                    fallback_delay_minutes: config.fallback_delay_minutes,
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
            setSavedRecently(true);
            setTimeout(() => setSavedRecently(false), 2000);
        } catch (err) {
            console.error('Save config error:', err);
        } finally {
            setSaving(false);
        }
    };

    const toggleUser = (userId: string) => {
        setConfig(prev => ({
            ...prev,
            eligible_user_ids: prev.eligible_user_ids.includes(userId)
                ? prev.eligible_user_ids.filter(id => id !== userId)
                : [...prev.eligible_user_ids, userId]
        }));
    };

    const selectAll = () => {
        setConfig(prev => ({
            ...prev,
            eligible_user_ids: users.map(u => u.id)
        }));
    };

    const deselectAll = () => {
        setConfig(prev => ({ ...prev, eligible_user_ids: [] }));
    };

    // Stats
    const todayLeads = leads.filter(l => {
        const d = new Date(l.created_at);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    });
    const pendingCount = leads.filter(l => l.status === 'pending').length;
    const assignedCount = leads.filter(l => l.status === 'assigned').length;
    const onlineEligible = users.filter(u => config.eligible_user_ids.includes(u.id) && u.is_online).length;
    const followupPending = followups.filter(f => (f.followup_count || 0) < 3).length;
    const followupDone = followups.filter(f => (f.followup_count || 0) >= 3).length;

    // Get user name by id
    const getUserName = (id: string | null) => {
        if (!id) return '—';
        const user = users.find(u => u.id === id);
        return user?.full_name || id.slice(0, 8);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Phân chia Data tự động</h3>
                        <p className="text-xs text-slate-500">Data từ Messenger → CRM Telesales</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={loadData} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedRecently ? <Check className="w-4 h-4" /> : null}
                        {savedRecently ? 'Đã lưu!' : 'Lưu cài đặt'}
                    </button>
                </div>
            </div>

            {/* Toggle + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Enable Toggle */}
                <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${config.enabled ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
                    onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium uppercase text-slate-500">Trạng thái</span>
                        <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${config.enabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                            <div className="w-5 h-5 bg-white rounded-full shadow" />
                        </div>
                    </div>
                    <span className={`text-sm font-bold ${config.enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {config.enabled ? '🟢 Đang hoạt động' : '⏸️ Tạm dừng'}
                    </span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <span className="text-xs font-medium uppercase text-blue-600">Hôm nay</span>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{todayLeads.length}</p>
                    <p className="text-[10px] text-slate-400">data mới</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="text-xs font-medium uppercase text-amber-600">Đang chờ</span>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{pendingCount}</p>
                    <p className="text-[10px] text-slate-400">chưa phân chia</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-xs font-medium uppercase text-emerald-600">Online</span>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{onlineEligible}/{config.eligible_user_ids.length}</p>
                    <p className="text-[10px] text-slate-400">telesales sẵn sàng</p>
                </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Chọn nhân sự nhận Data
                </h4>

                <div className="flex gap-3 mb-4">
                    <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">Chọn tất cả</button>
                    <button onClick={deselectAll} className="text-xs text-slate-400 hover:underline">Bỏ chọn tất cả</button>
                    <label className="flex items-center gap-2 ml-auto cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.only_online}
                            onChange={(e) => setConfig(prev => ({ ...prev, only_online: e.target.checked }))}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-600">Chỉ chia khi online</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {users.map(user => {
                        const isSelected = config.eligible_user_ids.includes(user.id);
                        return (
                            <div
                                key={user.id}
                                onClick={() => toggleUser(user.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                    ? 'border-blue-200 bg-blue-50 ring-1 ring-blue-200'
                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                    }`}
                            >
                                <input type="checkbox" checked={isSelected} readOnly className="rounded border-slate-300 text-blue-600 pointer-events-none" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-800 truncate">{user.full_name || user.email}</div>
                                    <div className="text-[10px] text-slate-400">{user.role}</div>
                                </div>
                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${user.is_online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                    {user.is_online ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {users.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-6">Chưa có nhân sự telesales nào</p>
                )}
            </div>

            {/* Recent Leads Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        Data có SĐT ({totalLeads})
                    </h4>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                            🟡 {pendingCount} đang chờ
                        </span>
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                            🟢 {assignedCount} đã phân
                        </span>
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
                            📋 {leads.filter(l => l.status === 'historical').length} lịch sử
                        </span>
                    </div>
                </div>

                {leads.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        Chưa có data nào từ Messenger
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[700px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Khách hàng</th>
                                    <th className="px-4 py-3 font-medium">SĐT</th>
                                    <th className="px-4 py-3 font-medium">Khu vực</th>
                                    <th className="px-4 py-3 font-medium">Fanpage</th>
                                    <th className="px-4 py-3 font-medium">Nguồn</th>
                                    <th className="px-4 py-3 font-medium">Thông tin KH</th>
                                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                                    <th className="px-4 py-3 font-medium">Phân cho</th>
                                    <th className="px-4 py-3 font-medium">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leads.map(lead => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{lead.customer_name || '—'}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-700">{lead.customer_phone}</td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {lead.region ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {lead.region}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {(() => {
                                                const conv = (lead as any).social_conversations;
                                                return conv?.facebook_pages?.name || lead.page_name || '—';
                                            })()}
                                        </td>
                                        <td className="px-4 py-3">
                                            {(() => {
                                                const conv = (lead as any).social_conversations;
                                                const isAd = conv?.referral_source === 'ADS' || conv?.ad_id || conv?.source_type === 'ads';
                                                const isOrganic = conv?.source_type === 'organic';
                                                return isAd
                                                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">📎 Quảng cáo</span>
                                                    : isOrganic
                                                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">🌿 Tự nhiên</span>
                                                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">❓ Chưa xác định</span>;
                                            })()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-1">
                                                {(() => {
                                                    const conv = (lead as any).social_conversations;
                                                    const tags = conv?.tags || [];
                                                    const products = conv?.interested_products || [];
                                                    const type = conv?.customer_type;
                                                    return (
                                                        <>
                                                            {type && <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 mr-1">{type}</span>}
                                                            {products.slice(0, 2).map((p: string) => (
                                                                <span key={p} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 mr-1 mb-0.5">{p}</span>
                                                            ))}
                                                            {tags.slice(0, 2).map((t: string) => (
                                                                <span key={t} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 mr-1 mb-0.5">{t}</span>
                                                            ))}
                                                            {(products.length + tags.length) === 0 && !type && <span className="text-xs text-slate-300">—</span>}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {lead.status === 'assigned' ? (
                                                <div>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                        <Check className="w-3 h-3" /> Đã phân
                                                    </span>
                                                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <UserIcon className="w-3 h-3" /> {getUserName(lead.assigned_to)}
                                                    </div>
                                                </div>
                                            ) : lead.status === 'pending' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                    <Clock className="w-3 h-3" /> Đang chờ
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                                    {lead.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {lead.assigned_to ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <UserIcon className="w-3 h-3" /> {getUserName(lead.assigned_to)}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {new Date(lead.created_at).toLocaleString('vi-VN', {
                                                day: '2-digit', month: '2-digit',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <PaginationControls page={leadsPage} setPage={setLeadsPage} pageSize={leadsPageSize} setPageSize={setLeadsPageSize} total={totalLeads} label="data" />
            </div>

            {/* Follow-up Monitoring Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-purple-600" />
                        AI Follow-up — Nhắn lại xin SĐT ({totalFollowups})
                    </h4>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                            ⏳ {followupPending} đang chờ nhắn
                        </span>
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
                            ✅ {followupDone} đã nhắn 3 lần
                        </span>
                        <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                            🔄 Cron mỗi 2 giờ
                        </span>
                    </div>
                </div>

                {followups.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                        <AlertCircle className="w-5 h-5 mx-auto mb-2 text-slate-300" />
                        Tất cả khách đã gửi SĐT hoặc chưa có cuộc trò chuyện nào
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Khách hàng</th>
                                    <th className="px-4 py-3 font-medium">Lần nhắc</th>
                                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                                    <th className="px-4 py-3 font-medium">Tin nhắn cuối</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {followups.map(f => {
                                    const count = f.followup_count || 0;
                                    const hoursSince = Math.round((Date.now() - new Date(f.last_message_at).getTime()) / (1000 * 60 * 60));
                                    const tierLabels = ['Chưa nhắc', 'Đã nhắc lần 1', 'Đã nhắc lần 2', 'Đã nhắc 3 lần ✋'];
                                    return (
                                        <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-800">{f.customer_name || '—'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {[0, 1, 2].map(i => (
                                                        <div key={i} className={`w-3 h-3 rounded-full ${i < count ? 'bg-purple-500' : 'bg-slate-200'}`} />
                                                    ))}
                                                    <span className="text-xs text-slate-500 ml-1">{count}/3</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${count >= 3 ? 'bg-slate-100 text-slate-500' : count > 0 ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {tierLabels[Math.min(count, 3)]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                {hoursSince < 1 ? 'Vừa xong' : hoursSince < 24 ? `${hoursSince} giờ trước` : `${Math.round(hoursSince / 24)} ngày trước`}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <PaginationControls page={followupsPage} setPage={setFollowupsPage} pageSize={followupsPageSize} setPageSize={setFollowupsPageSize} total={totalFollowups} label="khách" />
            </div>
        </div>
    );
}
