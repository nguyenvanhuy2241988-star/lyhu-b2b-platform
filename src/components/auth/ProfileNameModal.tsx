"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileNameModalProps {
    userId: string;
    currentName?: string;
    userEmail?: string;
    onNameUpdated: (newName: string) => void;
}

export function ProfileNameModal({ userId, currentName, userEmail, onNameUpdated }: ProfileNameModalProps) {
    const isInvalidName = !currentName || currentName.trim() === '-' || currentName.trim().length < 2;
    const [isOpen, setIsOpen] = useState(isInvalidName);
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        setIsOpen(!currentName || currentName.trim() === '-' || currentName.trim().length < 2);
    }, [currentName]);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanName = name.trim();

        if (!cleanName || cleanName === '-' || cleanName.length < 2) {
            setErrorMsg("Họ và Tên phải có ít nhất 2 ký tự và không được là '-'");
            return;
        }

        setIsSaving(true);
        setErrorMsg("");

        try {
            // 1. Update profiles table
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ 
                    full_name: cleanName,
                    updated_at: new Date().toISOString()
                })
                .eq("id", userId);

            if (profileError) throw profileError;

            // 2. Update Auth metadata
            await supabase.auth.updateUser({
                data: { full_name: cleanName, name: cleanName }
            });

            toast.success(`Xin chào ${cleanName}! Hồ sơ đã được cập nhật thành công.`);
            setIsOpen(false);
            onNameUpdated(cleanName);
        } catch (err: any) {
            console.error("[ProfileNameModal] Error saving name:", err);
            setErrorMsg(err.message || "Không thể cập nhật Họ và Tên. Vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 overflow-hidden relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00ABA9]">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Cập nhật Họ và Tên</h3>
                        <p className="text-xs text-slate-500">{userEmail}</p>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                        Tài khoản của bạn chưa có Họ và Tên thật. Vui lòng nhập đầy đủ để hệ thống ghi nhận công việc, phân công đơn hàng và tính KPI/lương chính xác.
                    </span>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Họ và Tên đầy đủ <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errorMsg) setErrorMsg("");
                            }}
                            placeholder="Ví dụ: Nguyễn Văn An"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00ABA9] focus:bg-white transition-all text-slate-800 font-medium"
                        />
                        {errorMsg && (
                            <p className="text-rose-600 text-xs mt-1.5 font-medium">{errorMsg}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 bg-[#00ABA9] hover:bg-[#009795] text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Xác nhận & Bắt đầu làm việc
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
