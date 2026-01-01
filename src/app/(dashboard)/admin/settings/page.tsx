"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success("Đã lưu cài đặt hệ thống (Demo)");
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Cài đặt hệ thống</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Cấu hình chung cho toàn bộ ứng dụng
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* General Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Thông tin chung</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tên ứng dụng</label>
                            <input
                                disabled
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
                                value="LYHU CRM"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phiên bản</label>
                            <input
                                disabled
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-500"
                                value="v1.0.0"
                            />
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Thông báo</h2>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                            <span className="text-sm text-slate-700">Email khi có đơn hàng mới</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                            <span className="text-sm text-slate-700">Thông báo đẩy (Push Notification)</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm text-slate-700">Âm thanh cảnh báo</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu thay đổi
                </button>
            </div>
        </div>
    );
}
