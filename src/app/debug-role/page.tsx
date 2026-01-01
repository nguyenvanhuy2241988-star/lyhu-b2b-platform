'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function DebugRolePage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(data);
            }
        } catch (err) {
            console.error("loadData error:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (newRole: string) => {
        if (!confirm(`Bạn có chắc muốn đổi role sang: ${newRole}?`)) return;

        const supabase = createClient();
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);

        if (error) {
            alert('Lỗi: ' + error.message);
        } else {
            alert('Thành công! Hãy logout và login lại để áp dụng.');
            // Force logout
            await supabase.auth.signOut();
            router.push('/login');
        }
    };

    if (loading) return <div className="p-10">Loading...</div>;
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
