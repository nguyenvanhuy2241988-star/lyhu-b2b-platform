"use client";

import React, { useEffect, useState } from "react";
import { AppSettings, fetchAppSettings, updateAppSettings } from "@/lib/settingsStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2, Save, ToggleLeft, ToggleRight, Settings, Share2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function AutomationSettingsPage() {
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // Automation States
    const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);

    useEffect(() => {
        if (session?.access_token) {
            loadSettings();
        }
    }, [session]);

    const loadSettings = async () => {
        setLoading(true);
        const data = await fetchAppSettings(session?.access_token);
        if (data) {
            setSettings(data);
            setAutoAssignEnabled(data.automation_config?.auto_assign_leads || false);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);

        const updatedConfig = {
            ...settings.automation_config,
            auto_assign_leads: autoAssignEnabled
        };

        const success = await updateAppSettings(settings.id, {
            automation_config: updatedConfig
        }, session?.access_token);

        if (success) {
            toast.success("Đã lưu cấu hình tự động!");
            // Update local state to ensure sync
            setSettings({ ...settings, automation_config: updatedConfig });
        } else {
            toast.error("Lỗi khi lưu cấu hình.");
        }
        setSaving(false);
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-500" /> Cấu hình Tự động hóa
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý các quy tắc tự động phân bổ Lead và chăm sóc khách hàng.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-70"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu cấu hình
                </button>
            </div>

            {/* Lead Distribution Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-blue-600" />
                    <h2 className="font-semibold text-slate-800">Phân bổ Lead tự động</h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* Toggle */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-base font-medium text-slate-900">Bật chia số tự động (Round Robin)</h3>
                            <p className="text-slate-500 text-sm mt-1 max-w-xl">
                                Khi Lead mới được tạo (từ Marketing, Facebook, Website) mà chưa có người phụ trách,
                                hệ thống sẽ tự động gán cho nhân viên Sales/Telesales có thời gian nhận số lâu nhất (ưu tiên người đang rảnh).
                            </p>
                        </div>
                        <button
                            onClick={() => setAutoAssignEnabled(!autoAssignEnabled)}
                            className={`flex items-center gap-2 transition-colors ${autoAssignEnabled ? 'text-primary-600' : 'text-slate-400'}`}
                        >
                            {autoAssignEnabled ? (
                                <ToggleRight className="w-10 h-10" />
                            ) : (
                                <ToggleLeft className="w-10 h-10" />
                            )}
                        </button>
                    </div>

                    {/* Additional Rules Placeholder */}
                    {autoAssignEnabled && (
                        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                            <strong>Lưu ý:</strong> Hệ thống sẽ chia đều cho các tài khoản có quyền <code>Telesales</code> hoặc <code>Sales</code>.
                            Đảm bảo nhân viên đã được tạo tài khoản và phân quyền chính xác.
                        </div>
                    )}
                </div>
            </div>

            {/* Email Automation Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden opacity-60">
                <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-600" />
                    <h2 className="font-semibold text-slate-800">Tự động hóa Email (Sắp ra mắt)</h2>
                </div>
                <div className="p-6">
                    <p className="text-slate-500 text-sm">Tính năng gửi email chào mừng và chăm sóc tự động đang được phát triển.</p>
                </div>
            </div>
        </div>
    );
}
