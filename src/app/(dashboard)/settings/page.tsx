"use client";

import { useState, useEffect } from "react";
import { Bell, Lock, Moon, Laptop, Sun, ShieldCheck, UserCircle, Mail, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, Globe } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export default function SettingsPage() {
    const { session, user } = useAuth();
    const [theme, setTheme] = useState("system");
    const [activeSection, setActiveSection] = useState<'account' | 'security' | 'notifications'>('account');
    const [notifications, setNotifications] = useState({ email: true, push: true });

    // Password change state
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'system';
        setTheme(savedTheme);
    }, []);

    useEffect(() => {
        if (session?.user) {
            const provider = session.user.app_metadata?.provider;
            setIsGoogleUser(provider === 'google');
        }
    }, [session]);

    const applyTheme = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        const root = document.documentElement;
        if (newTheme === 'dark') root.classList.add('dark');
        else if (newTheme === 'light') root.classList.remove('dark');
        else {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
            else root.classList.remove('dark');
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword.length < 6) { toast.error("Mật khẩu mới phải có ít nhất 6 ký tự"); return; }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error("Mật khẩu xác nhận không khớp"); return; }

        setIsChangingPassword(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: session?.user?.email || "",
                password: passwordForm.currentPassword
            });
            if (signInError) { toast.error("Mật khẩu hiện tại không đúng"); return; }

            const { error: updateError } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
            if (updateError) { toast.error("Lỗi: " + updateError.message); return; }

            toast.success("Đổi mật khẩu thành công!");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            toast.error("Có lỗi xảy ra: " + err.message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const navItems = [
        { key: 'account' as const, label: 'Giao diện', icon: UserCircle },
        { key: 'security' as const, label: 'Bảo mật', icon: Lock },
        { key: 'notifications' as const, label: 'Thông báo', icon: Bell },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-800">Cài đặt</h1>
                <p className="text-sm text-slate-500 mt-0.5">Quản lý tùy chọn cá nhân và bảo mật tài khoản.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <div className="md:w-48 shrink-0">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {navItems.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setActiveSection(item.key)}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors border-l-2
                                    ${activeSection === item.key
                                        ? 'bg-primary-50 text-primary-700 border-primary'
                                        : 'text-slate-600 hover:bg-slate-50 border-transparent'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-xl border border-slate-200 p-6">

                        {/* === GIAO DIỆN === */}
                        {activeSection === 'account' && (
                            <div>
                                <h3 className="text-base font-bold text-slate-800 mb-1">Giao diện</h3>
                                <p className="text-sm text-slate-500 mb-5">Tùy chỉnh chế độ hiển thị.</p>

                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { key: 'light', label: 'Sáng', Icon: Sun },
                                        { key: 'dark', label: 'Tối', Icon: Moon },
                                        { key: 'system', label: 'Hệ thống', Icon: Laptop },
                                    ].map(({ key, label, Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => applyTheme(key)}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2.5
                                                ${theme === key
                                                    ? 'border-primary bg-primary-50/60'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${theme === key ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className={`text-xs font-medium ${theme === key ? 'text-primary-700' : 'text-slate-500'}`}>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* === BẢO MẬT === */}
                        {activeSection === 'security' && (
                            <div>
                                <h3 className="text-base font-bold text-slate-800 mb-1">Bảo mật</h3>
                                <p className="text-sm text-slate-500 mb-5">Quản lý mật khẩu đăng nhập.</p>

                                {isGoogleUser ? (
                                    <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">Tài khoản Google</p>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                Bạn đang sử dụng <strong>{session?.user?.email}</strong>. Mật khẩu do Google quản lý.
                                            </p>
                                            <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer"
                                               className="inline-block mt-2 text-xs text-primary font-medium hover:underline">
                                                Đổi mật khẩu tại Google →
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-lg p-3">
                                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-700 leading-relaxed">Sau khi đổi mật khẩu, bạn cần đăng nhập lại.</p>
                                        </div>

                                        {/* Current */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
                                            <div className="relative">
                                                <input required type={showPasswords.current ? "text" : "password"}
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-9 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                                    placeholder="Nhập mật khẩu hiện tại"
                                                    value={passwordForm.currentPassword}
                                                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                />
                                                <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showPasswords.current ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* New */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
                                            <div className="relative">
                                                <input required minLength={6} type={showPasswords.new ? "text" : "password"}
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-9 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                                    placeholder="Tối thiểu 6 ký tự"
                                                    value={passwordForm.newPassword}
                                                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                />
                                                <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showPasswords.new ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Confirm */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                                            <div className="relative">
                                                <input required minLength={6} type={showPasswords.confirm ? "text" : "password"}
                                                    className={`w-full border rounded-lg px-3 py-2 pr-9 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none
                                                        ${passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword ? 'border-red-300' : 'border-slate-300'}`}
                                                    placeholder="Nhập lại mật khẩu mới"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                />
                                                <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showPasswords.confirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                            {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                                                <p className="text-xs text-red-500 mt-1">Không khớp</p>
                                            )}
                                            {passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword && passwordForm.newPassword.length >= 6 && (
                                                <p className="text-xs text-primary mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Khớp</p>
                                            )}
                                        </div>

                                        <button type="submit"
                                            disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                                            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {isChangingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><Lock className="w-4 h-4" /> Cập nhật mật khẩu</>}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* === THÔNG BÁO === */}
                        {activeSection === 'notifications' && (
                            <div>
                                <h3 className="text-base font-bold text-slate-800 mb-1">Thông báo</h3>
                                <p className="text-sm text-slate-500 mb-5">Chọn loại thông báo bạn muốn nhận.</p>

                                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                                    {[
                                        { key: 'email' as const, icon: Mail, title: 'Thông báo Email', desc: 'Nhận cập nhật qua hòm thư.' },
                                        { key: 'push' as const, icon: Bell, title: 'Thông báo đẩy', desc: 'Popup khi có tin nhắn mới.' },
                                    ].map(({ key, icon: Icon, title, desc }) => (
                                        <div key={key} className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Icon className="w-4 h-4" /></div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={notifications[key]} onChange={() => setNotifications({ ...notifications, [key]: !notifications[key] })} />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Help */}
                    <div className="mt-4 bg-primary-50/50 border border-primary-100 rounded-xl p-4 flex items-start gap-3">
                        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-primary-800 leading-relaxed">
                            {user?.role === 'customer' ? (
                                <>Liên hệ với đội ngũ kỹ thuật LYHU qua tin nhắn hoặc hotline, Zalo <strong>0368 368 834</strong>.</>
                            ) : (
                                <>Cần trợ giúp? Liên hệ đội Kỹ thuật qua <strong>Tin nhắn nội bộ</strong>.</>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
