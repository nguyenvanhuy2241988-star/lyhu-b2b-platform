'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, MapPin, Clock, ArrowLeft, Users, DollarSign, CheckCircle, XCircle, Edit, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import RichTextEditor from "@/components/ui/RichTextEditor";
import EventFormModal from "../CreateEventModal";

interface EventDetail {
    id: string;
    title: string;
    description: string;
    event_type: string;
    start_time: string;
    end_time: string;
    location: string;
    banner_url: string | null;
    status: string;
    budget_total: number;
}

interface Participant {
    max_participants: number | undefined;
    id: string;
    user_id: string;
    status: string;
    profiles: {
        full_name: string;
        email: string;
        avatar_url: string | null;
    };
}

interface BudgetItem {
    id: string;
    item_name: string;
    amount: number;
    is_paid: boolean;
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'budget'>('overview');

    // Rich Text Editor State
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const saveDescription = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('hr_events')
                .update({ description })
                .eq('id', id);

            if (error) throw error;
            // alert('Đã lưu nội dung!'); 
        } catch (err) {
            console.error(err);
            alert('Lỗi khi lưu nội dung');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Get User Role
                const user = await getCurrentUser();
                setRole(user?.role || null);

                // 2. Fetch Event Details
                const { data: eventData, error: eventError } = await supabase
                    .from('hr_events')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (eventError) throw eventError;
                setEvent(eventData);
                setDescription(eventData.description || '');

                // 3. Fetch specific data based on role
                const isAdminOrHr = user?.role === 'admin' || user?.role === 'recruiter';

                if (isAdminOrHr) {
                    // Fetch Budget
                    const { data: budgetData } = await supabase
                        .from('hr_event_budget')
                        .select('*')
                        .eq('event_id', id);
                    if (budgetData) setBudgetItems(budgetData);

                    // Fetch Participants (Split queries to avoid join error)
                    const { data: partData, error: partError } = await supabase
                        .from('hr_event_participants')
                        .select('*')
                        .eq('event_id', id);

                    if (partData && partData.length > 0) {
                        // Manual join for profiles
                        const userIds = partData.map((p: any) => p.user_id);
                        const { data: profilesData } = await supabase
                            .from('profiles')
                            .select('id, full_name, email, avatar_url')
                            .in('id', userIds);

                        const profileMap = (profilesData || []).reduce((acc: any, profile: any) => {
                            acc[profile.id] = profile;
                            return acc;
                        }, {} as Record<string, any>);

                        const mergedParticipants = partData.map((p: any) => ({
                            ...p,
                            profiles: profileMap[p.user_id] || { full_name: 'Người dùng', email: '' }
                        }));

                        setParticipants(mergedParticipants as any);
                    } else {
                        setParticipants([]);
                    }
                } else {
                    // Normal user logic
                }

            } catch (err: any) {
                console.error("Error loading event:", err);
                // router.push('/events'); // Redirect on error or not found?
            } finally {
                setLoading(false);
            }
        };

        if (id) init();
    }, [id, router]);

    const handleJoin = async (status: 'going' | 'not_going') => {
        const user = await getCurrentUser();
        if (!user) return;

        try {
            const { error } = await supabase
                .from('hr_event_participants')
                .upsert({
                    event_id: id,
                    user_id: user.id,
                    status: status
                }, { onConflict: 'event_id, user_id' });

            if (error) throw error;
            alert(status === 'going' ? "Đã đăng ký tham gia!" : "Đã từ chối tham gia.");

            // Refresh
            // For now just reload basic logic or optimize
        } catch (e) {
            console.error(e);
            alert("Có lỗi xảy ra");
        }
    };

    if (loading) return <div className="p-10 text-center">Đang tải...</div>;
    if (!event) return <div className="p-10 text-center">Không tìm thấy sự kiện</div>;

    const isAdminOrHr = role === 'admin' || role === 'recruiter';
    const totalBudget = budgetItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header / Banner */}
            <div className="relative h-[300px] w-full bg-slate-900 group">
                {event.banner_url ? (
                    <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center opacity-80">
                        <span className="text-4xl text-white/20 font-bold tracking-widest uppercase">{event.event_type}</span>
                    </div>
                )}

                <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                    <button
                        onClick={() => router.push('/events')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-all text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </button>

                    {isAdminOrHr && (
                        <EventFormModal
                            initialData={event}
                            eventId={event.id}
                            onSuccess={() => window.location.reload()}
                            trigger={
                                <button className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-full transition-colors font-medium text-sm">
                                    <Edit className="w-4 h-4" />
                                    Chỉnh sửa
                                </button>
                            }
                        />
                    )}
                </div>

                <div className="absolute inset-0 flex items-end">
                    <div className="w-full p-8 text-white relative z-10">
                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-4 border border-white/10">
                            {event.status === 'draft' ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                                    <span>Bản nháp</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-green-400" />
                                    <span>{event.event_type.toUpperCase()}</span>
                                </>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{event.title}</h1>

                        <div className="flex flex-wrap items-center gap-6 text-white/90">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                <span className="text-lg capitalize">
                                    {format(new Date(event.start_time), "EEEE, dd/MM/yyyy", { locale: vi })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                <span className="text-lg">
                                    {format(new Date(event.start_time), "HH:mm")} - {format(new Date(event.end_time), "HH:mm")}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                <span className="text-lg">{event.location}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-8 relative z-10">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs Navigation */}
                    {isAdminOrHr && (
                        <div className="flex border-b border-slate-200">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={cn(
                                    "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                                    activeTab === 'overview' ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Tổng quan
                            </button>
                            <button
                                onClick={() => setActiveTab('participants')}
                                className={cn(
                                    "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                                    activeTab === 'participants' ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Người tham gia ({participants.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('budget')}
                                className={cn(
                                    "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                                    activeTab === 'budget' ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Ngân sách
                            </button>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">Chi tiết sự kiện</h3>
                                    {isAdminOrHr && (
                                        <button
                                            onClick={saveDescription}
                                            disabled={saving}
                                            className="text-sm px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
                                        >
                                            {saving ? 'Đang lưu...' : 'Lưu nội dung'}
                                        </button>
                                    )}
                                </div>
                                <div className="min-h-[200px]">
                                    <RichTextEditor
                                        content={description}
                                        editable={isAdminOrHr}
                                        onChange={setDescription}
                                    />
                                </div>
                            </section>

                            {!isAdminOrHr && (
                                <section className="pt-6 border-t border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-teal-600" />
                                        Bạn sẽ tham gia chứ?
                                    </h3>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleJoin('going')}
                                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Chắc chắn tham gia
                                        </button>
                                        <button
                                            onClick={() => handleJoin('not_going')}
                                            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-medium flex items-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Xin vắng mặt
                                        </button>
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {activeTab === 'participants' && isAdminOrHr && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold mb-4">Danh sách đăng ký ({participants.length})</h3>
                            <div className="divide-y">
                                {participants.length === 0 ? (
                                    <p className="py-4 text-slate-500 italic">Chưa có ai đăng ký.</p>
                                ) : (
                                    participants.map((p) => (
                                        <div key={p.id} className="py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                                    {p.profiles?.full_name?.charAt(0) || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{p.profiles?.full_name || "Người dùng ẩn"}</p>
                                                    <p className="text-xs text-slate-500">{p.profiles?.email}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    p.status === 'going' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {p.status === 'going' ? 'Tham gia' : 'Vắng mặt'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'budget' && isAdminOrHr && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Quản lý Ngân sách</h3>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">Tổng chi phí</p>
                                    <p className="text-2xl font-bold text-slate-900">{totalBudget.toLocaleString('vi-VN')} đ</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="pb-3 text-left">Hạng mục</th>
                                            <th className="pb-3 text-right">Số tiền</th>
                                            <th className="pb-3 text-right">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {budgetItems.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-3 font-medium text-slate-700">{item.item_name}</td>
                                                <td className="py-3 text-right font-mono text-slate-600">{Number(item.amount).toLocaleString('vi-VN')} đ</td>
                                                <td className="py-3 text-right">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-xs font-medium",
                                                        item.is_paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                                    )}>
                                                        {item.is_paid ? "Đã chi" : "Dự kiến"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {budgetItems.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-4 text-center text-slate-400 italic">Chưa có hạng mục chi tiêu nào.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {/* Future improvement: Add Row Form */}
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-semibold mb-4 text-slate-900">Thông tin nhanh</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Thời gian</p>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        {format(new Date(event.start_time), "dd/MM/yyyy HH:mm", { locale: vi })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Địa điểm</p>
                                    <p className="text-sm text-slate-500 mt-0.5">{event.location}</p>
                                </div>
                            </div>
                            {isAdminOrHr && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Ngân sách dự kiến</p>
                                        <p className="text-sm text-slate-500 mt-0.5">{Number(event.budget_total || 0).toLocaleString('vi-VN')} đ</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
