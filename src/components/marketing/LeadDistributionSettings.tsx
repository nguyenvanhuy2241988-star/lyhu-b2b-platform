'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Zap, Users, Loader2, RefreshCw, Check, Clock, Phone, MapPin, MessageSquare, User as UserIcon, Bell, AlertCircle, Calendar, Building2, Home } from 'lucide-react';

type DateFilterMode = 'day' | 'week' | 'month' | 'year' | 'custom';

function getDateRange(mode: DateFilterMode, customFrom?: string, customTo?: string): { start: string; end: string } {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start: Date;

    switch (mode) {
        case 'day':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            break;
        case 'week': {
            const day = now.getDay(); // 0=Sun
            const diff = day === 0 ? 6 : day - 1; // Monday as start
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0, 0);
            break;
        }
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            break;
        case 'year':
            start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            break;
        case 'custom':
            return {
                start: customFrom ? new Date(customFrom + 'T00:00:00').toISOString() : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString(),
                end: customTo ? new Date(customTo + 'T23:59:59.999').toISOString() : endOfToday.toISOString(),
            };
        default:
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }
    return { start: start.toISOString(), end: endOfToday.toISOString() };
}

const DATE_FILTER_LABELS: Record<DateFilterMode, string> = {
    day: 'Hôm nay',
    week: 'Tuần này',
    month: 'Tháng này',
    year: 'Năm nay',
    custom: 'Khoảng chọn',
};

interface TelesalesUser {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_online: boolean;
    last_seen: string | null;
    current_ip: string | null;
}

