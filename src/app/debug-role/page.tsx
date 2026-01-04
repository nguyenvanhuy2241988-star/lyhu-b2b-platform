'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function DebugRolePage() {
    const { user, role: currentRole, isLoading: authLoading } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const supabase = createClient();
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(data);
        } catch (err) {
            console.error("loadProfile error:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (authLoading) return;
        if (user) {
            loadProfile();
        } else {
            setLoading(false);
        }
    }, [user, authLoading, loadProfile]);

    const updateRole = async (newRole: string) => {
        if (!confirm(`Bạn có chắc muốn đổi role sang: ${newRole}?`)) return;

        const supabase = createClient();
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);

        if (error) {
            alert('Lỗi: ' + error.message);
        } else {
            console.log(`[DebugRole] Role updated to ${newRole}. The AuthProvider realtime subscription will handle the state update.`);
            alert('Thành công! Vai trò đã được cập nhật.');
            // We no longer strictly need logout/login if Realtime sync is active, but a refresh helps clean state.
            window.location.reload();
        }
    };

    if (authLoading || loading) return <div className="p-10 flex items-center gap-2"><div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" /> Loading...</div>;
    if (!user) return <div className="p-10">Chưa đăng nhập. <a href="/login" className="text-blue-600 underline">Login</a></div>;

    const roles = ['admin', 'telesales', 'marketing', 'warehouse', 'recruiter', 'sales', 'ctv', 'customer', 'ecommerce', 'rnd', 'shipper', 'accountant', 'sale_admin', 'livestream'];

    return (
        <div className="p-10 max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">🛠 Công cụ đổi Role (Debug)</h1>

            <div className="bg-slate-100 p-4 rounded-lg">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Current Role (DB):</strong> <span className="font-bold text-red-600">{profile?.role}</span></p>
                <p className="text-sm text-slate-500 mt-2">
                    Lưu ý: Sau khi đổi role, hệ thống sẽ tự động đăng xuất để làm mới phiên làm việc.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {roles.map(r => (
                    <button
                        key={r}
                        onClick={() => updateRole(r)}
                        className={`p-4 rounded-lg border text-left hover:bg-slate-50 transition border-slate-300 ${profile?.role === r ? 'bg-green-50 border-green-500 ring-2 ring-green-200' : ''}`}
                    >
                        <div className="font-bold capitalize">{r}</div>
                        <div className="text-xs text-slate-500">Switch to {r}</div>
                    </button>
                ))}
            </div>

            <div className="mt-8 border-t pt-4">
                <a href="/" className="text-blue-600 underline">Quay về trang chủ</a>
            </div>
        </div>
    );
}
