"use client";

import { useState, useEffect } from "react";
import { Bell, Lock, Globe, Moon, Laptop, Sun, Save, ShieldCheck, UserCircle, Mail, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export default function SettingsPage() {
    const { session } = useAuth();
    const [theme, setTheme] = useState("system");
    const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'security' | 'language'>('account');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        mentions: true,
        orders: false
    });

    // Password change state
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
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
        if (newTheme === 'dark') {
            root.classList.add('dark');
        } else if (newTheme === 'light') {
            root.classList.remove('dark');
        } else {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.newPassword.length < 6) {
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }

        setIsChangingPassword(true);
        try {
            // Verify current password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: session?.user?.email || "",
                password: passwordForm.currentPassword
            });

            if (signInError) {
                toast.error("Mật khẩu hiện tại không đúng");
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordForm.newPassword
            });

            if (updateError) {
                toast.error("Lỗi: " + updateError.message);
                return;
            }

            toast.success("Đổi mật khẩu thành công!");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            toast.error("Có lỗi xảy ra: " + err.message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-950 p-6 md:p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-8 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Cài đặt hệ thống</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý tùy chọn cá nhân và thiết lập bảo mật của bạn.</p>
                    </div>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="md:col-span-1 space-y-1">
                    <button onClick={() => setActiveSection('account')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeSection === 'account' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <UserCircle className="w-4 h-4" />
                        Tài khoản
                    </button>
                    <button onClick={() => setActiveSection('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeSection === 'security' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <Lock className="w-4 h-4" />
                        Bảo mật
                    </button>
                    <button onClick={() => setActiveSection('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeSection === 'notifications' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <Bell className="w-4 h-4" />
                        Thông báo
                    </button>
                    <button onClick={() => setActiveSection('language')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeSection === 'language' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <Globe className="w-4 h-4" />
                        Ngôn ngữ
                    </button>
                </div>

                {/* Main Content */}
                <div className="md:col-span-3 space-y-8">

                    {/* === ACCOUNT SECTION === */}
                    {activeSection === 'account' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Giao diện & Trải nghiệm</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tùy chỉnh màu sắc hiển thị phù hợp với mắt bạn.</p>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <button onClick={() => applyTheme("light")} className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'border-primary ring-1 ring-primary bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}><Sun className="w-5 h-5" /></div>
                                    <span className={`text-sm font-medium ${theme === 'light' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>Sáng</span>
                                </button>
                                <button onClick={() => applyTheme("dark")} className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'border-primary ring-1 ring-primary bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}><Moon className="w-5 h-5" /></div>
                                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>Tối</span>
                                </button>
                                <button onClick={() => applyTheme("system")} className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${theme === 'system' ? 'border-primary ring-1 ring-primary bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'system' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}><Laptop className="w-5 h-5" /></div>
                                    <span className={`text-sm font-medium ${theme === 'system' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>Hệ thống</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === SECURITY SECTION === */}
                    {activeSection === 'security' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Bảo mật tài khoản</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý mật khẩu và bảo vệ tài khoản của bạn.</p>
                            </div>

                            {isGoogleUser ? (
                                /* Google user - no password change */
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-5 flex items-start gap-4">
                                    <div className="p-2.5 bg-blue-100 dark:bg-blue-800 rounded-lg shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">Tài khoản Google</h4>
                                        <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-1 leading-relaxed">
                                            Bạn đang đăng nhập bằng tài khoản Google (<strong>{session?.user?.email}</strong>). 
                                            Mật khẩu được quản lý bởi Google, không thể thay đổi tại đây.
                                        </p>
                                        <p className="text-xs text-blue-600/60 dark:text-blue-400/60 mt-2">
                                            Để đổi mật khẩu, vui lòng truy cập <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-800">Google Account Security</a>.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* Email user - password change form */
                                <form onSubmit={handleChangePassword} className="space-y-5">
                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                            Sau khi đổi mật khẩu, bạn cần đăng nhập lại với mật khẩu mới. Hãy ghi nhớ mật khẩu cẩn thận.
                                        </p>
                                    </div>

                                    {/* Current Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mật khẩu hiện tại</label>
                                        <div className="relative">
                                            <input
                                                required
                                                type={showPasswords.current ? "text" : "password"}
                                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                                placeholder="Nhập mật khẩu hiện tại..."
                                                value={passwordForm.currentPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            />
                                            <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mật khẩu mới</label>
                                        <div className="relative">
                                            <input
                                                required
                                                minLength={6}
                                                type={showPasswords.new ? "text" : "password"}
                                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                                placeholder="Tối thiểu 6 ký tự..."
                                                value={passwordForm.newPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            />
                                            <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Xác nhận mật khẩu mới</label>
                                        <div className="relative">
                                            <input
                                                required
                                                minLength={6}
                                                type={showPasswords.confirm ? "text" : "password"}
                                                className={`w-full border rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}
                                                placeholder="Nhập lại mật khẩu mới..."
                                                value={passwordForm.confirmPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            />
                                            <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                                            <p className="text-xs text-red-500 mt-1.5">Mật khẩu xác nhận không khớp</p>
                                        )}
                                        {passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword && passwordForm.newPassword.length >= 6 && (
                                            <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Mật khẩu khớp</p>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-600 text-white rounded-xl font-medium text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isChangingPassword ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                                            ) : (
                                                <><Lock className="w-4 h-4" /> Cập nhật mật khẩu</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* === NOTIFICATIONS SECTION === */}
                    {activeSection === 'notifications' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Cấu hình thông báo</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Chọn loại thông báo bạn muốn nhận.</p>
                            </div>
                            <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400"><Mail className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">Thông báo Email</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nhận cập nhật quan trọng qua hòm thư.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={notifications.email} onChange={() => setNotifications({ ...notifications, email: !notifications.email })} />
                                        <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400"><Bell className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">Thông báo đẩy (Push)</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hiển thị popup khi có tin nhắn mới.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={notifications.push} onChange={() => setNotifications({ ...notifications, push: !notifications.push })} />
                                        <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === LANGUAGE SECTION === */}
                    {activeSection === 'language' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ngôn ngữ</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Chọn ngôn ngữ hiển thị cho giao diện.</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">Hiện tại hệ thống chỉ hỗ trợ <strong>Tiếng Việt</strong>.</p>
                            </div>
                        </div>
                    )}

                    {/* Support Block */}
                    <div className="bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-xl p-4 flex items-start gap-3 mt-4">
                        <ShieldCheck className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100">Cần trợ giúp thêm?</h4>
                            <p className="text-xs text-primary-700/80 dark:text-primary-300/80 mt-1 leading-relaxed">Nếu bạn gặp bất kỳ vấn đề nào với cài đặt, vui lòng liên hệ đội ngũ Kỹ thuật (Huy Admin) qua mục Tin nhắn nội bộ.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