interface DistConfig {
    enabled: boolean;
    eligible_user_ids: string[];
    only_online: boolean;
    only_company_ip: boolean;
    company_ips: string[];
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
        only_company_ip: false,
        company_ips: [],
        fallback_delay_minutes: 5
    });
    const [myIp, setMyIp] = useState<string | null>(null);
    const [companyIpInput, setCompanyIpInput] = useState('');
    const [users, setUsers] = useState<TelesalesUser[]>([]);
    const [leads, setLeads] = useState<MarketingLead[]>([]);
    const [followups, setFollowups] = useState<FollowupConv[]>([]);
    const [totalLeads, setTotalLeads] = useState(0);
    const [totalFollowups, setTotalFollowups] = useState(0);
    // Full date-range stats (not paginated)
    const [distributionStats, setDistributionStats] = useState<Record<string, number>>({});
    const [totalPending, setTotalPending] = useState(0);
    const [totalAssigned, setTotalAssigned] = useState(0);
    const [totalHistorical, setTotalHistorical] = useState(0);
    // Date filter
    const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('day');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [leadsPage, setLeadsPage] = useState(0);
    const [leadsPageSize, setLeadsPageSize] = useState(20);
    const [followupsPage, setFollowupsPage] = useState(0);
    const [followupsPageSize, setFollowupsPageSize] = useState(20);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedRecently, setSavedRecently] = useState(false);
    const [leadsSearch, setLeadsSearch] = useState('');
    const [leadsStatusFilter, setLeadsStatusFilter] = useState('all');
    const [followupsSearch, setFollowupsSearch] = useState('');
    // Debounced search values — only trigger API after 500ms pause
    const [debouncedLeadsSearch, setDebouncedLeadsSearch] = useState('');
    const [debouncedFollowupsSearch, setDebouncedFollowupsSearch] = useState('');
    const [chatStats, setChatStats] = useState({
        totalConv: 0, hasPhone: 0, aiFollowed: 0, phoneAfterAi: 0,
        tier1Sent: 0, tier1Phone: 0, tier2Sent: 0, tier2Phone: 0, tier3Sent: 0, tier3Phone: 0
    });
    const leadsTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const fuTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const isInitialLoad = useRef(true);

    useEffect(() => {
        leadsTimerRef.current && clearTimeout(leadsTimerRef.current);
        leadsTimerRef.current = setTimeout(() => { setDebouncedLeadsSearch(leadsSearch); setLeadsPage(0); }, 500);
        return () => leadsTimerRef.current && clearTimeout(leadsTimerRef.current);
    }, [leadsSearch]);

    useEffect(() => {
        fuTimerRef.current && clearTimeout(fuTimerRef.current);
        fuTimerRef.current = setTimeout(() => { setDebouncedFollowupsSearch(followupsSearch); setFollowupsPage(0); }, 500);
        return () => fuTimerRef.current && clearTimeout(fuTimerRef.current);
    }, [followupsSearch]);

    const loadData = useCallback(async () => {
        if (isInitialLoad.current) setLoading(true);
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
                    only_company_ip: cfgData.only_company_ip || false,
                    company_ips: cfgData.company_ips || [],
                    fallback_delay_minutes: cfgData.fallback_delay_minutes
                });
                setCompanyIpInput((cfgData.company_ips || []).join(', '));
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
                        last_seen: u.last_seen,
                        current_ip: u.current_ip || null
                    }));
                setUsers(telesales);
            }

            // Load leads with joined conversation data
            const leadsFrom = leadsPage * leadsPageSize;
            const leadsTo = leadsFrom + leadsPageSize - 1;
            // Calculate date range for filter
            const { start: dateStart, end: dateEnd } = getDateRange(dateFilterMode, customFrom, customTo);

            let leadsQuery = supabase
                .from('marketing_leads')
                .select('*, social_conversations!conversation_id(tags, customer_type, interested_products, referral_source, ad_id, source_type, facebook_pages!page_id(name))', { count: 'exact' })
                .gte('created_at', dateStart)
                .lte('created_at', dateEnd);
            if (debouncedLeadsSearch.trim()) {
                leadsQuery = leadsQuery.or(`customer_name.ilike.%${debouncedLeadsSearch.trim()}%,customer_phone.ilike.%${debouncedLeadsSearch.trim()}%`);
            }
            if (leadsStatusFilter !== 'all') {
                leadsQuery = leadsQuery.eq('status', leadsStatusFilter);
            }
            const { data: leadsData, count: leadsCount } = await leadsQuery
                .order('created_at', { ascending: false })
                .range(leadsFrom, leadsTo);
            if (leadsData) setLeads(leadsData);
            if (leadsCount !== null) setTotalLeads(leadsCount);

            // Separate lightweight query for FULL stats across entire date range (no pagination)
            const { data: allStatsData } = await supabase
                .from('marketing_leads')
                .select('assigned_to, status')
                .gte('created_at', dateStart)
                .lte('created_at', dateEnd);

            if (allStatsData) {
                const statsMap: Record<string, number> = {};
                let pending = 0, assigned = 0, historical = 0;
                allStatsData.forEach((l: any) => {
                    if (l.assigned_to) statsMap[l.assigned_to] = (statsMap[l.assigned_to] || 0) + 1;
                    if (l.status === 'pending') pending++;
                    else if (l.status === 'assigned') assigned++;
                    else if (l.status === 'historical') historical++;
                });
                setDistributionStats(statsMap);
                setTotalPending(pending);
                setTotalAssigned(assigned);
                setTotalHistorical(historical);
            }

            // Load follow-up conversations
            const fuFrom = followupsPage * followupsPageSize;
            const fuTo = fuFrom + followupsPageSize - 1;
            let fuQuery = supabase
                .from('social_conversations')
                .select('id, customer_name, external_id, followup_count, last_message_at, needs_followup, tags, interested_products', { count: 'exact' })
                .eq('needs_followup', true)
                .is('customer_phone', null);
            if (debouncedFollowupsSearch.trim()) {
                fuQuery = fuQuery.ilike('customer_name', `%${debouncedFollowupsSearch.trim()}%`);
            }
            const { data: followupData, count: followupCount } = await fuQuery
                .order('last_message_at', { ascending: true })
                .range(fuFrom, fuTo);
            if (followupData) setFollowups(followupData);
            if (followupCount !== null) setTotalFollowups(followupCount);

            // --- Chatbot & AI Stats ---
            const [
                { count: tc }, { count: hp }, { count: af }, { count: paa },
                { count: t1s }, { count: t1p }, { count: t2s }, { count: t2p }, { count: t3s }, { count: t3p }
            ] = await Promise.all([
                supabase.from('social_conversations').select('*', { count: 'exact', head: true }).gte('created_at', dateStart).lte('created_at', dateEnd),
                supabase.from('social_conversations').select('*', { count: 'exact', head: true }).gte('created_at', dateStart).lte('created_at', dateEnd).not('customer_phone', 'is', null),
                supabase.from('social_conversations').select('*', { count: 'exact', head: true }).gte('created_at', dateStart).lte('created_at', dateEnd).gt('followup_count', 0),
                supabase.from('social_conversations').select('*', { count: 'exact', head: true }).gte('created_at', dateStart).lte('created_at', dateEnd).not('customer_phone', 'is', null).gt('followup_count', 0),
                
                // Tier 1 (>=1 sent, =1 phone)
                supabase.from('social_conversations').select('*', { count: 'exact', head: true }).gte('created_at', dateStart).lte('created_at', dateEnd).gte('followup_count', 1),
                supabase.from('social_conversations').select('*', { count: 'exact', head: true }).gte('created_at', dateStart).lte('created_at', dateEnd).not('customer_phone', 'is', null).eq('followup_count', 1),

                // Tier 2 (>=2 sent, =2 phone)
                supabase.from('social_conversations').select('*', { count: 'exact', head: true }).gte('created_at', dateStart).lte('created_at', dateEnd).gte('followup_count', 2),
                supabase.from('social_conversations').select('*', { count: 'exact', head: true }).gte('created_at', dateStart).lte('created_at', dateEnd).not('customer_phone', 'is', null).eq('followup_count', 2),

                // Tier 3 (>=3 sent, =3 phone)
                supabase.from('social_conversations').select('*', { count: 'exact', head: true }).gte('created_at', dateStart).lte('created_at', dateEnd).gte('followup_count', 3),
                supabase.from('social_conversations').select('*', { count: 'exact', head: true }).gte('created_at', dateStart).lte('created_at', dateEnd).not('customer_phone', 'is', null).eq('followup_count', 3)
            ]);
            setChatStats({
                totalConv: tc || 0, hasPhone: hp || 0, aiFollowed: af || 0, phoneAfterAi: paa || 0,
                tier1Sent: t1s || 0, tier1Phone: t1p || 0,
                tier2Sent: t2s || 0, tier2Phone: t2p || 0,
                tier3Sent: t3s || 0, tier3Phone: t3p || 0,
            });

        } catch (err) {
            console.error('Load lead dist data error:', err);
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    }, [leadsPage, leadsPageSize, followupsPage, followupsPageSize, debouncedLeadsSearch, leadsStatusFilter, debouncedFollowupsSearch, dateFilterMode, customFrom, customTo]);

    useEffect(() => { loadData(); }, [loadData]);

    // Fetch my own IP
    useEffect(() => {
        fetch('/api/ip').then(r => r.json()).then(d => setMyIp(d.ip || null)).catch(() => {});
    }, []);

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
            // Parse company IPs from input
            const parsedIps = companyIpInput.split(',').map(s => s.trim()).filter(Boolean);
            const { error } = await supabase
                .from('lead_distribution_config')
                .upsert({
                    id: 1,
                    enabled: config.enabled,
                    eligible_user_ids: config.eligible_user_ids,
                    only_online: config.only_online,
                    only_company_ip: config.only_company_ip,
                    company_ips: parsedIps,
                    fallback_delay_minutes: config.fallback_delay_minutes,
                    updated_at: new Date().toISOString()
                });
            if (!error) setConfig(prev => ({ ...prev, company_ips: parsedIps }));
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

    // Stats — use full date-range counts (not paginated)
    const pendingCount = totalPending;
    const assignedCount = totalAssigned;
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

            {/* Date Filter Tabs */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                    {([['day', '📅 Ngày'], ['week', '📆 Tuần'], ['month', '🗓️ Tháng'], ['year', '📊 Năm'], ['custom', '🎯 Tùy chọn']] as [DateFilterMode, string][]).map(([mode, label]) => (
                        <button
                            key={mode}
                            onClick={() => { setDateFilterMode(mode); setLeadsPage(0); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                dateFilterMode === mode
                                    ? 'bg-white shadow text-blue-600 ring-1 ring-blue-200'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {dateFilterMode === 'custom' && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <label className="text-xs text-slate-500">Từ</label>
                            <input
                                type="date"
                                value={customFrom}
                                onChange={(e) => { setCustomFrom(e.target.value); setLeadsPage(0); }}
                                className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <span className="text-slate-400">→</span>
                        <div className="flex items-center gap-1.5">
                            <label className="text-xs text-slate-500">Đến</label>
                            <input
                                type="date"
                                value={customTo}
                                onChange={(e) => { setCustomTo(e.target.value); setLeadsPage(0); }}
                                className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                )}
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
                    <span className="text-xs font-medium uppercase text-blue-600">{DATE_FILTER_LABELS[dateFilterMode]}</span>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{totalLeads}</p>
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

            {/* Chatbot & AI Stats */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        Hiệu quả Chatbot & AI Follow-up
                    </span>
                    <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">Dữ liệu: {DATE_FILTER_LABELS[dateFilterMode]}</span>
                </h4>
                
                {/* Row 1: Tổng quan Chatbot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 rounded-lg border border-slate-100">
                        <span className="text-[11px] font-medium uppercase text-slate-500">📥 Tổng Inbox</span>
                        <p className="text-xl font-bold text-slate-800 mt-1">{chatStats.totalConv}</p>
                        <p className="text-[10px] text-slate-400">Khách hàng mới</p>
                    </div>
                    <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/30">
                        <span className="text-[11px] font-medium uppercase text-emerald-600">✅ SĐT Tự nhiên</span>
                        <p className="text-xl font-bold text-emerald-700 mt-1">{chatStats.hasPhone - chatStats.phoneAfterAi}</p>
                        <p className="text-[10px] text-emerald-600/70">Không cần AI nhắc ({chatStats.totalConv ? Math.round(((chatStats.hasPhone - chatStats.phoneAfterAi) / chatStats.totalConv) * 100) : 0}%)</p>
                    </div>
                    <div className="p-3 rounded-lg border border-purple-100 bg-purple-50/30">
                        <span className="text-[11px] font-medium uppercase text-purple-600">🤖 AI Đã Xử Lý</span>
                        <p className="text-xl font-bold text-purple-700 mt-1">{chatStats.aiFollowed}</p>
                        <p className="text-[10px] text-purple-600/70">Khách cần Follow-up</p>
                    </div>
                    <div className="p-3 rounded-lg border border-teal-100 bg-teal-50">
                        <span className="text-[11px] font-medium uppercase text-teal-600">🏆 Chốt nhờ AI</span>
                        <p className="text-xl font-bold text-teal-700 mt-1">{chatStats.phoneAfterAi}</p>
                        <p className="text-[10px] text-teal-600/70">Tỉ lệ chốt {chatStats.aiFollowed ? Math.round((chatStats.phoneAfterAi / chatStats.aiFollowed) * 100) : 0}%</p>
                    </div>
                </div>

                {/* Row 2: Phễu AI (Funnel) */}
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                    <span className="text-[11px] font-medium uppercase text-slate-500 mb-3 block">Chi tiết Funnel (Nhắn sau bao lần thì để lại số)</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded shadow-sm border border-slate-100">
                            <span className="text-xs font-semibold text-purple-600 flex items-center gap-1">⏱️ Lần 1 (Sau 1h)</span>
                            <div className="mt-2 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-slate-400 mb-0.5">Đã nhắc</p>
                                    <p className="text-sm font-medium text-slate-700">{chatStats.tier1Sent} <span className="text-[10px] font-normal text-slate-400">khách</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-emerald-600 mb-0.5">Chốt được</p>
                                    <p className="text-sm font-bold text-emerald-600">{chatStats.tier1Phone} <span className="text-[10px] font-medium bg-emerald-100 px-1 py-0.5 rounded">{chatStats.tier1Sent ? Math.round((chatStats.tier1Phone / chatStats.tier1Sent) * 100) : 0}%</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-3 rounded shadow-sm border border-slate-100">
                            <span className="text-xs font-semibold text-purple-600 flex items-center gap-1">⏱️ Lần 2 (Sau 6h)</span>
                            <div className="mt-2 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-slate-400 mb-0.5">Đã nhắc</p>
                                    <p className="text-sm font-medium text-slate-700">{chatStats.tier2Sent} <span className="text-[10px] font-normal text-slate-400">khách</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-emerald-600 mb-0.5">Chốt được</p>
                                    <p className="text-sm font-bold text-emerald-600">{chatStats.tier2Phone} <span className="text-[10px] font-medium bg-emerald-100 px-1 py-0.5 rounded">{chatStats.tier2Sent ? Math.round((chatStats.tier2Phone / chatStats.tier2Sent) * 100) : 0}%</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-3 rounded shadow-sm border border-slate-100">
                            <span className="text-xs font-semibold text-purple-600 flex items-center gap-1">⏱️ Lần 3 (Sau 18h)</span>
                            <div className="mt-2 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-slate-400 mb-0.5">Đã nhắc</p>
                                    <p className="text-sm font-medium text-slate-700">{chatStats.tier3Sent} <span className="text-[10px] font-normal text-slate-400">khách</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-emerald-600 mb-0.5">Chốt được</p>
                                    <p className="text-sm font-bold text-emerald-600">{chatStats.tier3Phone} <span className="text-[10px] font-medium bg-emerald-100 px-1 py-0.5 rounded">{chatStats.tier3Sent ? Math.round((chatStats.tier3Phone / chatStats.tier3Sent) * 100) : 0}%</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-2 text-center">Lưu ý: Khách để lại SĐT ở lần nào sẽ dừng nhắc các lần sau.</p>
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
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.only_company_ip}
                            onChange={(e) => setConfig(prev => ({ ...prev, only_company_ip: e.target.checked }))}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> Chỉ chia cho người tại công ty
                        </span>
                    </label>
                </div>

                {/* Company IP Config */}
                {config.only_company_ip && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-800">IP công ty (cách nhau bằng dấu phẩy)</span>
                        </div>
                        <input
                            type="text"
                            value={companyIpInput}
                            onChange={(e) => setCompanyIpInput(e.target.value)}
                            placeholder="VD: 113.161.72.35, 42.119.148.201"
                            className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                        {myIp && (
                            <p className="mt-2 text-[11px] text-emerald-600">
                                📍 IP hiện tại của bạn: <strong className="font-mono select-all">{myIp}</strong>
                                {config.company_ips.includes(myIp) 
                                    ? <span className="ml-2 text-emerald-700">✅ Đã trong danh sách</span>
                                    : <button 
                                        onClick={() => setCompanyIpInput(prev => prev ? `${prev}, ${myIp}` : myIp)}
                                        className="ml-2 text-blue-600 hover:underline cursor-pointer"
                                      >+ Thêm IP này</button>
                                }
                            </p>
                        )}
                    </div>
                )}

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
                                <div className="flex flex-col items-end gap-0.5">
                                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${user.is_online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        {user.is_online ? 'Online' : 'Offline'}
                                    </span>
                                    {user.is_online && user.current_ip && config.company_ips.length > 0 && (
                                        <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                            config.company_ips.includes(user.current_ip)
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-orange-100 text-orange-600'
                                        }`}>
                                            {config.company_ips.includes(user.current_ip)
                                                ? <><Building2 className="w-2.5 h-2.5" /> Công ty</>
                                                : <><Home className="w-2.5 h-2.5" /> Ngoài</>}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {users.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-6">Chưa có nhân sự telesales nào</p>
                )}
            </div>

            {/* Stats per Telesales — uses full date-range data */}
            {(() => {
                // Build stats from full date-range distributionStats (not paginated)
                const statsByUser: { name: string; count: number }[] = [];
                users.forEach(u => {
                    if (config.eligible_user_ids.includes(u.id)) {
                        statsByUser.push({ name: u.full_name, count: distributionStats[u.id] || 0 });
                    }
                });
                // Also include users who received leads but aren't in eligible list
                Object.entries(distributionStats).forEach(([userId, count]) => {
                    if (!statsByUser.find(s => s.name === (users.find(u => u.id === userId)?.full_name))) {
                        const user = users.find(u => u.id === userId);
                        if (user) statsByUser.push({ name: user.full_name, count });
                    }
                });
                const maxCount = Math.max(...statsByUser.map(s => s.count), 1);

                if (statsByUser.length === 0) return null;

                return (
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                            📊 Thống kê phân chia Data
                            <span className="text-[10px] font-normal text-slate-400 ml-auto">
                                ({DATE_FILTER_LABELS[dateFilterMode]}: {totalLeads} lead)
                            </span>
                        </h4>
                        <div className="space-y-2">
                            {statsByUser.map(s => (
                                <div key={s.name} className="flex items-center gap-3">
                                    <span className="text-xs text-slate-600 w-28 truncate font-medium">{s.name}</span>
                                    <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                                            style={{ width: `${Math.max((s.count / maxCount) * 100, s.count > 0 ? 8 : 0)}%` }}
                                        >
                                            {s.count > 0 && <span className="text-[10px] text-white font-bold">{s.count}</span>}
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500 w-8 text-right">{s.count}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-[10px] text-slate-400">
                            <span>🟢 Đã phân: <strong className="text-emerald-600">{totalAssigned}</strong></span>
                            <span>🟡 Đang chờ: <strong className="text-amber-600">{totalPending}</strong></span>
                            <span>📋 Lịch sử: <strong className="text-slate-600">{totalHistorical}</strong></span>
                        </div>
                    </div>
                );
            })()}

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

                {/* Search & Filter */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <input
                        type="text"
                        placeholder="🔍 Tìm theo tên, SĐT..."
                        value={leadsSearch}
                        onChange={(e) => setLeadsSearch(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                        value={leadsStatusFilter}
                        onChange={(e) => { setLeadsStatusFilter(e.target.value); setLeadsPage(0); }}
                        className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">🟡 Đang chờ</option>
                        <option value="assigned">🟢 Đã phân</option>
                        <option value="historical">📋 Lịch sử</option>
                    </select>
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
                            🔄 Cron mỗi 2h (trong 24h)
                        </span>
                    </div>
                </div>

                {/* Search Follow-up */}
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <input
                        type="text"
                        placeholder="🔍 Tìm theo tên khách..."
                        value={followupsSearch}
                        onChange={(e) => setFollowupsSearch(e.target.value)}
                        className="w-full max-w-sm px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    />
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
