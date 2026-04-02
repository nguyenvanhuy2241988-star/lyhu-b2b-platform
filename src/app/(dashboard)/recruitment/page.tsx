'use client';

import { useEffect, useState } from 'react';
import { UserPlus, ClipboardList, Users, ArrowRight } from "lucide-react";
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';

export default function RecruitmentDashboard() {
    const [stats, setStats] = useState({
        jobs: 0,
        candidates: 0,
        interviews: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const supabase = createClient();
            const [jobsRes, candRes, intRes] = await Promise.all([
                supabase.from('recruitment_jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
                supabase.from('recruitment_candidates').select('*', { count: 'exact', head: true }).eq('status', 'new'),
                supabase.from('recruitment_interviews').select('*', { count: 'exact', head: true }).eq('status', 'scheduled')
            ]);

            setStats({
                jobs: jobsRes.count || 0,
                candidates: candRes.count || 0,
                interviews: intRes.count || 0
            });
        };
        fetchStats();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Tuyển dụng</h1>
                <p className="text-slate-500 mt-2">Quản lý quy trình tuyển dụng và ứng viên</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/recruitment/candidates" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-50 text-primary-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Ứng viên mới</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.candidates}</h3>
                        </div>
                    </div>
                </Link>

                <Link href="/recruitment/interviews" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                            <ClipboardList className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Phỏng vấn sắp tới</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.interviews}</h3>
                        </div>
                    </div>
                </Link>

                <Link href="/recruitment/jobs" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                            <UserPlus className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Vị trí đang mở</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.jobs}</h3>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Quick Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">Truy cập nhanh</h3>
                    <div className="space-y-3">
                        <Link href="/recruitment/jobs" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-700 transition">
                            <span className="font-medium">Quản lý tin tuyển dụng</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/recruitment/candidates" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-700 transition">
                            <span className="font-medium">Quy trình tuyển dụng (Kanban)</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/recruitment/interviews" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-700 transition">
                            <span className="font-medium">Lịch phỏng vấn</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                <div className="bg-primary-600 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-xl mb-2">Cần tuyển thêm nhân sự?</h3>
                        <p className="text-primary-100 mb-6">Tạo tin tuyển dụng mới và chia sẻ ngay để thu hút ứng viên tiềm năng.</p>
                    </div>
                    <Link href="/recruitment/jobs" className="bg-white text-primary-700 px-4 py-3 rounded-xl font-bold text-center hover:bg-primary-50 transition">
                        + Tạo tin tuyển dụng mới
                    </Link>
                </div>
            </div>
        </div>
    );
}
